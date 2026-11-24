const mongoose = require('mongoose');

/**
 * ScheduledRide — rides booked for a future date/time
 */
const scheduledRideSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'captain',
    },
    pickup: {
        type: String,
        required: true,
    },
    destination: {
        type: String,
        required: true,
    },
    vehicleType: {
        type: String,
        enum: ['auto', 'moto', 'car', 'comfort', 'xl', 'bike'],
        default: 'car',
        required: true,
    },
    fare: {
        type: Number,
        required: true,
    },
    scheduledAt: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['scheduled', 'confirmed', 'ongoing', 'completed', 'cancelled', 'no_captain'],
        default: 'scheduled',
    },
    otp: {
        type: String,
        select: false,
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'cash', 'failed'],
        default: 'pending',
    },
    cancelledAt: {
        type: Date,
    },
    cancellationReason: {
        type: String,
        maxlength: 200,
    },
}, { timestamps: true });

// Index for efficient querying of upcoming scheduled rides
scheduledRideSchema.index({ scheduledAt: 1, status: 1 });
scheduledRideSchema.index({ user: 1, scheduledAt: -1 });

module.exports = mongoose.model('ScheduledRide', scheduledRideSchema);
