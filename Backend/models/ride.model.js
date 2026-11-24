const mongoose = require('mongoose');


const rideSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
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
        enum: ['auto', 'moto', 'car', 'comfort', 'xl', 'bike', 'motor', 'okada', 'pragya'],
        default: 'car',
        required: true,
    },
    fare: {
        type: Number,
        required: true,
    },

    status: {
        type: String,
        enum: [ 'pending', 'accepted', "ongoing", 'completed', 'cancelled' ],
        default: 'pending',
    },

    duration: {
        type: Number,
    }, // in seconds

    distance: {
        type: Number,
    }, // in meters

    paymentID: {
        type: String,
    },
    orderId: {
        type: String,
    },
    signature: {
        type: String,
    },

    otp: {
        type: String,
        select: false,
        required: true,
    },

    // Driver rating from rider (1-5)
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },

    // Rider comment (optional)
    comment: {
        type: String,
        maxlength: 500,
    },

    // Payment status: 'pending' | 'paid' | 'cash' | 'failed'
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'cash', 'failed'],
        default: 'cash',
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

module.exports = mongoose.model('ride', rideSchema);