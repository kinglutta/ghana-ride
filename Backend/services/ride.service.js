const rideModel = require('../models/ride.model');
const mapService = require('./maps.service');
const SurgePricingService = require('./surge.service');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

/**
 * Calculate fare with surge pricing and vehicle categories
 * @param {string} pickup - pickup address
 * @param {string} destination - destination address
 * @param {string} vehicleType - 'auto' | 'car' | 'moto' | 'xl' | 'comfort' | 'bike'
 * @param {number} lat - pickup latitude for surge calculation
 * @param {number} lng - pickup longitude for surge calculation
 * @returns {Object} fare breakdown with surge info
 */
async function getFare(pickup, destination, vehicleType = 'car', lat, lng) {

    if (!pickup || !destination) {
        throw new Error('Pickup and destination are required');
    }

    const distanceTime = await mapService.getDistanceTime(pickup, destination);

    // Vehicle category base fares and rates (Ghana Cedis)
    const vehicleConfig = {
        auto:    { base: 25, perKm: 8,  perMin: 1.5, multiplier: 0.8 },
        moto:    { base: 20, perKm: 6,  perMin: 1.2, multiplier: 0.7 },
        car:     { base: 50, perKm: 15, perMin: 3,   multiplier: 1.0 },
        comfort: { base: 70, perKm: 20, perMin: 4,   multiplier: 1.4 },
        xl:      { base: 90, perKm: 25, perMin: 5,   multiplier: 1.8 },
        bike:    { base: 15, perKm: 5,  perMin: 1,   multiplier: 0.6 },
    };

    const config = vehicleConfig[vehicleType] || vehicleConfig.car;

    const distanceKm = distanceTime.distance.value / 1000;
    const durationMin = distanceTime.duration.value / 60;

    const baseFare = Math.round(
        config.base + (distanceKm * config.perKm) + (durationMin * config.perMin)
    ) * config.multiplier;

    // Calculate surge multiplier based on demand/supply at pickup location
    const surge = await SurgePricingService.calculateSurge(lat, lng);
    const surgeMultiplier = surge.multiplier;
    const finalFare = SurgePricingService.applySurge(baseFare, surgeMultiplier);

    return {
        vehicleType,
        baseFare: Math.round(baseFare * 100) / 100,
        surgeMultiplier,
        surgeReason: surge.reason,
        surgeFactor: Math.round((surgeMultiplier - 1) * 100), // percentage
        finalFare: Math.round(finalFare * 100) / 100,
        distanceKm: Math.round(distanceKm * 100) / 100,
        durationMin: Math.round(durationMin),
        currency: 'GHS',
    };

}

module.exports.getFare = getFare;

function getOtp(num) {
    function generateOtp(num) {
        const otp = crypto.randomInt(Math.pow(10, num - 1), Math.pow(10, num)).toString();
        return otp;
    }
    return generateOtp(num);
}


module.exports.createRide = async ({
    user, pickup, destination, vehicleType, lat, lng
}) => {
    if (!user || !pickup || !destination || !vehicleType) {
        throw new Error('All fields are required');
    }

    const fare = await getFare(pickup, destination, vehicleType, lat, lng);

    const ride = rideModel.create({
        user,
        pickup,
        destination,
        vehicleType,
        otp: getOtp(6),
        fare: fare.finalFare,
    })

    return ride;
}

module.exports.confirmRide = async ({
    rideId, captain
}) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'accepted',
        captain: captain._id
    })

    const ride = await rideModel.findOne({
        _id: rideId
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    return ride;

}

module.exports.startRide = async ({ rideId, otp, captain }) => {
    if (!rideId || !otp) {
        throw new Error('Ride id and OTP are required');
    }

    const ride = await rideModel.findOne({
        _id: rideId
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'accepted') {
        throw new Error('Ride not accepted');
    }

    if (ride.otp !== otp) {
        throw new Error('Invalid OTP');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'ongoing'
    })

    return ride;
}

module.exports.endRide = async ({ rideId, captain }) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        captain: captain._id
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'ongoing') {
        throw new Error('Ride not ongoing');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'completed'
    })

    return ride;
}
