const mongoose = require('mongoose');

/**
 * Wallet — user/captain stored balance (GH₵)
 * Enables Mobile Money top-up and in-app payments without external gateways.
 */
const walletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        unique: true,
    },
    balance: {
        type: Number,
        default: 0, // in Ghana Cedis
        min: 0,
    },
    currency: {
        type: String,
        default: 'GHS',
    },
    lastTopUp: {
        type: Date,
    },
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);

/**
 * PaymentTransaction — records every money movement
 * Mobile Money top-ups, ride payments, refunds, driver payouts.
 */
const paymentTransactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    ride: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ride',
    },
    type: {
        type: String,
        enum: ['topup', 'ride_payment', 'refund', 'driver_payout', 'promo_credit'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: 'GHS',
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending',
    },
    provider: {
        type: String,
        enum: ['mtn_momo', 'vodafone_cash', 'airtel_tigo_money', 'cash', 'wallet'],
        required: true,
    },
    reference: {
        type: String, // external transaction reference from telco
    },
    phoneNumber: {
        type: String, // masked phone for Mobile Money
    },
    description: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);

/**
 * PromoCode — referral and discount codes
 */
const promoCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
    },
    type: {
        type: String,
        enum: ['percentage', 'fixed'],
        required: true,
    },
    value: {
        type: Number,
        required: true, // percent (10) or fixed amount (5.00)
    },
    minFare: {
        type: Number,
        default: 0,
    },
    maxDiscount: {
        type: Number,
    },
    usageLimit: {
        type: Number,
        default: 1, // per user
    },
    usedCount: {
        type: Number,
        default: 0,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('PromoCode', promoCodeSchema);

/**
 * EmergencyContact — user's safety contacts for SOS
 */
const emergencyContactSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    relationship: {
        type: String,
        default: 'Emergency Contact',
    },
    isPrimary: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);

/**
 * SOSAlert — records SOS activations for safety review
 */
const sosAlertSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    ride: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ride',
    },
    location: {
        ltd: { type: Number },
        lng: { type: Number },
    },
    status: {
        type: String,
        enum: ['active', 'resolved', 'false_alarm'],
        default: 'active',
    },
    resolvedAt: {
        type: Date,
    },
    resolvedBy: {
        type: String, // admin or support staff id
    },
}, { timestamps: true });

module.exports = mongoose.model('SOSAlert', sosAlertSchema);
