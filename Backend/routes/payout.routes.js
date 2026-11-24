const express = require('express');
const router = express.Router();
const payoutController = require('../controllers/payout.controller');
const authMiddleware = require('../middlewares/auth.middlewares');
const { body } = require('express-validator');

// Captain routes
router.post(
    '/request',
    authMiddleware.authCaptain,
    payoutController.requestPayout
);

router.get(
    '/history',
    authMiddleware.authCaptain,
    payoutController.getPayoutHistory
);

router.get(
    '/earnings',
    authMiddleware.authCaptain,
    payoutController.getEarningsSummary
);

// Admin routes
router.get(
    '/all',
    authMiddleware.authAdmin,
    payoutController.getAllPayoutRequests
);

router.patch(
    '/:id/process',
    authMiddleware.authAdmin,
    payoutController.processPayout
);

module.exports = router;
