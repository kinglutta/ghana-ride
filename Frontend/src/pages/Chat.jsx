/**
 * Chat — in-app real-time chat between passenger and driver during a ride
 */

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import { formatFare } from '../lib/mapUtils';

const Chat = ({ ride, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { socket } = useContext(SocketContext);

    const recipientId = ride.captain?._id || ride.user?._id;
    const isDriver = !!ride.captain && ride.user?._id !== (localStorage.getItem('userId') || '');

    useEffect(() => {
        if (!ride?._id) return;

        fetchChatHistory();

        // Listen for new messages via socket
        if (socket) {
            socket.on('new-chat-message', (msg) => {
                if (msg.ride === ride._id) {
                    setMessages(prev => [...prev, msg]);
                }
            });
        }

        return () => {
            if (socket) socket.off('new-chat-message');
        };
    }, [ride?._id, socket]);

    const fetchChatHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/chat/history/${ride._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessages(res.data);
        } catch (err) {
            console.error('Error fetching chat history:', err);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !ride?._id) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const recipientId = ride.captain?._id || ride.user?._id;

            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/chat/send`,
                {
                    rideId: ride._id,
                    recipientId,
                    message: newMessage.trim(),
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessages(prev => [...prev, res.data.chatMessage]);
            setNewMessage('');

            // Also emit via socket for real-time delivery
            if (socket) {
                socket.emit('new-chat-message', {
                    ride: ride._id,
                    sender: res.data.chatMessage.sender,
                    message: res.data.chatMessage.message,
                    createdAt: res.data.chatMessage.createdAt,
                });
            }
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setLoading(false);
        }
    };

    const senderName = (msg) => {
        if (msg.senderModel === 'captain') return 'Driver';
        return 'You';
    };

    const isOwnMessage = (msg) => {
        const userId = localStorage.getItem('userId');
        return msg.sender?._id === userId || msg.sender === userId;
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                >
                    ←
                </button>
                <div className="flex-1 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {ride.captain?.fullname?.firstname?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">
                            {ride.captain?.fullname?.firstname || 'Driver'}
                        </h3>
                        <p className="text-xs text-gray-500">
                            {ride.status === 'ongoing' ? 'Ride in Progress' : 'Ride Chat'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                        <span className="text-2xl">💬</span>
                        <p className="mt-2">No messages yet</p>
                        <p className="text-xs">Start the conversation with your driver</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg._id}
                            className={`flex ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] p-3 rounded-2xl ${
                                isOwnMessage(msg)
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-gray-100 text-gray-900 rounded-tl-none'
                            }`}>
                                <p className="text-sm">{msg.message}</p>
                                <span className={`text-[10px] ${isOwnMessage(msg) ? 'text-blue-200' : 'text-gray-500'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1 border border-gray-200">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend(e)}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-sm"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !newMessage.trim()}
                        className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <span className="text-sm">Send</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;
