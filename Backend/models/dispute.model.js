const mongoose = require('mongoose');

/**
 * Dispute — ride disputes raised by users or captains
 * Admin resolves disputes (refund / credit / no_action / compensate).
 */
const disputeSchema = new mongoose.Schema({
    ride: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ride',
        required: true,
    },
    filedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'captain'],
        required: true,
    },
    reason: {
        type: String,
        enum: ['driver_cancelled', 'driver_no_show', 'overcharge', 'safety', 'vehicle_issue', 'other'],
        required: true,
    },
    description: {
        type: String,
        maxlength: 1000,
    },
    status: {
        type: String,
        enum: ['open', 'resolved'],
        default: 'open',
    },
    resolution: {
        type: String,
        enum: ['refund', 'credit', 'no_action', 'compensate'],
        default: 'no_action',
    },
    resolutionNote: {
        type: String,
    },
    resolvedAt: {
        type: Date,
    },
    resolvedBy: {
        type: String, // admin user id
    },
}, { timestamps: true });

disputeSchema.index({ ride: 1, status: 1 });

module.exports = mongoose.model('Dispute', disputeSchema);
