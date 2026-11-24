const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middlewares/auth.middlewares');
const { body } = require('express-validator');

router.get(
    '/',
    authMiddleware.authUser,
    notificationController.getNotifications
);

router.post(
    '/:id/read',
    authMiddleware.authUser,
    notificationController.markAsRead
);

router.post(
    '/read-all',
    authMiddleware.authUser,
    notificationController.markAllAsRead
);

router.post(
    '/register-push-token',
    authMiddleware.authUser,
    body('token').notEmpty(),
    body('deviceType').optional().isIn(['web', 'android', 'ios']),
    notificationController.registerPushToken
);

router.get(
    '/unread-count',
    authMiddleware.authUser,
    notificationController.getUnreadCount
);

module.exports = router;
