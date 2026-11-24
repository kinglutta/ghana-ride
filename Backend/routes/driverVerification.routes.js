const express = require('express');
const router = express.Router();
const driverVerificationController = require('../controllers/driverVerification.controller');
const authCaptain = require('../middlewares/auth.middlewares').authCaptain;
const authUser = require('../middlewares/auth.middlewares').authUser;
const { body } = require('express-validator');

router.post(
    '/submit',
    authCaptain,
    body('documents').isArray({ min: 1 }),
    driverVerificationController.submitVerification
);

router.get(
    '/me',
    authCaptain,
    driverVerificationController.getMyVerification
);

// Admin routes
router.get(
    '/pending',
    authUser,
    driverVerificationController.getPendingVerifications
);

router.patch(
    '/:id/review',
    authUser,
    body('status').isIn(['approved', 'rejected']),
    driverVerificationController.reviewVerification
);

module.exports = router;
