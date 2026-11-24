const { Referral, UserCredit } = require('../models/referral.model');
const User = require('../models/user.model');
const crypto = require('crypto');

/**
 * ReferralService — referral and promo credit system
 */
class ReferralService {
    /**
     * Generate a unique referral code for a user
     */
    static generateReferralCode(userId) {
        const prefix = 'YENKO';
        const random = crypto.randomBytes(3).toString('hex').toUpperCase();
        return `${prefix}${random}`;
    }

    /**
     * Create a referral when a new user signs up with a referral code
     */
    static async createReferral({ referrerCode, referredUserId }) {
        // Find the referrer by their referral code
        const referrer = await User.findOne({ referralCode: referrerCode });
        if (!referrer) {
            throw new Error('Invalid referral code');
        }

        if (referrer._id.toString() === referredUserId.toString()) {
            throw new Error('Cannot refer yourself');
        }

        // Check if this user was already referred
        const existing = await Referral.findOne({ referred: referredUserId });
        if (existing) {
            throw new Error('User already has a referrer');
        }

        const referral = await Referral.create({
            referrer: referrer._id,
            referred: referredUserId,
            referralCode: referrerCode,
            status: 'pending',
            rewardAmount: 5,
        });

        return referral;
    }

    /**
     * Complete a referral (when referred user takes first ride)
     */
    static async completeReferral(referredUserId) {
        const referral = await Referral.findOne({
            referred: referredUserId,
            status: 'pending',
        });

        if (!referral) {
            return null; // No pending referral
        }

        referral.status = 'completed';
        referral.completedAt = new Date();
        await referral.save();

        // Add credit to referrer's wallet
        const referrerCredit = await UserCredit.findOneAndUpdate(
            { user: referral.referrer },
            { $inc: { balance: referral.rewardAmount } },
            { upsert: true, new: true }
        );

        return {
            referral,
            referrerCredit,
            rewardAmount: referral.rewardAmount,
        };
    }

    /**
     * Get user's referrals
     */
    static async getUserReferrals(userId) {
        return Referral.find({ referrer: userId })
            .populate('referred', 'fullname email')
            .sort({ createdAt: -1 });
    }

    /**
     * Get user's credit balance
     */
    static async getUserCredit(userId) {
        let credit = await UserCredit.findOne({ user: userId });
        if (!credit) {
            credit = await UserCredit.create({ user: userId, balance: 0 });
        }
        return credit;
    }

    /**
     * Apply credit to a ride fare
     */
    static async applyCredit({ userId, amount }) {
        const credit = await UserCredit.findOne({ user: userId });
        if (!credit || credit.balance <= 0) {
            return { applied: 0, remainingBalance: 0 };
        }

        const applyAmount = Math.min(amount, credit.balance);
        credit.balance -= applyAmount;
        await credit.save();

        return {
            applied: applyAmount,
            remainingBalance: credit.balance,
        };
    }
}

module.exports = ReferralService;
