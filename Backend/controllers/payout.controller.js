const PayoutRequest = require('../models/payout.model');
const Captain = require('../models/captain.model');
const Ride = require('../models/ride.model');
const { Wallet, PaymentTransaction } = require('../models/payment.models');
const { validationResult } = require('express-validator');
const { body } = require('express-validator');

/**
 * Request a payout of earnings to Mobile Money
 */
module.exports.requestPayout = [
    body('amount').isNumeric().isInt({ min: 1 }).withMessage('Minimum payout is GH₵1'),
    body('provider').isIn(['mtn_momo', 'vodafone_cash', 'airtel_tigo_money']).withMessage('Invalid provider'),
    body('phoneNumber').isMobilePhone('any').withMessage('Valid phone number required'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { amount, provider, phoneNumber } = req.body;
            const captainId = req.captain._id;

            const captain = await Captain.findById(captainId);
            if (!captain) {
                return res.status(404).json({ message: 'Captain not found' });
            }

            const availableEarnings = captain.earnings || 0;
            if (amount > availableEarnings) {
                return res.status(400).json({
                    message: 'Insufficient earnings',
                    availableEarnings,
                });
            }

            // Calculate fee (1% or minimum GH₵1)
            const fee = Math.max(1, Math.round(amount * 0.01 * 100) / 100);
            const netAmount = Math.round((amount - fee) * 100) / 100;

            const payout = await PayoutRequest.create({
                captain: captainId,
                amount,
                currency: 'GHS',
                provider,
                phoneNumber,
                status: 'pending',
                fee,
                netAmount,
            });

            // Deduct from earnings (pending payout)
            captain.earnings = availableEarnings - amount;
            await captain.save();

            return res.status(201).json({
                message: 'Payout request submitted',
                payout: {
                    _id: payout._id,
                    amount,
                    fee,
                    netAmount,
                    provider,
                    phoneNumber,
                    status: payout.status,
                    createdAt: payout.createdAt,
                },
                remainingEarnings: captain.earnings,
            });
        } catch (err) {
            console.error('❌ Error requesting payout:', err);
            return res.status(500).json({ message: err.message });
        }
    },
];

/**
 * Get captain's payout history
 */
module.exports.getPayoutHistory = async (req, res) => {
    try {
        const payouts = await PayoutRequest.find({ captain: req.captain._id })
            .sort({ createdAt: -1 })
            .limit(50);
        return res.status(200).json(payouts);
    } catch (err) {
        console.error('❌ Error fetching payout history:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * Get captain earnings summary
 */
module.exports.getEarningsSummary = async (req, res) => {
    try {
        const captain = await Captain.findById(req.captain._id)
            .select('earnings totalRides rating status');

        const completedRidesCount = await Ride.countDocuments({
            captain: req.captain._id,
            status: 'completed',
        });

        const totalEarned = await Ride.aggregate([
            { $match: { captain: req.captain._id, status: 'completed', paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$fare' } } },
        ]);

        return res.status(200).json({
            totalEarnings: captain.earnings || 0,
            availableForPayout: captain.earnings || 0,
            totalRides: captain.totalRides || 0,
            completedRides: completedRidesCount,
            rating: captain.rating || 5,
            totalPaidOut: totalEarned.length > 0 ? totalEarned[0].total : 0,
            status: captain.status,
        });
    } catch (err) {
        console.error('❌ Error fetching earnings:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * Admin: Get all payout requests
 */
module.exports.getAllPayoutRequests = async (req, res) => {
    try {
        const payouts = await PayoutRequest.find()
            .populate('captain', 'fullname email phoneNumber')
            .sort({ createdAt: -1 })
            .limit(100);
        return res.status(200).json(payouts);
    } catch (err) {
        console.error('❌ Error fetching payouts:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * Admin: Process/Approve payout
 */
module.exports.processPayout = [
    body('status').isIn(['completed', 'failed']).withMessage('Invalid status'),
    body('reference').optional().isString(),
    body('notes').optional().isString(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { status, reference, notes } = req.body;
            const payout = await PayoutRequest.findById(req.params.id);

            if (!payout) {
                return res.status(404).json({ message: 'Payout request not found' });
            }

            if (payout.status !== 'pending') {
                return res.status(400).json({ message: 'Payout already processed' });
            }

            payout.status = status;
            payout.processedAt = new Date();
            payout.processedBy = req.user._id;
            if (reference) payout.reference = reference;
            if (notes) payout.notes = notes;
            await payout.save();

            // If completed, record the transaction
            if (status === 'completed') {
                await PaymentTransaction.create({
                    user: payout.captain,
                    type: 'driver_payout',
                    amount: payout.netAmount,
                    currency: 'GHS',
                    status: 'completed',
                    provider: payout.provider,
                    phoneNumber: payout.phoneNumber,
                    reference: payout.reference,
                    description: `Driver payout: GH₵${payout.amount} → ${payout.phoneNumber}`,
                });
            } else {
                // If failed, refund earnings back to captain
                const captain = await Captain.findById(payout.captain);
                captain.earnings = (captain.earnings || 0) + payout.amount;
                await captain.save();
            }

            return res.status(200).json({
                message: `Payout ${status}`,
                payout,
            });
        } catch (err) {
            console.error('❌ Error processing payout:', err);
            return res.status(500).json({ message: err.message });
        }
    },
];
