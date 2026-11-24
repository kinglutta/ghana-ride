const mongoose = require('mongoose');

/**
 * Notification — in-app and push notifications
 */
const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: function () { return !this.captain; },
    },
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'captain',
        required: function () { return !this.user; },
    },
    type: {
        type: String,
        enum: ['ride_request', 'ride_accepted', 'ride_started', 'ride_ended', 'ride_completed',
               'payment', 'payout', 'promo', 'referral', 'sos', 'system', 'scheduled_ride'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    data: {
        type: mongoose.Mixed, // rideId, payoutId, etc.
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    isPushSent: {
        type: Boolean,
        default: false,
    },
    pushToken: {
        type: String, // device push token for mobile/PWA
    },
}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ captain: 1, isRead: 1, createdAt: -1 });

/**
 * PushToken — device tokens for push notifications (PWA / mobile)
 */
const pushTokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'captain',
    },
    token: {
        type: String,
        required: true,
    },
    deviceType: {
        type: String,
        enum: ['web', 'android', 'ios'],
        default: 'web',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

pushTokenSchema.index({ token: 1 }, { unique: true });

module.exports = {
    Notification: mongoose.model('Notification', notificationSchema),
    PushToken: mongoose.model('PushToken', pushTokenSchema),
};
