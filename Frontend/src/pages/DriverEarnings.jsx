/**
 * DriverEarnings — Captain earnings dashboard
 * YENKO-standard driver earnings with payout requests
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CustomButton from '../components/ui/CustomButton';
import InputField from '../components/ui/InputField';
import { formatFare } from '../lib/mapUtils';

const DriverEarnings = () => {
    const [earnings, setEarnings] = useState({
        totalEarnings: 0,
        availableForPayout: 0,
        totalRides: 0,
        completedRides: 0,
        rating: 5,
        totalPaidOut: 0,
        status: 'inactive',
    });
    const [payouts, setPayouts] = useState([]);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [payoutProvider, setPayoutProvider] = useState('mtn_momo');
    const [payoutPhone, setPayoutPhone] = useState('');
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchEarnings();
        fetchPayouts();
        fetchProviders();
    }, []);

    const fetchEarnings = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/payout/earnings`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setEarnings(res.data);
        } catch (err) {
            console.error('Error fetching earnings:', err);
        }
    };

    const fetchPayouts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/payout/history`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPayouts(res.data);
        } catch (err) {
            console.error('Error fetching payouts:', err);
        }
    };

    const fetchProviders = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/payment/providers`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProviders(res.data.providers);
        } catch (err) {
            console.error('Error fetching providers:', err);
        }
    };

    const handleRequestPayout = async (e) => {
        e.preventDefault();
        if (!payoutAmount || !payoutPhone) {
            setMessage('Amount and phone number required');
            return;
        }
        if (parseFloat(payoutAmount) > earnings.availableForPayout) {
            setMessage('Amount exceeds available earnings');
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/payout/request`,
                { amount: payoutAmount, provider: payoutProvider, phoneNumber: payoutPhone },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage(res.data.message);
            setPayoutAmount('');
            setPayoutPhone('');
            fetchEarnings();
            fetchPayouts();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Payout request failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">💰 Driver Earnings</h1>
                        <p className="text-gray-600">Track your rides and request payouts</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        earnings.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                        {earnings.status === 'active' ? '🟢 Online' : '⚪ Offline'}
                    </div>
                </div>

                {message && (
                    <div className="mb-6 px-4 py-3 rounded bg-blue-100 text-blue-700 text-sm font-medium">
                        {message}
                    </div>
                )}

                {/* Earnings Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Total Earnings</div>
                        <div className="text-3xl font-bold text-gray-900">{formatFare(earnings.totalEarnings)}</div>
                        <div className="text-sm text-gray-500 mt-2">All time</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Available for Payout</div>
                        <div className="text-3xl font-bold text-emerald-600">{formatFare(earnings.availableForPayout)}</div>
                        <div className="text-sm text-gray-500 mt-2">Ready to withdraw</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Completed Rides</div>
                        <div className="text-3xl font-bold text-gray-900">{earnings.completedRides}</div>
                        <div className="text-sm text-gray-500 mt-2">of {earnings.totalRides} total</div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm md:col-span-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Driver Rating</div>
                                <div className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                                    {earnings.rating} <span className="text-yellow-500">★</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-semibold text-gray-500 uppercase">Total Paid Out</div>
                                <div className="text-xl font-bold text-gray-900">{formatFare(earnings.totalPaidOut)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Request Payout */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">💸 Request Payout</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Withdraw your earnings to Mobile Money. Minimum payout: GH₵1. Fee: 1% (min GH₵1).
                        </p>
                        <form onSubmit={handleRequestPayout} className="space-y-4">
                            <InputField
                                label="Amount (GH₵)"
                                type="number"
                                value={payoutAmount}
                                onChange={(e) => setPayoutAmount(e.target.value)}
                                placeholder="e.g. 100"
                                max={earnings.availableForPayout}
                            />
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Provider</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {providers.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setPayoutProvider(p.id)}
                                            className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                                                payoutProvider === p.id
                                                    ? 'bg-green-50 border-green-300 text-green-700'
                                                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                                            }`}
                                        >
                                            {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <InputField
                                label="Mobile Money Number"
                                type="tel"
                                value={payoutPhone}
                                onChange={(e) => setPayoutPhone(e.target.value)}
                                placeholder="024XXXXXXXX"
                            />
                            <div className="text-xs text-gray-500">
                                You will receive: {formatFare(
                                    payoutAmount
                                        ? Math.round((parseFloat(payoutAmount) - Math.max(1, parseFloat(payoutAmount) * 0.01) * 100) / 100)
                                        : 0
                                )} after 1% fee
                            </div>
                            <CustomButton
                                title="Request Payout"
                                loading={loading}
                                disabled={
                                    loading ||
                                    !payoutAmount ||
                                    !payoutPhone ||
                                    parseFloat(payoutAmount) > earnings.availableForPayout ||
                                    parseFloat(payoutAmount) < 1
                                }
                            />
                        </form>
                    </div>

                    {/* Payout History */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Payout History</h3>
                        {payouts.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <div className="text-gray-300 text-2xl mb-2">💳</div>
                                <p>No payouts yet</p>
                                <p className="text-xs text-gray-400 mt-2">Request your first payout above</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {payouts.map((p) => (
                                    <div
                                        key={p._id}
                                        className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                    p.status === 'completed'
                                                        ? 'bg-green-100 text-green-600'
                                                        : p.status === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-600'
                                                        : 'bg-red-100 text-red-600'
                                                }`}
                                            >
                                                {p.status === 'completed' ? '✅' : p.status === 'pending' ? '⏳' : '✒'}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    Payout #{p._id.slice(-6)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {p.provider} · {new Date(p.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div
                                                className={`font-bold ${
                                                    p.status === 'completed' ? 'text-green-600' : 'text-red-600'
                                                }`}
                                            >
                                                -{formatFare(p.amount)}
                                            </div>
                                            <div className="text-xs text-gray-500 capitalize">{p.status}</div>
                                            {p.fee && (
                                                <div className="text-xs text-gray-500">Fee: {formatFare(p.fee)}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverEarnings;
