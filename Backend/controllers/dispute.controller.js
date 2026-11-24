const DisputeService = require('../services/dispute.service');
const { validationResult } = require('express-validator');
const { body } = require('express-validator');

/**
 * POST /api/disputes/create
 * User files a dispute on a ride
 */
module.exports.createDispute = [
    body('rideId').isMongoId().withMessage('Invalid ride id'),
    body('reason').isIn(['driver_cancelled', 'driver_no_show', 'overcharge', 'safety', 'vehicle_issue', 'other']),
    body('description').optional().isString(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { rideId, reason, description } = req.body;
            const dispute = await DisputeService.create({
                rideId,
                filedBy: req.user._id,
                role: 'user',
                reason,
                description,
            });

            return res.status(201).json({
                message: 'Dispute filed',
                dispute,
            });
        } catch (err) {
            return res.status(400).json({ message: err.message });
        }
    },
];

/**
 * GET /api/disputes/my
 * User gets their disputes
 */
module.exports.getMyDisputes = async (req, res) => {
    try {
        const disputes = await DisputeService.getUserDisputes(req.user._id);
        return res.status(200).json(disputes);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/**
 * GET /api/disputes/captain
 * Captain gets disputes filed against them
 */
module.exports.getCaptainDisputes = async (req, res) => {
    try {
        const disputes = await DisputeService.getCaptainDisputes(req.captain._id);
        return res.status(200).json(disputes);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/**
 * GET /api/disputes/all
 * Admin gets all disputes
 */
module.exports.getAllDisputes = async (req, res) => {
    try {
        const disputes = await DisputeService.getAllDisputes();
        return res.status(200).json(disputes);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/**
 * PATCH /api/disputes/:id/resolve
 * Admin resolves a dispute
 */
module.exports.resolveDispute = [
    body('resolution').isIn(['refund', 'credit', 'no_action', 'compensate']),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { resolution, resolutionNote } = req.body;
            const dispute = await DisputeService.resolve(req.params.id, {
                resolution,
                resolutionNote,
                resolvedBy: req.user?._id?.toString() || 'admin',
            });

            return res.status(200).json({
                message: 'Dispute resolved',
                dispute,
            });
        } catch (err) {
            return res.status(400).json({ message: err.message });
        }
    },
];
