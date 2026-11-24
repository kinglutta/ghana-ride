const ChatService = require('../services/chat.service');
const { body, validationResult } = require('express-validator');

const identity = (req) => (req.captain
    ? { id: req.captain._id, model: 'captain' }
    : { id: req.user._id, model: 'user' });

/** POST /chat/send — persisted first, then delivered to the ride room only. */
module.exports.sendMessage = [
    body('rideId').isMongoId().withMessage('Invalid ride id'),
    body('message').trim().notEmpty().withMessage('Message required').isLength({ max: 500 }),
    body('messageType').optional().isIn(['text', 'location', 'system']),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { rideId, message, messageType } = req.body;
            const sender = identity(req);

            const chatMessage = await ChatService.sendMessage({
                rideId,
                senderId: sender.id,
                senderModel: sender.model,
                message: message.trim(),
                messageType: messageType || 'text',
            });

            const io = req.app.get('io');
            if (io) {
                io.to(`ride:${rideId}`).emit('new-chat-message', chatMessage);
            }

            return res.status(201).json({ message: 'Message sent', chatMessage });
        } catch (err) {
            return res.status(400).json({ message: err.message });
        }
    },
];

/** GET /chat/history/:rideId */
module.exports.getChatHistory = async (req, res) => {
    try {
        const { id } = identity(req);
        const messages = await ChatService.getChatHistory(req.params.rideId, id);
        return res.status(200).json(messages);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};

/** POST /chat/read/:rideId */
module.exports.markAsRead = async (req, res) => {
    try {
        const { id } = identity(req);
        await ChatService.markAsRead(req.params.rideId, id);
        return res.status(200).json({ message: 'Messages marked as read' });
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};

/** GET /chat/unread-count */
module.exports.getUnreadCount = async (req, res) => {
    try {
        const { id, model } = identity(req);
        const unreadCount = await ChatService.getUnreadCount(id, model);
        return res.status(200).json({ unreadCount });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
