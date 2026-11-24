const NotificationService = require('../services/notification.service');
const { validationResult } = require('express-validator');
const { body } = require('express-validator');

/**
 * GET /api/notifications
 */
module.exports.getNotifications = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const notifications = await NotificationService.getUserNotifications(
            req.user._id,
            limit
        );
        return res.status(200).json(notifications);
    } catch (err) {
        console.error('❌ Error fetching notifications:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * POST /api/notifications/:id/read
 */
module.exports.markAsRead = [
    async (req, res) => {
        try {
            const notification = await NotificationService.markAsRead(
                req.params.id,
                req.user._id
            );
            if (!notification) {
                return res.status(404).json({ message: 'Notification not found' });
            }
            return res.status(200).json({ message: 'Marked as read' });
        } catch (err) {
            console.error('❌ Error marking notification as read:', err);
            return res.status(500).json({ message: err.message });
        }
    },
];

/**
 * POST /api/notifications/read-all
 */
module.exports.markAllAsRead = async (req, res) => {
    try {
        await NotificationService.markAllAsRead(req.user._id);
        return res.status(200).json({ message: 'All notifications marked as read' });
    } catch (err) {
        console.error('❌ Error marking all notifications as read:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * POST /api/notifications/register-push-token
 */
module.exports.registerPushToken = [
    body('token').notEmpty().withMessage('Push token required'),
    body('deviceType').optional().isIn(['web', 'android', 'ios']),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { token, deviceType } = req.body;
            await NotificationService.registerPushToken({
                userId: req.user._id,
                token,
                deviceType: deviceType || 'web',
            });
            return res.status(200).json({ message: 'Push token registered' });
        } catch (err) {
            console.error('❌ Error registering push token:', err);
            return res.status(500).json({ message: err.message });
        }
    },
];

/**
 * GET /api/notifications/unread-count
 */
module.exports.getUnreadCount = async (req, res) => {
    try {
        const Notification = require('../models/notification.model');
        const count = await Notification.countDocuments({
            user: req.user._id,
            isRead: false,
        });
        return res.status(200).json({ unreadCount: count });
    } catch (err) {
        console.error('❌ Error fetching unread count:', err);
        return res.status(500).json({ message: err.message });
    }
};
