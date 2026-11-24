/**
 * Chat — in-app real-time chat between rider and captain during a ride.
 * Works as a standalone route (/chat/:rideId) or as an embedded component.
 */

import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { SocketContext } from '../context/socket.context';

const Chat = ({ ride: rideProp, onClose }) => {
    const { rideId } = useParams();
    const navigate = useNavigate();
    const { socket } = useContext(SocketContext);

    const [ride, setRide] = useState(rideProp || { _id: rideId });
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const activeRideId = rideProp?._id || rideId;
    const captain = ride?.captain;

    const close = () => (onClose ? onClose() : navigate(-1));

    // Resolve the ride details from history when opened from a standalone route.
    useEffect(() => {
        if (rideProp || !rideId) return;
        let active = true;

        const fetchRide = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/rides/history`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const match = (Array.isArray(res.data) ? res.data : []).find(
                    (item) => item._id === rideId
                );
                if (active && match) setRide(match);
            } catch (err) {
                console.error('Error loading ride for chat:', err);
            }
        };

        fetchRide();
        return () => { active = false; };
    }, [rideProp, rideId]);

    const fetchChatHistory = useCallback(async () => {
        if (!activeRideId) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/chat/history/${activeRideId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessages(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error fetching chat history:', err);
        }
    }, [activeRideId]);

    useEffect(() => {
        if (!activeRideId) return;
        fetchChatHistory();

        if (socket) {
            socket.on('new-chat-message', (msg) => {
                if (msg.ride === activeRideId) {
                    setMessages((prev) => [...prev, msg]);
                }
            });
        }

        return () => {
            if (socket) socket.off('new-chat-message');
        };
    }, [activeRideId, socket, fetchChatHistory]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!newMessage.trim() || !activeRideId || !captain?._id) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/chat/send`,
                {
                    rideId: activeRideId,
                    recipientId: captain._id,
                    message: newMessage.trim(),
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessages((prev) => [...prev, res.data.chatMessage]);
            setNewMessage('');

            if (socket) {
                socket.emit('new-chat-message', {
                    ride: activeRideId,
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

    // This route is rider-only, so rider-sent messages are identified by senderModel.
    const isOwnMessage = (msg) => msg.senderModel === 'user';

    return (
        <div className='fixed inset-0 z-50 flex flex-col bg-white shadow-2xl'>
            <div className='p-4 border-b border-gray-200 flex items-center justify-between'>
                <button onClick={close} className='p-2 hover:bg-gray-100 rounded-lg' aria-label='Close chat'>
                    ←
                </button>
                <div className='flex-1 flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-full bg-[#f5c400] flex items-center justify-center font-bold text-[#111]'>
                        {captain?.fullname?.firstname?.charAt(0) || 'Y'}
                    </div>
                    <div>
                        <h3 className='font-semibold text-gray-900'>
                            {captain?.fullname?.firstname || 'YENKO Captain'}
                        </h3>
                        <p className='text-xs text-gray-500'>
                            {ride?.status === 'ongoing' ? 'Ride in Progress' : 'YENKO Ride Chat'}
                        </p>
                    </div>
                </div>
                <button onClick={close} className='text-gray-400 hover:text-gray-600' aria-label='Close chat'>
                    ✕
                </button>
            </div>

            <div className='flex-1 overflow-y-auto p-4 space-y-4'>
                {messages.length === 0 ? (
                    <div className='flex flex-col items-center justify-center h-full text-center text-gray-400'>
                        <span className='text-2xl'>💬</span>
                        <p className='mt-2'>No messages yet</p>
                        <p className='text-xs'>Start the conversation with your YENKO Captain</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg._id} className={`flex ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl ${
                                isOwnMessage(msg)
                                    ? 'bg-[#f5c400] text-[#111] rounded-tr-none'
                                    : 'bg-gray-100 text-gray-900 rounded-tl-none'
                            }`}>
                                <p className='text-sm'>{msg.message}</p>
                                <span className='text-[10px] opacity-70'>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className='p-4 border-t border-gray-200 bg-white'>
                <div className='flex items-center gap-2 bg-gray-50 rounded-xl p-1 border border-gray-200'>
                    <input
                        type='text'
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder='Type a message...'
                        className='flex-1 bg-transparent border-none outline-none px-3 py-2 text-sm'
                        disabled={loading}
                    />
                    <button
                        type='submit'
                        disabled={loading || !newMessage.trim()}
                        className='p-2 bg-[#111] text-white rounded-lg hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                    >
                        <span className='text-sm'>Send</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chat;
