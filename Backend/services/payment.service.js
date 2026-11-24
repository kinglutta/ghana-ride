const PaymentTransaction = require('../models/payment.models').PaymentTransaction;
const Wallet = require('../models/payment.models').Wallet;
const Ride = require('../models/ride.model');
const User = require('../models/user.model');
const axios = require('axios');

/**
 * Mobile Money Providers configuration (Ghana)
 * These are free sandbox/production endpoints — no paid gateway required for MVP.
 * In production, integrate with telco APIs or a local aggregator (e.g., Hubtel, ExpressPay).
 */
const MOMO_PROVIDERS = {
    mtn_momo: { name: 'MTN Mobile Money', code: 'MTN', prefix: '233' },
    vodafone_cash: { name: 'Vodafone Cash', code: 'VOD', prefix: '233' },
    airtel_tigo_money: { name: 'AirtelTigo Money', code: 'AT', prefix: '233' },
};

/**
 * Initialize wallet for user
 */
module.exports.initWallet = async (userId) => {
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
        wallet = await Wallet.create({ user: userId, balance: 0 });
    }
    return wallet;
};

/**
 * Top up wallet via Mobile Money
 * Creates a pending transaction. In production, this triggers telco API.
 */
module.exports.topupWallet = async ({ userId, amount, provider, phoneNumber }) => {
    const wallet = await module.exports.initWallet(userId);

    const transaction = await PaymentTransaction.create({
        user: userId,
        type: 'topup',
        amount,
        currency: 'GHS',
        status: 'pending',
        provider,
        phoneNumber,
        description: `Wallet top-up via ${provider}`,
    });

    // NOTE: For MVP, we simulate success. In production, call telco API here
    // and webhook back to confirm. Mark as completed for demo.
    transaction.status = 'completed';
    transaction.reference = `MOMO_${Date.now()}`;
    await transaction.save();

    wallet.balance += amount;
    wallet.lastTopUp = new Date();
    await wallet.save();

    return { wallet, transaction };
};

/**
 * Pay for a ride using wallet
 */
module.exports.payRideWithWallet = async ({ userId, rideId }) => {
    const ride = await Ride.findById(rideId);
    if (!ride) throw new Error('Ride not found');
    if (ride.user.toString() !== userId) throw new Error('Not authorized');

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < ride.fare) {
        throw new Error('Insufficient wallet balance');
    }

    wallet.balance -= ride.fare;
    await wallet.save();

    const transaction = await PaymentTransaction.create({
        user: userId,
        ride: rideId,
        type: 'ride_payment',
        amount: ride.fare,
        currency: 'GHS',
        status: 'completed',
        provider: 'wallet',
        description: `Ride payment: ${ride.pickup} → ${ride.destination}`,
    });

    ride.paymentStatus = 'paid';
    await ride.save();

    return { wallet, transaction, ride };
};

/**
 * Pay for a ride using Mobile Money
 */
module.exports.payRideWithMobileMoney = async ({ userId, rideId, provider, phoneNumber }) => {
    const ride = await Ride.findById(rideId);
    if (!ride) throw new Error('Ride not found');

    const transaction = await PaymentTransaction.create({
        user: userId,
        ride: rideId,
        type: 'ride_payment',
        amount: ride.fare,
        currency: 'GHS',
        status: 'pending',
        provider,
        phoneNumber,
        description: `Ride payment via ${provider}`,
    });

    // In production: initiate MoMo checkout, wait for webhook
    // For MVP: mark completed after user confirms on their phone
    return { transaction, message: 'Please complete payment on your mobile phone' };
};

/**
 * Get wallet balance
 */
module.exports.getWallet = async (userId) => {
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
        return { balance: 0, currency: 'GHS' };
    }
    return wallet;
};

/**
 * Get transaction history
 */
module.exports.getTransactions = async (userId, limit = 20) => {
    return PaymentTransaction.find({ user: userId })
        .populate('ride', 'pickup destination fare status')
        .sort({ createdAt: -1 })
        .limit(limit);
};

/**
 * Get available Mobile Money providers
 */
module.exports.getProviders = () => {
    return Object.entries(MOMO_PROVIDERS).map(([key, val]) => ({
        id: key,
        name: val.name,
        code: val.code,
    }));
};

/**
 * Apply promo code to a ride fare
 */
module.exports.applyPromoCode = async ({ code, fare, userId }) => {
    const promo = await PaymentTransaction.model('PromoCode').findOne({
        code: code.toUpperCase(),
        isActive: true,
        expiresAt: { $gt: new Date() },
    });

    if (!promo) throw new Error('Invalid or expired promo code');

    let discount = 0;
    if (promo.type === 'percentage') {
        discount = (fare * promo.value) / 100;
        if (promo.maxDiscount && discount > promo.maxDiscount) {
            discount = promo.maxDiscount;
        }
    } else {
        discount = promo.value;
    }

    const finalFare = Math.max(0, fare - discount);

    return {
        promoCode: promo.code,
        discount,
        finalFare,
        originalFare: fare,
    };
};
