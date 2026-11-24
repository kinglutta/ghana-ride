const paymentService = require('../services/payment.service');
const { validationResult } = require('express-validator');
const { body } = require('express-validator');

/**
 * GET /api/payment/providers
 * List available Mobile Money providers
 */
module.exports.getProviders = async (req, res) => {
    try {
        const providers = paymentService.getProviders();
        return res.status(200).json({ providers });
    } catch (err) {
        console.error('❌ Error fetching providers:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * GET /api/payment/wallet
 * Get user wallet balance
 */
module.exports.getWallet = async (req, res) => {
    try {
        const wallet = await paymentService.getWallet(req.user._id);
        return res.status(200).json(wallet);
    } catch (err) {
        console.error('❌ Error fetching wallet:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * POST /api/payment/topup
 * Top up wallet via Mobile Money
 */
module.exports.topupWallet = [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('provider').isIn(['mtn_momo', 'vodafone_cash', 'airtel_tigo_money']).withMessage('Invalid provider'),
    body('phoneNumber').isMobilePhone('any').withMessage('Valid phone number required'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { amount, provider, phoneNumber } = req.body;
            const result = await paymentService.topupWallet({
                userId: req.user._id,
                amount: parseFloat(amount),
                provider,
                phoneNumber,
            });
            return res.status(200).json({
                message: 'Wallet topped up successfully',
                wallet: result.wallet,
                transaction: result.transaction,
            });
        } catch (err) {
            console.error('❌ Error topping up wallet:', err);
            return res.status(500).json({ message: err.message });
        }
    },
];

/**
 * POST /api/payment/pay-ride
 * Pay for a ride (wallet or mobile money)
 */
module.exports.payRide = [
    body('rideId').isMongoId().withMessage('Invalid ride id'),
    body('method').isIn(['wallet', 'mtn_momo', 'vodafone_cash', 'airtel_tigo_money', 'cash']).withMessage('Invalid payment method'),
    body('phoneNumber').optional().isMobilePhone('any').withMessage('Valid phone number required'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { rideId, method, phoneNumber } = req.body;

            if (method === 'wallet') {
                const result = await paymentService.payRideWithWallet({
                    userId: req.user._id,
                    rideId,
                });
                return res.status(200).json({
                    message: 'Ride paid from wallet',
                    wallet: result.wallet,
                    transaction: result.transaction,
                    ride: result.ride,
                });
            }

            if (method === 'cash') {
                // Cash payment — mark as pending cash
                const Ride = require('../models/ride.model');
                const ride = await Ride.findByIdAndUpdate(
                    rideId,
                    { paymentStatus: 'cash' },
                    { new: true }
                );
                return res.status(200).json({
                    message: 'Ride marked for cash payment',
                    ride,
                });
            }

            // Mobile Money
            const result = await paymentService.payRideWithMobileMoney({
                userId: req.user._id,
                rideId,
                provider: method,
                phoneNumber,
            });
            return res.status(200).json({
                message: result.message,
                transaction: result.transaction,
            });
        } catch (err) {
            console.error('❌ Error processing payment:', err);
            return res.status(500).json({ message: err.message });
        }
    },
];

/**
 * GET /api/payment/transactions
 * Get user transaction history
 */
module.exports.getTransactions = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const transactions = await paymentService.getTransactions(req.user._id, limit);
        return res.status(200).json(transactions);
    } catch (err) {
        console.error('❌ Error fetching transactions:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * POST /api/payment/apply-promo
 * Apply promo code to fare
 */
module.exports.applyPromoCode = [
    body('code').notEmpty().withMessage('Promo code required'),
    body('fare').isNumeric().withMessage('Fare must be a number'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { code, fare } = req.body;
            const result = await paymentService.applyPromoCode({
                code,
                fare: parseFloat(fare),
                userId: req.user._id,
            });
            return res.status(200).json(result);
        } catch (err) {
            console.error('❌ Error applying promo:', err);
            return res.status(400).json({ message: err.message });
        }
    },
];
