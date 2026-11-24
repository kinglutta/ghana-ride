/**
 * Disputes — file and track ride disputes.
 * Riders file against a ride; admins review and resolve with refund/credit/no-action/compensate.
 * Web-optimized (React + Tailwind), uses only the free backend stack.
 */

import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { formatFare } from '../lib/mapUtils';
import CustomButton from '../components/ui/CustomButton';

const REASONS = [
    { value: 'driver_cancelled', label: 'Driver cancelled the ride' },
    { value: 'driver_no_show', label: 'Driver did not show up' },
    { value: 'overcharge', label: 'Incorrect fare / overcharged' },
    { value: 'safety', label: 'Safety concern' },
    { value: 'vehicle_issue', label: 'Vehicle issue' },
    { value: 'other', label: 'Something else' },
];

const RESOLUTIONS = [
    { value: 'refund', label: 'Refund to wallet' },
    { value: 'credit', label: 'Account credit' },
    { value: 'compensate', label: 'Compensation' },
    { value: 'no_action', label: 'No action' },
];

const Disputes = () => {
    const [rides, setRides] = useState([]);
    const [myDisputes, setMyDisputes] = useState([]);
    const [allDisputes, setAllDisputes] = useState([]);
    const [rideId, setRideId] = useState('');
    const [reason, setReason] = useState('driver_no_show');
    const [description, setDescription] = useState('');
    const [resolution, setResolution] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [showAdmin, setShowAdmin] = useState(false);

    const authHeaders = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [ridesRes, myRes] = await Promise.allSettled([
                axios.get(`${import.meta.env.VITE_API_URL}/rides/history`, authHeaders()),
                axios.get(`${import.meta.env.VITE_API_URL}/disputes/my`, authHeaders()),
            ]);
            if (ridesRes.status === 'fulfilled') setRides(ridesRes.value.data || []);
            if (myRes.status === 'fulfilled') setMyDisputes(myRes.value.data || []);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAll = useCallback(async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/disputes/all`, authHeaders());
            setAllDisputes(res.data || []);
        } catch (err) {
            console.error('Error fetching all disputes:', err);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (showAdmin) fetchAll();
    }, [showAdmin, fetchAll]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!rideId) {
            setMessage('Please select a ride');
            return;
        }
        setSubmitting(true);
        setMessage('');
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/disputes/create`,
                { rideId, reason, description },
                authHeaders()
            );
            setMessage('Dispute filed successfully. Our team will review it shortly.');
            setRideId('');
            setDescription('');
            await fetchData();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to file dispute');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResolve = async (disputeId) => {
        const choice = resolution[disputeId] || 'no_action';
        try {
            await axios.patch(
                `${import.meta.env.VITE_API_URL}/disputes/${disputeId}/resolve`,
                { resolution: choice, resolutionNote: 'Reviewed by admin' },
                authHeaders()
            );
            await Promise.all([fetchAll(), fetchData()]);
        } catch (err) {
            console.error('Error resolving dispute:', err);
        }
    };

    const statusBadge = (status) => (
        <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}
        >
            {status}
        </span>
    );

    const reasonLabel = (value) =>
        REASONS.find((r) => r.value === value)?.label || value;

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
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Disputes & Support</h1>
                    <p className="text-gray-600">Report a problem with a ride and track its resolution.</p>
                </div>

                {/* File a dispute */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">File a dispute</h2>
                    {rides.length === 0 ? (
                        <div className="text-gray-500">
                            You need a ride before you can file a dispute.{' '}
                            <a href="/ride-history" className="text-black font-semibold underline">
                                View ride history
                            </a>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ride</label>
                                <select
                                    value={rideId}
                                    onChange={(e) => setRideId(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                                >
                                    <option value="">Select a ride</option>
                                    {rides.map((ride) => (
                                        <option key={ride._id} value={ride._id}>
                                            {ride.pickup} → {ride.destination} · {formatFare(ride.fare)} · {ride.status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                                >
                                    {REASONS.map((r) => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Details (optional)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    maxLength={1000}
                                    rows={4}
                                    placeholder="Tell us what happened..."
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                                />
                            </div>
                            <CustomButton title={submitting ? 'Submitting...' : 'Submit Dispute'} type="submit" />
                            {message && (
                                <p className={`text-sm ${message.startsWith('Dispute filed') ? 'text-green-600' : 'text-red-600'}`}>
                                    {message}
                                </p>
                            )}
                        </form>
                    )}
                </div>

                {/* My disputes */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">My Disputes</h2>
                    {myDisputes.length === 0 ? (
                        <div className="text-gray-500">No disputes filed yet.</div>
                    ) : (
                        <div className="space-y-3">
                            {myDisputes.map((d) => (
                                <div key={d._id} className="border border-gray-100 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-gray-900">{reasonLabel(d.reason)}</span>
                                        {statusBadge(d.status)}
                                    </div>
                                    {d.ride && (
                                        <p className="text-sm text-gray-600">
                                            {d.ride.pickup} → {d.ride.destination}
                                        </p>
                                    )}
                                    {d.description && (
                                        <p className="text-sm text-gray-600 mt-1">{d.description}</p>
                                    )}
                                    {d.status === 'resolved' && (
                                        <p className="text-sm text-green-700 mt-2 font-medium">
                                            Resolution: {d.resolution}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Admin review */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <button
                        onClick={() => setShowAdmin((v) => !v)}
                        className="flex items-center justify-between w-full text-left"
                    >
                        <span className="text-xl font-bold text-gray-900">Admin Review</span>
                        <span className="text-sm text-gray-500">{showAdmin ? 'Hide' : 'Show'}</span>
                    </button>
                    {showAdmin && (
                        <div className="mt-4 space-y-3">
                            {allDisputes.length === 0 ? (
                                <div className="text-gray-500">No disputes to review.</div>
                            ) : (
                                allDisputes.map((d) => (
                                    <div key={d._id} className="border border-gray-100 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-gray-900">{reasonLabel(d.reason)}</span>
                                            {statusBadge(d.status)}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Role: {d.role} · Filed {new Date(d.createdAt).toLocaleString()}
                                        </p>
                                        {d.status === 'open' ? (
                                            <div className="flex gap-2">
                                                <select
                                                    value={resolution[d._id] || 'no_action'}
                                                    onChange={(e) =>
                                                        setResolution((prev) => ({ ...prev, [d._id]: e.target.value }))
                                                    }
                                                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                                                >
                                                    {RESOLUTIONS.map((r) => (
                                                        <option key={r.value} value={r.value}>{r.label}</option>
                                                    ))}
                                                </select>
                                                <CustomButton
                                                    title="Resolve"
                                                    onClick={() => handleResolve(d._id)}
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-sm text-green-700">
                                                Resolved: {d.resolution}
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Disputes;
