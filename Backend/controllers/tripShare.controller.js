const TripShareService = require('../services/tripShare.service');
const { body, param, validationResult } = require('express-validator');

const identity = (req) => (req.captain
    ? { id: req.captain._id, model: 'captain' }
    : { id: req.user._id, model: 'user' });

/** POST /trip/share — create an expiring live link. */
module.exports.createShare = [
    body('rideId').isMongoId().withMessage('Invalid ride id'),
    body('minutes').optional().isInt({ min: 5, max: 120 }),
    body('label').optional().isIn(['trip', 'sos']),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { id, model } = identity(req);
            const share = await TripShareService.create({
                rideId: req.body.rideId,
                creatorId: id,
                creatorModel: model,
                label: req.body.label,
                minutes: req.body.minutes,
            });

            const origin = process.env.FRONTEND_URL || 'http://localhost:5173';
            return res.status(201).json({
                message: 'Live link ready',
                token: share.token,
                url: `${origin.replace(/\/$/, '')}/trip/${share.token}`,
                expiresAt: share.expiresAt,
                label: share.label,
            });
        } catch (err) {
            return res.status(400).json({ message: err.message });
        }
    },
];

/** GET /trip/:token — public, read-only, privacy-filtered. */
module.exports.getSharedTrip = [
    param('token').isHexadecimal().withMessage('Invalid link'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const snapshot = await TripShareService.resolve(req.params.token);
            return res.status(200).json(snapshot);
        } catch (err) {
            return res.status(404).json({ message: err.message });
        }
    },
];

/** DELETE /trip/:token — revoke a link you created. */
module.exports.revokeShare = [
    param('token').isHexadecimal().withMessage('Invalid link'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { id } = identity(req);
            await TripShareService.revoke(req.params.token, id);
            return res.status(200).json({ message: 'Live link revoked' });
        } catch (err) {
            return res.status(400).json({ message: err.message });
        }
    },
];
