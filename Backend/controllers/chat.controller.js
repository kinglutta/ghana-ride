const ChatService = require('../services/chat.service');
const { validationResult } = require('express-validator');
const { body } = require('express-validator');

/**
 * POST /api/chat/send
 */
module.exports.sendMessage = [
    body('rideId').isMongoId().withMessage('Invalid ride id'),
    body('recipientId').isMongoId().withMessage('Invalid recipient id'),
    body('message').notEmpty().withMessage('Message required'),
    body('messageType').optional().isIn(['text', 'location', 'system']),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { rideId, recipientId, message, messageType } = req.body;
            // Determine sender model based on auth middleware (user or captain)
            const senderModel = req.captain ? 'captain' : 'user';
            const senderId = req.captain ? req.captain._id : req.user._id;

            const chatMessage = await ChatService.sendMessage({
                rideId,
                senderId,
                senderModel,
                recipientId,
                message,
                messageType: messageType || 'text',
            });

            return res.status(201).json({
                message: 'Message sent',
                chatMessage,
            });
        } catch (err) {
            console.error('❌ Error sending chat message:', err);
            return res.status(400).json({ message: err.message });
        }
    },
];

/**
 * GET /api/chat/history/:rideId
 */
module.exports.getChatHistory = async (req, res) => {
    try {
        const { rideId } = req.params;
        const senderModel = req.captain ? 'captain' : 'user';
        const senderId = req.captain ? req.captain._id : req.user._id;

        const messages = await ChatService.getChatHistory(rideId, senderId, senderModel);
        return res.status(200).json(messages);
    } catch (err) {
        console.error('❌ Error fetching chat history:', err);
        return res.status(400).json({ message: err.message });
    }
};

/**
 * POST /api/chat/read/:rideId
 */
module.exports.markAsRead = async (req, res) => {
    try {
        const { rideId } = req.params;
        const senderId = req.captain ? req.captain._id : req.user._id;

        await ChatService.markAsRead(rideId, senderId);
        return res.status(200).json({ message: 'Messages marked as read' });
    } catch (err) {
        console.error('❌ Error marking messages as read:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * GET /api/chat/unread-count
 */
module.exports.getUnreadCount = async (req, res) => {
    try {
        const senderId = req.captain ? req.captain._id : req.user._id;
        const count = await ChatService.getUnreadCount(senderId);
        return res.status(200).json({ unreadCount: count });
    } catch (err) {
        console.error('❌ Error fetching unread count:', err);
        return res.status(500).json({ message: err.message });
    }
};
