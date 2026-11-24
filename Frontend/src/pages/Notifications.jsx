/**
 * Notifications — in-app notification center
 * YENKO-standard notification experience
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CustomButton from '../components/ui/CustomButton';

const NOTIFICATION_CONFIG = {
    ride_request: { icon: '🚗', color: 'text-blue-600' },
    ride_accepted: { icon: '✅', color: 'text-green-600' },
    ride_started: { icon: '🚕', color: 'text-blue-600' },
    ride_ended: { icon: '🏁', color: 'text-gray-600' },
    ride_completed: { icon: '🎉', color: 'text-green-600' },
    payment: { icon: '💳', color: 'text-indigo-600' },
    payout: { icon: '💸', color: 'text-emerald-600' },
    promo: { icon: '🎟️', color: 'text-purple-600' },
    referral: { icon: '👥', color: 'text-pink-600' },
    sos: { icon: '🚨', color: 'text-red-600' },
    system: { icon: 'ℹ️', color: 'text-gray-600' },
    scheduled_ride: { icon: '📅', color: 'text-orange-600' },
};

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(res.data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/notifications/unread-count`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUnreadCount(res.data.unreadCount);
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL}/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_API_URL}/notifications/read-all`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const getConfig = (type) =>
        NOTIFICATION_CONFIG[type] || { icon: 'ℹ️', color: 'text-gray-600' };

    const relativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">🔔 Notifications</h1>
                        <p className="text-gray-600">Stay updated on your rides and account</p>
                    </div>
                    {unreadCount > 0 && (
                        <CustomButton
                            title="Mark All as Read"
                            bgVariant="outline"
                            onClick={handleMarkAllAsRead}
                        />
                    )}
                </div>

                {notifications.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <div className="text-gray-300 text-4xl mb-4">📭</div>
                        <h3 className="text-lg font-semibold text-gray-800">No notifications</h3>
                        <p className="text-gray-600">
                            You'll see ride updates, payment confirmations, and safety alerts here
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notification) => {
                            const config = getConfig(notification.type);
                            return (
                                <div
                                    key={notification._id}
                                    onClick={() =>
                                        !notification.isRead &&
                                        handleMarkAsRead(notification._id)
                                    }
                                    className={`cursor-pointer flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                                        !notification.isRead
                                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                                            : 'bg-white border-gray-100 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className={badgeConfig(config)}>
                                        {config.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className={`font-semibold text-gray-900 ${!notification.isRead ? 'text-blue-800' : 'text-gray-700'}`}>
                                                {notification.title}
                                            </h4>
                                            <span className="text-xs text-gray-400">
                                                {relativeTime(notification.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">
                                            {notification.body}
                                        </p>
                                        {!notification.isRead && (
                                            <span className="text-xs font-medium text-blue-600">
                                                Tap to mark as read
                                            </span>
                                        )}
                                    </div>
                                    {!notification.isRead && (
                                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="mt-8 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-700">
                    <div className="font-semibold mb-2">🔔 Push Notifications</div>
                    <p>
                        Enable push notifications to receive ride updates even when the app is closed.
                    </p>
                    <CustomButton
                        title="Enable Push Notifications"
                        bgVariant="outline"
                        onClick={() => {
                            if (
                                'serviceWorker' in navigator &&
                                'PushManager' in window
                            ) {
                                navigator.serviceWorker.ready.then((reg) =>
                                    reg.pushManager.getSubscription().then((sub) => {
                                        if (!sub) {
                                            alert(
                                                'Push notification registration would happen here (VAPID key required for production)'
                                            );
                                        } else {
                                            alert('Push notifications already enabled');
                                        }
                                    })
                                );
                            } else {
                                alert('Push notifications not supported in this browser');
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

const badgeConfig = (config) =>
    `w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.color.replace('text-', 'bg-')}-100`;

export default Notifications;
