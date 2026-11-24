const ChatMessage = require('../models/chatMessage.model');
const Ride = require('../models/ride.model');

/**
 * ChatService — real-time chat between passenger and driver during a ride
 */
class ChatService {
    /**
     * Send a chat message
     */
    static async sendMessage({ rideId, senderId, senderModel, recipientId, message, messageType = 'text' }) {
        // Verify the ride exists and both parties are part of it
        const ride = await Ride.findById(rideId);
        if (!ride) {
            throw new Error('Ride not found');
        }

        const isPassenger = ride.user.toString() === senderId;
        const isDriver = ride.captain && ride.captain.toString() === senderId;

        if (!isPassenger && !isDriver) {
            throw new Error('Not authorized to chat on this ride');
        }

        const chatMessage = await ChatMessage.create({
            ride: rideId,
            sender: senderId,
            senderModel,
            recipient: recipientId,
            message,
            messageType,
        });

        return chatMessage;
    }

    /**
     * Get chat history for a ride
     */
    static async getChatHistory(rideId, userId, userModel) {
        const ride = await Ride.findById(rideId);
        if (!ride) {
            throw new Error('Ride not found');
        }

        const isPassenger = ride.user.toString() === userId;
        const isDriver = ride.captain && ride.captain.toString() === userId;

        if (!isPassenger && !isDriver) {
            throw new Error('Not authorized to view chat for this ride');
        }

        return ChatMessage.find({ ride: rideId })
            .sort({ createdAt: 1 })
            .populate('sender', 'fullname');
    }

    /**
     * Mark messages as read
     */
    static async markAsRead(rideId, recipientId) {
        return ChatMessage.updateMany(
            { ride: rideId, recipient: recipientId, isRead: false },
            { isRead: true, readAt: new Date() }
        );
    }

    /**
     * Get unread message count for a user
     */
    static async getUnreadCount(userId) {
        return ChatMessage.countDocuments({ recipient: userId, isRead: false });
    }
}

module.exports = ChatService;
