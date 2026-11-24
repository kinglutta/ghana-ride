const ChatMessage = require('../models/chatMessage.model');
const Ride = require('../models/ride.model');

/**
 * ChatService — private rider/captain messaging, scoped to one ride.
 * Every operation checks that the caller actually belongs to the ride and
 * derives the recipient from the ride rather than trusting the request body.
 */
class ChatService {
    static participantRole(ride, accountId) {
        const id = String(accountId);
        if (ride.user && String(ride.user) === id) return 'user';
        if (ride.captain && String(ride.captain) === id) return 'captain';
        return null;
    }

    static assertParticipant(ride, accountId) {
        const role = ChatService.participantRole(ride, accountId);
        if (!role) throw new Error('Not authorized to use chat for this ride');
        return role;
    }

    static async getRide(rideId) {
        const ride = await Ride.findById(rideId);
        if (!ride) throw new Error('Ride not found');
        return ride;
    }

    /** Persist a message between the two people on a ride. */
    static async sendMessage({ rideId, senderId, senderModel, message, messageType = 'text' }) {
        const ride = await ChatService.getRide(rideId);
        const role = ChatService.assertParticipant(ride, senderId);

        if (role !== senderModel) {
            throw new Error('Account type does not match this ride');
        }

        const recipient = role === 'user' ? ride.captain : ride.user;
        if (!recipient) {
            throw new Error('Your ride companion is not assigned yet');
        }

        const chatMessage = await ChatMessage.create({
            ride: rideId,
            sender: senderId,
            senderModel: role,
            recipient,
            message,
            messageType,
        });

        return chatMessage;
    }

    /** Full conversation for a ride, only for its two participants. */
    static async getChatHistory(rideId, accountId) {
        const ride = await ChatService.getRide(rideId);
        ChatService.assertParticipant(ride, accountId);

        return ChatMessage.find({ ride: rideId })
            .sort({ createdAt: 1 })
            .populate('sender', 'fullname');
    }

    /** Mark messages addressed to this account as read. */
    static async markAsRead(rideId, accountId) {
        const ride = await ChatService.getRide(rideId);
        ChatService.assertParticipant(ride, accountId);

        return ChatMessage.updateMany(
            { ride: rideId, recipient: accountId, isRead: false },
            { isRead: true, readAt: new Date() }
        );
    }

    /** Unread count for a rider or captain, excluding their own messages. */
    static async getUnreadCount(accountId, accountModel) {
        const otherModel = accountModel === 'captain' ? 'user' : 'captain';
        return ChatMessage.countDocuments({
            recipient: accountId,
            senderModel: otherModel,
            isRead: false,
        });
    }
}

module.exports = ChatService;
