const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authUserOrCaptain } = require('../middlewares/auth.middlewares');
const { body } = require('express-validator');

// Chat is shared by Riders and Captains. Identity comes from the token; the
// ride itself decides who the recipient is.
router.post(
    '/send',
    authUserOrCaptain,
    body('rideId').isMongoId(),
    body('message').trim().notEmpty().isLength({ max: 500 }),
    body('messageType').optional().isIn(['text', 'location', 'system']),
    chatController.sendMessage
);

router.get('/history/:rideId', authUserOrCaptain, chatController.getChatHistory);
router.post('/read/:rideId', authUserOrCaptain, chatController.markAsRead);
router.get('/unread-count', authUserOrCaptain, chatController.getUnreadCount);

module.exports = router;
