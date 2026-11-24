const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middlewares');
const { body } = require('express-validator');

router.get('/providers', paymentController.getProviders);

router.get('/wallet', authMiddleware.authUser, paymentController.getWallet);

router.post(
    '/topup',
    authMiddleware.authUser,
    paymentController.topupWallet
);

router.post(
    '/pay-ride',
    authMiddleware.authUser,
    paymentController.payRide
);

router.get(
    '/transactions',
    authMiddleware.authUser,
    paymentController.getTransactions
);

router.post(
    '/apply-promo',
    authMiddleware.authUser,
    paymentController.applyPromoCode
);

module.exports = router;
