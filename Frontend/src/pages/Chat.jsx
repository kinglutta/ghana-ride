/**
 * Chat — private rider/captain messaging for one ride.
 *
 * Works as a full-screen route (/chat/:rideId) or embedded in the active ride
 * screen. Identity comes from the role token; recipients are derived by the
 * API from the ride, and live messages arrive on the authenticated ride room.
 */
import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { SocketContext } from '../context/socket.context';
import { getToken } from '../lib/authToken';

const Chat = ({ ride: rideProp, onClose, viewerRole = 'rider' }) => {
    const { rideId: routeRideId } = useParams();
    const navigate = useNavigate();
    const { socket } = useContext(SocketContext);

    const [ride, setRide] = useState(rideProp || { _id: routeRideId });
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef(null);

    const activeRideId = rideProp?._id || routeRideId;
    const token = getToken(viewerRole);
    const myModel = viewerRole === 'captain' ? 'captain' : 'user';
    const companion = viewerRole === 'captain' ? ride?.user : ride?.captain;
    const companionName = companion?.fullname?.firstname
        ? `${companion.fullname.firstname}${viewerRole === 'captain' ? ' (Rider)' : ' (Captain)'}`
        : viewerRole === 'captain' ? 'Your Rider' : 'YENKO Captain';

    const close = () => (onClose ? onClose() : navigate(-1));

    // Resolve ride details when opened as the rider's standalone route.
    useEffect(() => {
        if (rideProp || !routeRideId || viewerRole !== 'rider') return;
        let active = true;

        const fetchRide = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/rides/history`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const match = (Array.isArray(res.data) ? res.data : []).find(
                    (item) => item._id === routeRideId
                );
                if (active && match) setRide(match);
            } catch (err) {
                console.error('Error loading ride for chat:', err);
            }
        };

        fetchRide();
        return () => { active = false; };
    }, [rideProp, routeRideId, token, viewerRole]);

    const markRead = useCallback(async () => {
        if (!activeRideId || !token) return;
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/chat/read/${activeRideId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch {
            // Read receipts are best-effort; never interrupt the conversation.
        }
    }, [activeRideId, token]);

    const fetchChatHistory = useCallback(async () => {
        if (!activeRideId || !token) return;
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/chat/history/${activeRideId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessages(Array.isArray(res.data) ? res.data : []);
            markRead();
        } catch (err) {
            setError(err.response?.data?.message || 'Could not load messages.');
        }
    }, [activeRideId, token, markRead]);

    useEffect(() => {
        if (!activeRideId || !token) return;

        fetchChatHistory();

        // Authenticated, ride-scoped room — other rides never see these events.
        if (socket) socket.emit('ride:join', { rideId: activeRideId, token });

        const onMessage = (msg) => {
            if (!msg || String(msg.ride) !== String(activeRideId)) return;
            setMessages((prev) => (
                prev.some((item) => String(item._id) === String(msg._id)) ? prev : [...prev, msg]
            ));
            if (msg.senderModel !== myModel) markRead();
        };

        const onJoinError = (data) => setError(data?.message || 'Could not join ride chat.');

        if (socket) {
            socket.on('new-chat-message', onMessage);
            socket.on('ride:join-error', onJoinError);
        }

        return () => {
            if (socket) {
                socket.off('new-chat-message', onMessage);
                socket.off('ride:join-error', onJoinError);
            }
        };
    }, [activeRideId, token, socket, fetchChatHistory, markRead, myModel]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (event) => {
        event?.preventDefault();
        const text = newMessage.trim();
        if (!text || !activeRideId || loading) return;

        setLoading(true);
        setError('');
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/chat/send`,
                { rideId: activeRideId, message: text },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // The server broadcasts to the ride room; append locally so the
            // sender sees the message even before the socket round-trip.
            setMessages((prev) => (
                prev.some((item) => String(item._id) === String(res.data.chatMessage._id))
                    ? prev
                    : [...prev, res.data.chatMessage]
            ));
            setNewMessage('');
        } catch (err) {
            setError(err.response?.data?.message || 'Message could not be sent.');
        } finally {
            setLoading(false);
        }
    };

    const isOwnMessage = (msg) => msg.senderModel === myModel;

    return (
        <div className='fixed inset-0 z-50 flex flex-col bg-[#f6f7f8]'>
            <div className='border-b border-gray-200 bg-white p-4 shadow-sm'>
                <div className='flex items-center justify-between gap-3'>
                    <button onClick={close} className='rounded-lg p-2 hover:bg-gray-100' aria-label='Close chat'>
                        ←
                    </button>
                    <div className='flex flex-1 items-center gap-3'>
                        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-[#f5c400] font-black text-[#111]'>
                            {companion?.fullname?.firstname?.charAt(0) || 'Y'}
                        </div>
                        <div>
                            <h3 className='font-bold text-[#111]'>{companionName}</h3>
                            <p className='text-xs text-gray-500'>
                                {ride?.status === 'ongoing' ? 'Ride in progress' : 'Private YENKO ride chat'}
                            </p>
                        </div>
                    </div>
                    <button onClick={close} className='text-gray-400 hover:text-gray-600' aria-label='Close chat'>
                        ✕
                    </button>
                </div>
                <div className='mt-3 flex items-center gap-2 rounded-lg bg-[#fffdf2] px-3 py-2 text-[11px] text-[#8a6d00]'>
                    <span>🔒</span>
                    Only you and your {viewerRole === 'captain' ? 'rider' : 'captain'} can see this conversation.
                </div>
            </div>

            {error && (
                <div className='bg-red-50 px-4 py-2 text-center text-xs font-semibold text-red-700'>{error}</div>
            )}

            <div className='yenko-scroll flex-1 space-y-3 overflow-y-auto p-4'>
                {messages.length === 0 ? (
                    <div className='flex h-full flex-col items-center justify-center text-center text-gray-400'>
                        <span className='text-3xl'>💬</span>
                        <p className='mt-2 font-semibold'>No messages yet</p>
                        <p className='text-xs'>
                            Say hello to your {viewerRole === 'captain' ? 'rider' : 'captain'} — coordination makes rides smoother.
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg._id || msg.createdAt} className={`flex ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[82%] rounded-2xl px-3 py-2 ${
                                isOwnMessage(msg)
                                    ? 'rounded-tr-none bg-[#111] text-white'
                                    : 'rounded-tl-none border border-gray-100 bg-white text-[#111] shadow-sm'
                            }`}>
                                <p className='text-sm leading-relaxed'>{msg.message}</p>
                                <span className={`mt-1 block text-[10px] ${isOwnMessage(msg) ? 'text-white/50' : 'text-gray-400'}`}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {isOwnMessage(msg) && msg.isRead ? ' · Read' : ''}
                                </span>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className='border-t border-gray-200 bg-white p-4'>
                <div className='flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1'>
                    <input
                        type='text'
                        value={newMessage}
                        onChange={(event) => setNewMessage(event.target.value)}
                        placeholder='Type a message…'
                        maxLength={500}
                        className='flex-1 bg-transparent px-3 py-2 text-sm outline-none'
                        disabled={loading}
                    />
                    <button
                        type='submit'
                        disabled={loading || !newMessage.trim()}
                        className='rounded-lg bg-[#f5c400] px-4 py-2 text-sm font-bold text-[#111] transition hover:bg-[#e5b600] disabled:cursor-not-allowed disabled:opacity-50'
                    >
                        {loading ? '…' : 'Send'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chat;
