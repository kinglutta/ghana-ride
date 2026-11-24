const rideModel = require('../models/ride.model');
const captainModel = require('../models/captain.model');
const mapService = require('./maps.service');
const SurgePricingService = require('./surge.service');
const crypto = require('crypto');

/**
 * Vehicle category base fares and rates (Ghana Cedis).
 * Motor and Okada are distinct motorcycle rides; Pragya is a passenger tricycle.
 */
const VEHICLE_CONFIG = Object.freeze({
    auto:    { base: 25, perKm: 8,  perMin: 1.5, multiplier: 0.8 },
    moto:    { base: 20, perKm: 6,  perMin: 1.2, multiplier: 0.7 },
    car:     { base: 50, perKm: 15, perMin: 3,   multiplier: 1.0 },
    comfort: { base: 70, perKm: 20, perMin: 4,   multiplier: 1.4 },
    xl:      { base: 90, perKm: 25, perMin: 5,   multiplier: 1.8 },
    bike:    { base: 15, perKm: 5,  perMin: 1,   multiplier: 0.6 },
    motor:   { base: 12, perKm: 4,  perMin: 0.8, multiplier: 0.5 },
    okada:   { base: 15, perKm: 5,  perMin: 1,   multiplier: 0.6 },
    pragya:  { base: 20, perKm: 6,  perMin: 1.2, multiplier: 0.7 },
});

const RIDER_VEHICLE_TYPES = Object.keys(VEHICLE_CONFIG);

function buildFare(type, distanceTime, surge, lat, lng) {
    const config = VEHICLE_CONFIG[type] || VEHICLE_CONFIG.car;
    const distanceKm = distanceTime.distance.value / 1000;
    const durationMin = distanceTime.duration.value / 60;

    const baseFare = Math.round(
        config.base + (distanceKm * config.perKm) + (durationMin * config.perMin)
    ) * config.multiplier;

    const surgeMultiplier = surge.multiplier;
    const finalFare = SurgePricingService.applySurge(baseFare, surgeMultiplier);

    return {
        vehicleType: type,
        baseFare: Math.round(baseFare * 100) / 100,
        surgeMultiplier,
        surgeReason: surge.reason,
        surgeFactor: Math.round((surgeMultiplier - 1) * 100),
        finalFare: Math.round(finalFare * 100) / 100,
        distanceKm: Math.round(distanceKm * 100) / 100,
        durationMin: Math.round(durationMin),
        currency: 'GHS',
        pickup: { lat, lng },
    };
}

async function fareContext(pickup, destination, lat, lng) {
    if (!pickup || !destination) {
        throw new Error('Pickup and destination are required');
    }

    const [distanceTime, surge] = await Promise.all([
        mapService.getDistanceTime(pickup, destination),
        SurgePricingService.calculateSurge(lat, lng),
    ]);

    return { distanceTime, surge };
}

/**
 * Calculate the fare for one vehicle type.
 * @param {string} pickup
 * @param {string} destination
 * @param {string} vehicleType
 * @param {number} lat
 * @param {number} lng
 */
async function getFare(pickup, destination, vehicleType = 'car', lat, lng) {
    const { distanceTime, surge } = await fareContext(pickup, destination, lat, lng);
    return buildFare(vehicleType, distanceTime, surge, lat, lng);
}

/**
 * One route/trip calculation powers every vehicle price, so the rider can
 * compare options without paying for separate map requests per type.
 */
async function getFareMatrix(pickup, destination, lat, lng) {
    const { distanceTime, surge } = await fareContext(pickup, destination, lat, lng);
    const fares = {};

    for (const type of RIDER_VEHICLE_TYPES) {
        fares[type] = buildFare(type, distanceTime, surge, lat, lng);
    }

    return {
        currency: 'GHS',
        distanceKm: fares.car.distanceKm,
        durationMin: fares.car.durationMin,
        surgeMultiplier: surge.multiplier,
        surgeReason: surge.reason,
        fares,
    };
}

module.exports.getFare = getFare;
module.exports.getFareMatrix = getFareMatrix;
module.exports.VEHICLE_TYPES = RIDER_VEHICLE_TYPES;

function getOtp(num) {
    return crypto.randomInt(Math.pow(10, num - 1), Math.pow(10, num)).toString();
}

module.exports.createRide = async ({
    user, pickup, destination, vehicleType, lat, lng, paymentMethod = 'cash'
}) => {
    if (!user || !pickup || !destination || !vehicleType) {
        throw new Error('All fields are required');
    }

    const fare = await getFare(pickup, destination, vehicleType, lat, lng);

    return rideModel.create({
        user,
        pickup,
        destination,
        vehicleType,
        otp: getOtp(6),
        fare: fare.finalFare,
        distance: Math.round(fare.distanceKm * 1000),
        duration: Math.round(fare.durationMin * 60),
        paymentMethod,
        paymentStatus: paymentMethod === 'cash' ? 'cash' : 'pending',
    });
};

/**
 * An atomic claim: only an unassigned, still-pending ride can be accepted.
 * This prevents two Captains from winning the same offer.
 */
module.exports.confirmRide = async ({ rideId, captain }) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    const claim = await rideModel.findOneAndUpdate(
        { _id: rideId, status: 'pending', captain: { $exists: false } },
        { $set: { status: 'accepted', captain: captain._id } },
        { new: true }
    );

    if (!claim) {
        const existing = await rideModel.findById(rideId).lean();
        throw new Error(existing && existing.captain
            ? 'Ride was already accepted by another Captain'
            : 'Ride is no longer available');
    }

    await captainModel.findByIdAndUpdate(captain._id, { $set: { onRide: true } });

    // OTP stays hidden from the Captain; it is delivered only to the Rider.
    return rideModel.findOne({ _id: rideId }).populate('user').populate('captain');
};

module.exports.startRide = async ({ rideId, otp, captain }) => {
    if (!rideId || !otp) {
        throw new Error('Ride id and OTP are required');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        captain: captain._id,
        status: 'accepted',
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found or not assigned to you');
    }

    if (ride.otp !== otp) {
        throw new Error('Invalid OTP');
    }

    ride.status = 'ongoing';
    await ride.save();

    // Hide the secret before this object is returned to any client.
    ride.otp = undefined;
    return ride;
};

module.exports.endRide = async ({ rideId, captain }) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        captain: captain._id,
        status: 'ongoing',
    }).populate('user').populate('captain');

    if (!ride) {
        throw new Error('Ride not found or not ongoing');
    }

    ride.status = 'completed';
    await ride.save();

    // Earnings and ride count are credited on completion, not on rating.
    await captainModel.findByIdAndUpdate(captain._id, {
        $set: { onRide: false },
        $inc: { totalRides: 1, earnings: ride.fare || 0 },
    });

    return ride;
};

module.exports.cancelRide = async ({ rideId, user }) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    const ride = await rideModel.findOneAndUpdate(
        { _id: rideId, user, status: { $in: ['pending', 'accepted'] } },
        { $set: { status: 'cancelled' } },
        { new: true }
    ).populate('user').populate('captain');

    if (!ride) {
        throw new Error('Ride cannot be cancelled');
    }

    if (ride.captain) {
        await captainModel.findByIdAndUpdate(ride.captain._id, { $set: { onRide: false } });
    }

    return ride;
};
