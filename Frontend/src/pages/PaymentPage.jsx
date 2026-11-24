/**
 * PaymentPage — Mobile Money + Wallet payment hub
 * Yango-standard payment experience for Ghana market
 * 100% free — no Stripe, no paid gateways
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useContext } from 'react';
import { SocketContext } from '../context/SocketContext';
import { formatFare } from '../lib/mapUtils';
import CustomButton from '../components/ui/CustomButton';
import InputField from '../components/ui/InputField';

const PaymentPage = ({ navigate }) => {
    const [providers, setProviders] = useState([]);
    const [wallet, setWallet] = useState({ balance: 0, currency: 'GHS' });
    const [transactions, setTransactions] = useState([]);
    const [topupAmount, setTopupAmount] = useState('');
    [selectedProvider, setSelectedProvider] = useState('mtn_momo');
    const [topupPhone, setTopupPhone] = useState('');
    [rideToPay, setRideToPay] = useState(null);
    [paymentMethod, setPaymentMethod] = useState('wallet');
    [payPhone, setPayPhone] = useState('');
    [loading, setLoading] = useState(false);
    [message, setMessage] = useState('');

    const { socket } = useContext(SocketContext);

    useEffect(() => {
        fetchProviders();
        fetchWallet();
        fetchTransactions();
    }, []);

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

    const fetchWallet = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/payment/wallet`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setWallet(res.data);
        } catch (err) {
            console.error('Error fetching wallet:', err);
        }
    };

    const fetchTransactions = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/payment/transactions`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTransactions(res.data);
        } catch (err) {
            console.error('Error fetching transactions:', err);
        }
    };

    const handleTopup = async (e) => {
        e.preventDefault();
        if (!topupAmount || !topupPhone) {
            setMessage('Amount and phone number required');
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/payment/topup`,
                { amount: topupAmount, provider: selectedProvider, phoneNumber: topupPhone },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage(res.data.message);
            setTopupAmount('');
            setTopupPhone('');
            fetchWallet();
            fetchTransactions();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Top-up failed');
        } finally {
            setLoading(false);
        }
    };

    const handlePayRide = async (e) => {
        e.preventDefault();
        if (!rideToPay) {
            setMessage('No ride selected');
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const body = { rideId: rideToPay._id, method: paymentMethod };
            if (paymentMethod !== 'cash' && paymentMethod !== 'wallet') {
                body.phoneNumber = payPhone;
            }
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/payment/pay-ride`,
                body,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage(res.data.message);
            setRideToPay(null);
            setPaymentMethod('wallet');
            setPayPhone('');
            fetchWallet();
            fetchTransactions();
            // Notify via socket if payment completed
            if (socket && res.data.transaction) {
                socket.emit('ride-paid', { rideId: rideToPay._id, transaction: res.data.transaction });
            }
        } catch (err) {
            setMessage(err.response?.data?.message || 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    const selectRideToPay = (ride) => {
        setRideToPay(ride);
        setPaymentMethod('wallet');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">💳 Payment</h1>
                        <p className="text-gray-600">Wallet, Mobile Money &amp; Ride Payments</p>
                    </div>
                    {message && (
                        <div className="px-4 py-2 rounded bg-green-100 text-green-700 text-sm font-medium">
                            {message}
                        </div>
                    )}
                </div>

                {/* Wallet Balance Card */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-2xl p-6 mb-8 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm uppercase tracking-wider">Wallet Balance</p>
                            <h2 className="text-4xl font-bold">{formatFare(wallet.balance)}</h2>
                            <p className="text-green-200 text-sm">{wallet.currency}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-green-200 uppercase">Available</div>
                            <div className="text-lg font-semibold">{formatFare(wallet.balance)}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Top Up */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">📲 Top Up Wallet</h3>
                            <form onSubmit={handleTopup} className="space-y-4">
                                <InputField
                                    label="Amount (GH₵)"
                                    type="number"
                                    value={topupAmount}
                                    onChange={(e) => setTopupAmount(e.target.value)}
                                    placeholder="e.g. 50"
                                />
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Provider</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {providers.map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => setSelectedProvider(p.id)}
                                                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                                                    selectedProvider === p.id
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
                                    value={topupPhone}
                                    onChange={(e) => setTopupPhone(e.target.value)}
                                    placeholder="024XXXXXXXX"
                                />
                                <CustomButton
                                    title="Top Up Wallet"
                                    loading={loading && paymentMethod === 'wallet'}
                                    disabled={loading || !topupAmount || !topupPhone}
                                />
                            </form>
                        </div>
                    </div>

                    {/* Right: Transaction History */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Transaction History</h3>
                            {transactions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <div className="text-gray-300 text-2xl mb-2">💰</div>
                                    <p>No transactions yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {transactions.map((tx) => (
                                        <div key={tx._id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                        tx.type === 'topup'
                                                            ? 'bg-green-100 text-green-600'
                                                            : tx.type === 'ride_payment'
                                                            ? 'bg-blue-100 text-blue-600'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    {tx.type === 'topup' ? '💰' : tx.type === 'ride_payment' ? '🚗' : '🔄'}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {tx.type === 'topup' ? 'Wallet Top-up' : tx.type === 'ride_payment' ? 'Ride Payment' : tx.type}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {tx.provider} • {new Date(tx.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div
                                                    className={`font-bold ${
                                                        tx.type === 'topup' ? 'text-green-600' : 'text-red-600'
                                                    }`}
                                                >
                                                    {tx.type === 'topup' ? '+' : '-'}{formatFare(tx.amount)}
                                                </div>
                                                <div className="text-xs text-gray-500 capitalize">{tx.status}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Ride Payment Modal/Section */}
                {rideToPay && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xl mt-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">💳 Pay for Ride</h3>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-6">
                            <div>
                                <p className="text-sm text-gray-500 uppercase">Route</p>
                                <p className="font-medium text-gray-900">{rideToPay.pickup} → {rideToPay.destination}</p>
                                <p className="text-xs text-gray-500">Ride #{rideToPay._id.slice(-6)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-bold text-black">{formatFare(rideToPay.fare)}</p>
                                <p className="text-xs text-gray-500">Fare</p>
                            </div>
                        </div>
                        <form onSubmit={handlePayRide} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Payment Method</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('wallet')}
                                        className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                                            paymentMethod === 'wallet'
                                                ? 'bg-green-50 border-green-300 text-green-700'
                                                : 'bg-white border-gray-300 text-gray-600'
                                        }`}
                                    >
                                        💰 Wallet ({formatFare(wallet.balance)})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('cash')}
                                        className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                                            paymentMethod === 'cash'
                                                ? 'bg-blue-50 border-blue-300 text-blue-700'
                                                : 'bg-white border-gray-300 text-gray-600'
                                        }`}
                                    >
                                        💵 Cash
                                    </button>
                                </div>
                            </div>
                            {(paymentMethod === 'mtn_momo' || paymentMethod === 'vodafone_cash' || paymentMethod === 'airtel_tigo_money') && (
                                <InputField
                                    label="Mobile Money Number"
                                    type="tel"
                                    value={payPhone}
                                    onChange={(e) => setPayPhone(e.target.value)}
                                    placeholder="024XXXXXXXX"
                                />
                            )}
                            <CustomButton
                                title="Confirm Payment"
                                loading={loading}
                                disabled={loading || (paymentMethod !== 'cash' && !payPhone)}
                            />
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentPage;
