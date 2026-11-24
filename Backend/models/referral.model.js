const mongoose = require('mongoose');

/**
 * Referral — user referral system for free ride credits
 */
const referralSchema = new mongoose.Schema({
    referrer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    referred: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    referralCode: {
        type: String,
        required: true,
        uppercase: true,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'expired'],
        default: 'pending',
    },
    rewardAmount: {
        type: Number,
        default: 5, // GH₵5 credit per successful referral
    },
    rewardCurrency: {
        type: String,
        default: 'GHS',
    },
    completedAt: {
        type: Date,
    },
}, { timestamps: true });

referralSchema.index({ referrer: 1, status: 1 });
referralSchema.index({ referred: 1 }, { unique: true }); // one referral per user

module.exports = mongoose.model('Referral', referralSchema);

/**
 * UserCredit — stored ride credits from referrals/promos
 */
const userCreditSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        unique: true,
    },
    balance: {
        type: Number,
        default: 0,
    },
    currency: {
        type: String,
        default: 'GHS',
    },
}, { timestamps: true });

module.exports = mongoose.model('UserCredit', userCreditSchema);
