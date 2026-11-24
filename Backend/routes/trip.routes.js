const express = require('express');
const router = express.Router();
const tripShareController = require('../controllers/tripShare.controller');
const { authUserOrCaptain } = require('../middlewares/auth.middlewares');
const { body } = require('express-validator');

router.post(
    '/share',
    authUserOrCaptain,
    body('rideId').isMongoId(),
    body('minutes').optional().isInt({ min: 5, max: 120 }),
    body('label').optional().isIn(['trip', 'sos']),
    tripShareController.createShare
);

// Public read-only view — the token is the capability; no account required.
router.get('/:token', tripShareController.getSharedTrip);

router.delete('/:token', authUserOrCaptain, tripShareController.revokeShare);

module.exports = router;
