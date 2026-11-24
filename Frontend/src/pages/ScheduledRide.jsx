/**
 * ScheduledRide â€” book rides for a future date/time
 * Yango-standard scheduled ride experience
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../components/ui/CustomButton';
import InputField from '../components/ui/InputField';
import { formatFare } from '../lib/mapUtils';

const ScheduledRide = () => {
    const navigate = useNavigate();
    const [pickup, setPickup] = useState('');
    const [destination, setDestination] = useState('');
    const [vehicleType, setVehicleType] = useState('car');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [fare, setFare] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const VEHICLE_CONFIG = {
        car: { name: 'YenkoGo', icon: 'ðŸš—', seats: 4 },
        bike: { name: 'YenkoBike', icon: 'ðŸï¸', seats: 1 },
        auto: { name: 'YenkoAuto', icon: 'ðŸ›º', seats: 3 },
        comfort: { name: 'YenkoComfort', icon: 'âœ¨', seats: 4 },
        xl: { name: 'YenkoXL', icon: 'ðŸš™', seats: 6 },
    };

    // Default to tomorrow at 9am
    useEffect(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        setScheduledDate(tomorrow.toISOString().split('T')[0]);
        setScheduledTime('09:00');
    }, []);

    const handleDateTimeChange = () => {
        // Recalculate fare when date/time changes (surge may differ)
        if (pickup && destination) {
            calculateFare();
        }
    };

    const calculateFare = async () => {
        if (!pickup || !destination || !scheduledDate || !scheduledTime) return;

        const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
        if (scheduledAt <= new Date()) {
            setMessage('Please select a future date and time');
            return;
        }

        setLoading(true);
        try {
            let lat, lng;
            if (navigator.geolocation) {
                try {
                    const pos = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                    });
                    lat = pos.coords.latitude;
                    lng = pos.coords.longitude;
                } catch (e) {
                    console.log('Geolocation unavailable');
                }
            }

            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/rides/get-fare`, {
                params: { pickup, destination, vehicleType, lat, lng },
                headers: { Authorization: `Bearer ${token}` },
            });
            setFare(res.data);
        } catch (err) {
            console.error('Error calculating fare:', err);
            setMessage('Failed to calculate fare');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!pickup || !destination || !scheduledDate || !scheduledTime || !fare) {
            setMessage('Please fill all fields and calculate fare');
            return;
        }

        const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
        if (scheduledAt <= new Date()) {
            setMessage('Please select a future date and time');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            let lat, lng;
            if (navigator.geolocation) {
                try {
                    const pos = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                    });
                    lat = pos.coords.latitude;
                    lng = pos.coords.longitude;
                } catch (e) {}
            }

            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/scheduled-rides/create`,
                {
                    pickup,
                    destination,
                    vehicleType,
                    scheduledAt: scheduledAt.toISOString(),
                    fare: fare.finalFare,
                    lat,
                    lng,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage(res.data.message);
            // Redirect to scheduled rides list after a short delay
            setTimeout(() => navigate('/scheduled-rides/my-rides'), 1500);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to schedule ride');
        } finally {
            setLoading(false);
        }
    };

    const scheduledDateTime = scheduledDate && scheduledTime
        ? new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()
        : '';

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">ðŸ“… Schedule a Ride</h1>
                        <p className="text-gray-600">Book your ride in advance</p>
                    </div>
                    {message && (
                        <div className="px-4 py-2 rounded bg-green-100 text-green-700 text-sm font-medium">
                            {message}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
                    <div className="space-y-3">
                        <InputField
                            label="Pickup Location"
                            value={pickup}
                            onChange={(e) => setPickup(e.target.value)}
                            placeholder="e.g. Adum, Kumasi"
                        />
                        <InputField
                            label="Destination"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            placeholder="e.g. Kejetia Market, Kumasi"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700">Date & Time</label>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField
                                type="date"
                                value={scheduledDate}
                                onChange={(e) => {
                                    setScheduledDate(e.target.value);
                                    handleDateTimeChange();
                                }}
                                min={new Date().toISOString().split('T')[0]}
                            />
                            <InputField
                                type="time"
                                value={scheduledTime}
                                onChange={(e) => {
                                    setScheduledTime(e.target.value);
                                    handleDateTimeChange();
                                }}
                            />
                        </div>
                        <p className="text-sm text-gray-500">
                            Scheduled for: {scheduledDateTime || 'Not set'}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700">Vehicle Type</label>
                        <div className="grid grid-cols-3 gap-3">
                            {Object.entries(VEHICLE_CONFIG).map(([key, cfg]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setVehicleType(key)}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                                        vehicleType === key
                                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                                            : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                                    }`}
                                >
                                    <span className="text-xl">{cfg.icon}</span>
                                    <span>{cfg.name}</span>
                                    <span className="text-xs text-gray-400">{cfg.seats} seats</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {fare && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-600 text-sm">Base Fare</span>
                                <span className="text-sm font-medium">{formatFare(fare.baseFare)}</span>
                            </div>
                            {fare.surgeFactor > 0 && (
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-yellow-600 text-sm">Surge Pricing</span>
                                    <span className="text-yellow-600 text-sm font-bold">+{fare.surgeFactor}%</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                <span className="text-lg font-bold text-gray-900">Total Fare</span>
                                <span className="text-lg font-bold text-gray-900">{formatFare(fare.finalFare)}</span>
                            </div>
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            type="button"
                            onClick={calculateFare}
                            disabled={loading || !pickup || !destination}
                            className={`w-full py-3 rounded-xl border text-sm font-medium transition-all ${
                                fare
                                    ? 'bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed'
                                    : 'bg-black border-black text-white'
                            }`}
                        >
                            {loading ? 'Calculating...' : 'Calculate Fare'}
                        </button>
                    </div>

                    {fare && (
                        <div>
                            <CustomButton
                                type="submit"
                                title="Schedule Ride"
                                loading={loading}
                                disabled={loading || !scheduledDateTime || new Date(scheduledDateTime) <= new Date()}
                            />
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default ScheduledRide;
