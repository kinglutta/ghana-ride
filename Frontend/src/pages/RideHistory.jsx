/**
 * RideHistory — shows past completed rides.
 * YENKO ride history screen pattern.
 * Web-optimized (React + Tailwind).
 */

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { formatTime, formatFare } from '../lib/mapUtils';
import CustomButton from '../components/ui/CustomButton';
import RateRideModal from '../components/RateRideModal';
import { getToken } from '../lib/authToken';

const RideHistory = () => {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ratingRide, setRatingRide] = useState(null);
    const navigate = useNavigate();

    const fetchRides = async () => {
        try {
            const token = getToken();
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/rides/history`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setRides(response.data || []);
        } catch (err) {
            setError(err.message || 'Failed to load ride history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRides();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Unable to load history</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <CustomButton
                    title="Retry"
                    onClick={() => window.location.reload()}
                />
            </div>
        );
    }

    if (rides.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center">
                <div className="text-gray-400 text-4xl mb-4">🚗</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No rides yet</h3>
                <p className="text-gray-600 mb-8">Your ride history will appear here.</p>
                <CustomButton
                    title="Book a Ride"
                    bgVariant="outline"
                    onClick={() => navigate('/home')}
                />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Ride History</h1>
                <div className="text-sm text-green-600 font-medium">
                    {rides.filter(r => r.status === 'completed').length} completed
                </div>
            </div>

            <div className="space-y-4">
                {rides.map((ride) => (
                    <div
                        key={ride._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
                    >
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-500 uppercase">Pickup</span>
                            </div>
                            <p className="text-gray-900 font-medium">{ride.pickup}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm font-medium text-gray-500 uppercase">Destination</span>
                            </div>
                            <p className="text-gray-900 font-medium">{ride.destination}</p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <div className="text-lg font-bold text-black">
                                {formatFare(ride.fare)}
                            </div>
                            <div className="text-xs text-gray-500 uppercase">
                                {formatTime(ride.duration)} • {Math.round(ride.distance / 1000)} km
                            </div>
                            <div
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                    ride.status === 'completed'
                                        ? 'bg-green-100 text-green-700'
                                        : ride.status === 'cancelled'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                                {ride.status}
                            </div>
                            {ride.rating && (
                                <div className="flex items-center gap-1 text-sm text-yellow-600">
                                    <span>★</span>
                                    <span>{ride.rating}</span>
                                </div>
                            )}
                            <div className="flex gap-2 pt-1">
                                {ride.status === 'completed' && !ride.rating && (
                                    <button
                                        onClick={() => setRatingRide(ride)}
                                        className="rounded-lg bg-yenko px-3 py-1.5 text-xs font-bold text-ink"
                                    >
                                        Rate Captain
                                    </button>
                                )}
                                <button
                                    onClick={() => navigate(`/chat/${ride._id}`)}
                                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700"
                                >
                                    Chat
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {ratingRide && (
                <RateRideModal
                    rideId={ratingRide._id}
                    captainName={ratingRide.captain?.fullname?.firstname || 'your Captain'}
                    onClose={() => setRatingRide(null)}
                    onRated={fetchRides}
                />
            )}
        </div>
    );
};

export default RideHistory;
