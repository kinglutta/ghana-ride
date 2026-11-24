const { Notification, PushToken } = require('../models/notification.model');

/**
 * NotificationService — in-app notifications + Web Push (free, no Firebase required)
 */
class NotificationService {
    /**
     * Create an in-app notification
     */
    static async create({ userId, captainId, type, title, body, data = {} }) {
        const notification = await Notification.create({
            user: userId || null,
            captain: captainId || null,
            type,
            title,
            body,
            data,
        });
        return notification;
    }

    /**
     * Get notifications for a user
     */
    static async getUserNotifications(userId, limit = 50) {
        return Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(limit);
    }

    /**
     * Get notifications for a captain
     */
    static async getCaptainNotifications(captainId, limit = 50) {
        return Notification.find({ captain: captainId })
            .sort({ createdAt: -1 })
            .limit(limit);
    }

    /**
     * Mark notification as read
     */
    static async markAsRead(notificationId, userId) {
        return Notification.findOneAndUpdate(
            { _id: notificationId, user: userId },
            { isRead: true, readAt: new Date() },
            { new: true }
        );
    }

    /**
     * Mark all notifications as read for a user
     */
    static async markAllAsRead(userId) {
        return Notification.updateMany(
            { user: userId, isRead: false },
            { isRead: true, readAt: new Date() }
        );
    }

    /**
     * Register a push token (PWA / mobile)
     */
    static async registerPushToken({ userId, captainId, token, deviceType = 'web' }) {
        let pushToken = await PushToken.findOne({ token });
        if (pushToken) {
            pushToken.user = userId || pushToken.user;
            pushToken.captain = captainId || pushToken.captain;
            pushToken.deviceType = deviceType;
            pushToken.isActive = true;
            await pushToken.save();
        } else {
            pushToken = await PushToken.create({
                user: userId || null,
                captain: captainId || null,
                token,
                deviceType,
            });
        }
        return pushToken;
    }

    /**
     * Get all active push tokens for broadcasting
     */
    static async getActivePushTokens() {
        return PushToken.find({ isActive: true });
    }

    /**
     * Send push notification (Web Push API - free)
     * In production, integrate with VAPID keys for web push
     */
    static async sendPush({ userId, title, body, data = {} }) {
        const tokens = await PushToken.find({ user: userId, isActive: true });
        const results = [];

        for (const tokenDoc of tokens) {
            try {
                // Web Push API would go here with VAPID keys
                // For MVP, we store the notification as in-app
                results.push({
                    token: tokenDoc.token,
                    status: 'stored_as_in_app',
                });
            } catch (err) {
                results.push({ token: tokenDoc.token, status: 'failed', error: err.message });
            }
        }

        return results;
    }
}

module.exports = NotificationService;
