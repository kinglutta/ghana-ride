const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
const mapService = require('../services/maps.service');
const rideModel = require('../models/ride.model');
const captainModel = require('../models/captain.model');

const roomFor = (person) => person && String(person._id || person);

module.exports.createRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { pickup, destination, vehicleType, lat, lng, paymentMethod } = req.body;

    let ride;
    try {
        ride = await rideService.createRide({
            user: req.user._id, pickup, destination, vehicleType, lat, lng, paymentMethod
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }

    res.status(201).json(ride);

    // Everything below is post-response dispatch; failures here must not
    // invalidate a ride that has already been created successfully.
    try {
        const io = req.app.get('io');
        if (!io) return;

        const pickupCoordinates = await mapService.getAddressCoordinate(pickup);
        const rideWithUser = await rideModel.findById(ride._id).populate('user');
        if (!rideWithUser) return;

        // Captains never receive the OTP — only the Rider does.
        const rideDataForCaptains = { ...rideWithUser.toObject(), otp: undefined };

        const captainsInRadius = await mapService.getCaptainsInTheRadius(
            pickupCoordinates.ltd,
            pickupCoordinates.lng,
            10
        );

        const verifiedCaptains = captainsInRadius.filter(
            (captain) => captain.isVerified && !captain.onRide
        );

        if (verifiedCaptains.length === 0) {
            io.to(roomFor(req.user)).emit('no-captains-nearby', {
                rideId: String(ride._id),
                message: 'No verified YENKO Captains nearby yet. We are still looking.',
            });
            return;
        }

        // One event per Captain. The duplicate `new-ride-request` alias caused
        // double sounds/vibrations on Captain devices and is no longer emitted.
        verifiedCaptains.forEach((captain) => {
            io.to(String(captain._id)).emit('new-ride', rideDataForCaptains);
        });
    } catch (error) {
        console.error('Ride dispatch error:', error.message);
    }
};

module.exports.getFare = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { pickup, destination, vehicleType, lat, lng } = req.query;

    try {
        const fare = await rideService.getFare(
            pickup,
            destination,
            vehicleType,
            lat ? parseFloat(lat) : undefined,
            lng ? parseFloat(lng) : undefined
        );
        return res.status(200).json(fare);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/**
 * GET /rides/get-fares — every vehicle price from one map calculation.
 */
module.exports.getFares = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { pickup, destination, lat, lng } = req.query;

    try {
        const fares = await rideService.getFareMatrix(
            pickup,
            destination,
            lat ? parseFloat(lat) : undefined,
            lng ? parseFloat(lng) : undefined
        );
        return res.status(200).json(fares);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

module.exports.getSurge = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { lat, lng } = req.query;

    try {
        const SurgePricingService = require('../services/surge.service');
        const surge = await SurgePricingService.calculateSurge(
            parseFloat(lat),
            parseFloat(lng)
        );
        return res.status(200).json(surge);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

module.exports.confirmRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if (req.captain.isVerified !== true) {
        return res.status(403).json({
            message: 'Complete Captain verification before accepting rides',
        });
    }
    if (req.captain.onRide === true) {
        return res.status(409).json({ message: 'Finish your current ride first' });
    }

    const { rideId } = req.body;

    try {
        // The service response contains no OTP.
        const ride = await rideService.confirmRide({ rideId, captain: req.captain });

        const io = req.app.get('io');
        if (io && ride.user) {
            // The Rider needs the OTP; deliver it only to their private room.
            const rideWithOTP = await rideModel
                .findById(rideId)
                .populate('user')
                .populate('captain')
                .select('+otp');
            io.to(roomFor(ride.user)).emit('ride-confirmed', rideWithOTP);
        }

        return res.status(200).json(ride);
    } catch (err) {
        const taken = /already accepted|no longer available/i.test(err.message);
        return res.status(taken ? 409 : 500).json({ message: err.message });
    }
};

module.exports.startRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, otp } = req.query;

    try {
        const ride = await rideService.startRide({ rideId, otp, captain: req.captain });

        const io = req.app.get('io');
        if (io && ride.user) {
            io.to(roomFor(ride.user)).emit('ride-started', ride);
        }

        return res.status(200).json(ride);
    } catch (err) {
        const invalid = /not found|not assigned|invalid otp/i.test(err.message);
        return res.status(invalid ? 400 : 500).json({ message: err.message });
    }
};

module.exports.endRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.endRide({ rideId, captain: req.captain });

        const io = req.app.get('io');
        if (io && ride.user) {
            io.to(roomFor(ride.user)).emit('ride-completed', ride);
        }

        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/**
 * POST /rides/cancel — a Rider can stop a search or cancel before pickup.
 */
module.exports.cancelRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.cancelRide({ rideId, user: req.user._id });

        const io = req.app.get('io');
        if (io) {
            io.to(roomFor(req.user)).emit('ride-cancelled', { rideId: String(ride._id) });
            if (ride.captain) {
                io.to(roomFor(ride.captain)).emit('ride-cancelled', {
                    rideId: String(ride._id),
                    message: 'The Rider cancelled this ride',
                });
            }
        }

        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/**
 * Rate a completed ride (rider -> captain). Completion already credited the
 * Captain's ride count and earnings, so rating only updates the average.
 */
module.exports.rateRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, rating, comment } = req.body;

    try {
        const ride = await rideModel.findById(rideId).populate('user').populate('captain');

        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }
        if (String(ride.user._id) !== String(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to rate this ride' });
        }
        if (ride.status !== 'completed') {
            return res.status(400).json({ message: 'Can only rate completed rides' });
        }
        if (ride.rating) {
            return res.status(400).json({ message: 'Ride already rated' });
        }

        ride.rating = rating;
        ride.comment = comment || '';
        await ride.save();

        const captain = await captainModel.findById(ride.captain._id);
        const previousRides = Math.max(0, (captain.totalRides || 1) - 1);
        const newRating = ((captain.rating * previousRides) + rating) /
            Math.max(1, previousRides + 1);
        captain.rating = Math.round(newRating * 10) / 10;
        await captain.save();

        const io = req.app.get('io');
        if (io && captain) {
            io.to(String(captain._id)).emit('ride-rated', { rideId, rating, comment });
        }

        return res.status(200).json({
            message: 'Ride rated successfully',
            rating: captain.rating,
            totalRides: captain.totalRides,
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

module.exports.getRideHistory = async (req, res) => {
    try {
        const rides = await rideModel.find({ user: req.user._id })
            .populate('captain', 'fullname vehicle rating')
            .sort({ createdAt: -1 })
            .limit(50);

        return res.status(200).json(rides);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
