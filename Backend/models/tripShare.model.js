const mongoose = require('mongoose');

/**
 * TripShare — a time-limited, revocable link that lets a trusted person follow
 * a ride live. Only non-sensitive ride details are ever exposed publicly.
 */
const tripShareSchema = new mongoose.Schema({
    ride: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ride',
        required: true,
    },
    token: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    creatorModel: {
        type: String,
        enum: ['user', 'captain'],
        required: true,
    },
    label: {
        type: String,
        enum: ['trip', 'sos'],
        default: 'trip',
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    revokedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

tripShareSchema.index({ ride: 1, createdAt: -1 });

module.exports = mongoose.model('TripShare', tripShareSchema);
