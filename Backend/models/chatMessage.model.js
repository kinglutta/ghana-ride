const mongoose = require('mongoose');

/**
 * ChatMessage — real-time chat between passenger and driver during a ride
 */
const chatMessageSchema = new mongoose.Schema({
    ride: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ride',
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'senderModel',
    },
    senderModel: {
        type: String,
        enum: ['user', 'captain'],
        required: true,
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    message: {
        type: String,
        required: true,
        maxlength: 500,
    },
    messageType: {
        type: String,
        enum: ['text', 'location', 'system'],
        default: 'text',
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    readAt: {
        type: Date,
    },
}, { timestamps: true });

chatMessageSchema.index({ ride: 1, createdAt: 1 });
chatMessageSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
