const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referral.controller');
const authMiddleware = require('../middlewares/auth.middlewares');
const { body } = require('express-validator');

router.post(
    '/apply-code',
    authMiddleware.authUser,
    body('code').notEmpty(),
    referralController.applyReferralCode
);

router.post(
    '/complete',
    authMiddleware.authUser,
    referralController.completeReferral
);

router.get(
    '/my-referrals',
    authMiddleware.authUser,
    referralController.getMyReferrals
);

router.get(
    '/my-credit',
    authMiddleware.authUser,
    referralController.getMyCredit
);

router.get(
    '/my-code',
    authMiddleware.authUser,
    referralController.getMyReferralCode
);

module.exports = router;
