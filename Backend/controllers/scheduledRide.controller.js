const ScheduledRideService = require('../services/scheduledRide.service');
const { validationResult } = require('express-validator');
const { body } = require('express-validator');

/**
 * POST /api/scheduled-rides/create
 */
module.exports.createScheduledRide = [
    body('pickup').isString().isLength({ min: 3 }),
    body('destination').isString().isLength({ min: 3 }),
    body('vehicleType').isIn(['auto', 'moto', 'car', 'comfort', 'xl', 'bike', 'motor', 'okada', 'pragya']),
    body('scheduledAt').isISO8601(),
    body('fare').isNumeric(),
    body('lat').optional().isFloat(),
    body('lng').optional().isFloat(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { pickup, destination, vehicleType, scheduledAt, fare, lat, lng } = req.body;
            const scheduledRide = await ScheduledRideService.create({
                userId: req.user._id,
                pickup,
                destination,
                vehicleType,
                fare: parseFloat(fare),
                scheduledAt,
                lat: lat ? parseFloat(lat) : undefined,
                lng: lng ? parseFloat(lng) : undefined,
            });

            return res.status(201).json({
                message: 'Ride scheduled successfully',
                scheduledRide,
            });
        } catch (err) {
            console.error('❌ Error creating scheduled ride:', err);
            return res.status(500).json({ message: err.message });
        }
    },
];

/**
 * GET /api/scheduled-rides/my-rides
 */
module.exports.getMyScheduledRides = async (req, res) => {
    try {
        const rides = await ScheduledRideService.getUserScheduledRides(req.user._id);
        return res.status(200).json(rides);
    } catch (err) {
        console.error('❌ Error fetching scheduled rides:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * POST /api/scheduled-rides/:id/cancel
 */
module.exports.cancelScheduledRide = [
    body('reason').optional().isString(),
    async (req, res) => {
        try {
            const { reason } = req.body;
            const scheduledRide = await ScheduledRideService.cancel(
                req.params.id,
                req.user._id,
                reason
            );
            return res.status(200).json({
                message: 'Scheduled ride cancelled',
                scheduledRide,
            });
        } catch (err) {
            console.error('❌ Error cancelling scheduled ride:', err);
            return res.status(400).json({ message: err.message });
        }
    },
];

/**
 * GET /api/scheduled-rides/upcoming (captain/admin - rides needing matching)
 */
module.exports.getUpcomingForMatching = async (req, res) => {
    try {
        const rides = await ScheduledRideService.getUpcomingForMatching();
        return res.status(200).json(rides);
    } catch (err) {
        console.error('❌ Error fetching upcoming scheduled rides:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * POST /api/scheduled-rides/:id/assign-captain (captain accepts)
 */
module.exports.assignCaptain = async (req, res) => {
    try {
        const scheduledRide = await ScheduledRideService.assignCaptain(
            req.params.id,
            req.captain._id
        );
        return res.status(200).json({
            message: 'Captain assigned to scheduled ride',
            scheduledRide,
        });
    } catch (err) {
        console.error('❌ Error assigning captain:', err);
        return res.status(400).json({ message: err.message });
    }
};

/**
 * POST /api/scheduled-rides/:id/activate (system/internal)
 */
module.exports.activateScheduledRide = async (req, res) => {
    try {
        const { scheduledRide, ride } = await ScheduledRideService.activateScheduledRide(
            req.params.id
        );
        return res.status(200).json({
            message: 'Scheduled ride activated',
            scheduledRide,
            ride,
        });
    } catch (err) {
        console.error('❌ Error activating scheduled ride:', err);
        return res.status(500).json({ message: err.message });
    }
};
