const mongoose = require('mongoose');

/**
 * DriverVerification — driver document verification workflow
 * Drivers submit license / vehicle / ID documents, admins review.
 */
const driverVerificationSchema = new mongoose.Schema({
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'captain',
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    documents: [
        {
            type: {
                type: String,
                enum: ['license', 'vehicle', 'id'],
                required: true,
            },
            url: {
                type: String,
                required: true, // data URL or storage reference
            },
            submittedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    reviewNote: {
        type: String,
    },
    reviewedAt: {
        type: Date,
    },
    reviewedBy: {
        type: String, // admin user id
    },
}, { timestamps: true });

module.exports = mongoose.model('DriverVerification', driverVerificationSchema);
