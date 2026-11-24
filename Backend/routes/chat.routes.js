const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const authMiddleware = require('../middlewares/auth.middlewares');
const { body } = require('express-validator');

router.post(
    '/send',
    authMiddleware.authUser,
    body('rideId').isMongoId(),
    body('recipientId').isMongoId(),
    body('message').notEmpty(),
    body('messageType').optional().isIn(['text', 'location', 'system']),
    chatController.sendMessage
);

router.get(
    '/history/:rideId',
    authMiddleware.authUser,
    chatController.getChatHistory
);

router.post(
    '/read/:rideId',
    authMiddleware.authUser,
    chatController.markAsRead
);

router.get(
    '/unread-count',
    authMiddleware.authUser,
    chatController.getUnreadCount
);

module.exports = router;
