const mongoose = require('mongoose');

/**
 * PayoutRequest — drivers request payout of their earnings via Mobile Money
 */
const payoutRequestSchema = new mongoose.Schema({
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'captain',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 1, // minimum GH₵1 payout
    },
    currency: {
        type: String,
        default: 'GHS',
    },
    provider: {
        type: String,
        enum: ['mtn_momo', 'vodafone_cash', 'airtel_tigo_money'],
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
        default: 'pending',
    },
    reference: {
        type: String, // external telco reference
    },
    fee: {
        type: Number,
        default: 0, // transaction fee deducted
    },
    netAmount: {
        type: Number, // amount actually sent to driver
    },
    processedAt: {
        type: Date,
    },
    processedBy: {
        type: String, // admin staff id
    },
    notes: {
        type: String,
        maxlength: 500,
    },
}, { timestamps: true });

module.exports = mongoose.model('PayoutRequest', payoutRequestSchema);
