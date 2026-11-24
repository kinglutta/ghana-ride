const express = require('express');
const router = express.Router();
const disputeController = require('../controllers/dispute.controller');
const authUser = require('../middlewares/auth.middlewares').authUser;
const authCaptain = require('../middlewares/auth.middlewares').authCaptain;
const { body } = require('express-validator');

router.post(
    '/create',
    authUser,
    body('rideId').isMongoId(),
    body('reason').isIn(['driver_cancelled', 'driver_no_show', 'overcharge', 'safety', 'vehicle_issue', 'other']),
    body('description').optional().isString(),
    disputeController.createDispute
);

router.get(
    '/my',
    authUser,
    disputeController.getMyDisputes
);

router.get(
    '/captain',
    authCaptain,
    disputeController.getCaptainDisputes
);

// Admin routes
router.get(
    '/all',
    authUser,
    disputeController.getAllDisputes
);

router.patch(
    '/:id/resolve',
    authUser,
    body('resolution').isIn(['refund', 'credit', 'no_action', 'compensate']),
    disputeController.resolveDispute
);

module.exports = router;
