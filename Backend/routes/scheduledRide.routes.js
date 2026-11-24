const express = require('express');
const router = express.Router();
const scheduledRideController = require('../controllers/scheduledRide.controller');
const authMiddleware = require('../middlewares/auth.middlewares');
const { body } = require('express-validator');

router.post(
    '/create',
    authMiddleware.authUser,
    body('pickup').isString().isLength({ min: 3 }),
    body('destination').isString().isLength({ min: 3 }),
    body('vehicleType').isIn(['auto', 'moto', 'car', 'comfort', 'xl', 'bike', 'motor', 'okada', 'pragya']),
    body('scheduledAt').isISO8601(),
    body('fare').isNumeric(),
    body('lat').optional().isFloat(),
    body('lng').optional().isFloat(),
    scheduledRideController.createScheduledRide
);

router.get(
    '/my-rides',
    authMiddleware.authUser,
    scheduledRideController.getMyScheduledRides
);

router.post(
    '/:id/cancel',
    authMiddleware.authUser,
    body('reason').optional().isString(),
    scheduledRideController.cancelScheduledRide
);

// Captain routes
router.get(
    '/upcoming',
    authMiddleware.authCaptain,
    scheduledRideController.getUpcomingForMatching
);

router.post(
    '/:id/assign-captain',
    authMiddleware.authCaptain,
    scheduledRideController.assignCaptain
);

// System/internal route (could be protected by admin middleware in production)
router.post(
    '/:id/activate',
    scheduledRideController.activateScheduledRide
);

module.exports = router;
