const ReferralService = require('../services/referral.service');
const { validationResult } = require('express-validator');
const { body } = require('express-validator');

/**
 * POST /api/referrals/apply-code
 * Apply a referral code during signup
 */
module.exports.applyReferralCode = [
    body('code').notEmpty().withMessage('Referral code required'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { code } = req.body;
            // Store the code in session or user metadata to apply on first ride
            // For now, we return the code so frontend can store it
            return res.status(200).json({
                message: 'Referral code applied',
                code,
            });
        } catch (err) {
            console.error('❌ Error applying referral code:', err);
            return res.status(500).json({ message: err.message });
        }
    },
];

/**
 * POST /api/referrals/complete
 * Complete referral when referred user takes first ride (internal/system)
 */
module.exports.completeReferral = async (req, res) => {
    try {
        const result = await ReferralService.completeReferral(req.user._id);
        if (!result) {
            return res.status(200).json({ message: 'No pending referral to complete' });
        }

        return res.status(200).json({
            message: 'Referral completed!',
            rewardAmount: result.rewardAmount,
            referrerCredit: result.referrerCredit,
        });
    } catch (err) {
        console.error('❌ Error completing referral:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * GET /api/referrals/my-referrals
 */
module.exports.getMyReferrals = async (req, res) => {
    try {
        const referrals = await ReferralService.getUserReferrals(req.user._id);
        return res.status(200).json(referrals);
    } catch (err) {
        console.error('❌ Error fetching referrals:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * GET /api/referrals/my-credit
 */
module.exports.getMyCredit = async (req, res) => {
    try {
        const credit = await ReferralService.getUserCredit(req.user._id);
        return res.status(200).json(credit);
    } catch (err) {
        console.error('❌ Error fetching credit:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * GET /api/referrals/my-code
 * Get user's own referral code to share
 */
module.exports.getMyReferralCode = async (req, res) => {
    try {
        const User = require('../models/user.model');
        const user = await User.findById(req.user._id).select('referralCode');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate code if doesn't exist
        if (!user.referralCode) {
            const ReferralService = require('../services/referral.service');
            const code = ReferralService.generateReferralCode(user._id);
            user.referralCode = code;
            await user.save();
        }

        return res.status(200).json({
            referralCode: user.referralCode,
            shareLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup?ref=${user.referralCode}`,
        });
    } catch (err) {
        console.error('❌ Error fetching referral code:', err);
        return res.status(500).json({ message: err.message });
    }
};
