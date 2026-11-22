/**
 * AdminDashboard — web-based fleet management dashboard.
 * Gives the admin visibility into rides, drivers, and earnings.
 * 100% free — no paid admin panels required.
 */

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { formatTime, formatFare } from '../lib/mapUtils';
import CustomButton from '../components/ui/CustomButton';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalRides: 0,
        completedRides: 0,
        activeCaptains: 0,
        totalEarnings: 0,
    });
    const [recentRides, setRecentRides] = useState([]);
    const [captains, setCaptains] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                // These endpoints need to be added to backend
                const [statsRes, ridesRes, captainsRes] = await Promise.allSettled([
                    axios.get(`${import.meta.env.VITE_API_URL}/admin/stats`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    axios.get(`${import.meta.env.VITE_API_URL}/admin/rides/recent`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    axios.get(`${import.meta.env.VITE_API_URL}/admin/captains`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

                if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
                if (ridesRes.status === 'fulfilled') setRecentRides(ridesRes.value.data || []);
                if (captainsRes.status === 'fulfilled') setCaptains(captainsRes.value.data || []);
            } catch (err) {
                console.error('Admin dashboard error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Fleet Dashboard</h1>
                <CustomButton
                    title="Refresh"
                    bgVariant="outline"
                    onClick={() => window.location.reload()}
                />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Total Rides</div>
                    <div className="text-3xl font-bold text-gray-900">{stats.totalRides}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Completed</div>
                    <div className="text-3xl font-bold text-gray-900">{stats.completedRides}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Active Captains</div>
                    <div className="text-3xl font-bold text-gray-900">{stats.activeCaptains}</div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Total Earnings</div>
                    <div className="text-3xl font-bold text-gray-900">{formatFare(stats.totalEarnings)}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Rides */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Recent Rides</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Ride</th>
                                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Route</th>
                                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Fare</th>
                                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentRides.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-4 text-center text-gray-500">
                                            No recent rides
                                        </td>
                                    </tr>
                                ) : (
                                    recentRides.map((ride) => (
                                        <tr key={ride._id} className="hover:bg-gray-50">
                                            <td className="py-3 text-gray-900 font-medium">
                                                #{ride._id.slice(-6)}
                                            </td>
                                            <td className="py-3 text-sm text-gray-700">
                                                <div className="font-medium">{ride.pickup}</div>
                                                <div className="text-gray-500">{ride.destination}</div>
                                            </td>
                                            <td className="py-3 text-gray-900 font-medium">
                                                {formatFare(ride.fare)}
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                        ride.status === 'completed'
                                                            ? 'bg-green-100 text-green-700'
                                                            : ride.status === 'ongoing'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : ride.status === 'pending'
                                                            ? 'bg-yellow-100 text-yellow-700'
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                    {ride.status}
                                                </span>
                                            </td>
                                            <td className="py-3 text-sm text-gray-500">
                                                {new Date(ride.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Captains */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Captains</h2>
                    <div className="space-y-3">
                        {captains.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">No captains</div>
                        ) : (
                            captains.map((captain) => (
                                <div
                                    key={captain._id}
                                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src="/assets/driver-logo.svg"
                                            alt="Captain"
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900">
                                                {captain.fullname?.firstname} {captain.fullname?.lastname}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {captain.vehicle?.vehicleType} • {captain.vehicle?.plate}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                captain.status === 'active'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-700'
                                            }`}
                                        >
                                            {captain.status}
                                        </span>
                                        <span className="text-xs font-bold text-gray-900">
                                            {captain.rating || 5}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
