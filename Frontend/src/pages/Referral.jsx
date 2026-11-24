/**
 * Referral — referral codes and credits
 * Invite friends, earn free ride credits
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CustomButton from '../components/ui/CustomButton';
import InputField from '../components/ui/InputField';
import { formatFare } from '../lib/mapUtils';

const Referral = () => {
    const [referralCode, setReferralCode] = useState('');
    const [shareLink, setShareLink] = useState('');
    const [referrals, setReferrals] = useState([]);
    const [credit, setCredit] = useState({ balance: 0, currency: 'GHS' });
    const [newReferralCode, setNewReferralCode] = useState('');
    [loading, setLoading] = useState(false);
    [message, setMessage] = useState('');

    useEffect(() => {
        fetchReferralCode();
        fetchReferrals();
        fetchCredit();
    }, []);

    const fetchReferralCode = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/referrals/my-code`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setReferralCode(res.data.referralCode);
            setShareLink(res.data.shareLink);
        } catch (err) {
            console.error('Error fetching referral code:', err);
        }
    };

    const fetchReferrals = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/referrals/my-referrals`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setReferrals(res.data);
        } catch (err) {
            console.error('Error fetching referrals:', err);
        }
    };

    const fetchCredit = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/referrals/my-credit`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCredit(res.data);
        } catch (err) {
            console.error('Error fetching credit:', err);
        }
    };

    const handleApplyReferral = async (e) => {
        e.preventDefault();
        if (!newReferralCode) {
            setMessage('Please enter a referral code');
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/referrals/apply-code`,
                { code: newReferralCode },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage(res.data.message);
            setNewReferralCode('');
            // Credit will be applied on first ride
        } catch (err) {
            setMessage(err.response?.data?.message || 'Invalid referral code');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyShareLink = () => {
        navigator.clipboard.writeText(shareLink);
        setMessage('Share link copied to clipboard!');
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">🎁 Refer & Earn</h1>
                        <p className="text-gray-600">Invite friends and get GH₵5 credit per referral</p>
                    </div>
                    {message && (
                        <div className="px-4 py-2 rounded bg-green-100 text-green-700 text-sm font-medium">
                            {message}
                        </div>
                    )}
                </div>

                {/* Credit Balance */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-2xl p-6 mb-8 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm uppercase tracking-wider">Referral Credit</p>
                            <h2 className="text-4xl font-bold">{formatFare(credit.balance)}</h2>
                            <p className="text-green-200 text-sm">{credit.currency}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-green-200 uppercase">Available</div>
                            <div className="text-lg font-semibold">{formatFare(credit.balance)}</div>
                        </div>
                    </div>
                    <p className="mt-4 text-green-100 text-sm">
                        Apply your credit at checkout to save on your next ride
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Your Referral Code */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">🔗 Your Referral Code</h3>
                        <div className="flex gap-2 mb-6">
                            <input
                                type="text"
                                value={referralCode}
                                readOnly
                                className="flex-1 px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-lg font-mono font-bold text-gray-900"
                            />
                            <button
                                onClick={handleCopyShareLink}
                                className="px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
                                title="Copy link"
                            >
                                📋
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Share your link with friends:
                        </p>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm break-all text-gray-700 mb-4">
                            {shareLink}
                        </div>
                        <CustomButton title="Share Link" onClick={handleCopyShareLink} />
                    </div>

                    {/* Apply Referral Code */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">🎟️ Apply Referral Code</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Got a referral code from a friend? Enter it here to get GH₵5 credit on your first ride.
                        </p>
                        <form onSubmit={handleApplyReferral} className="space-y-3">
                            <InputField
                                label="Referral Code"
                                value={newReferralCode}
                                onChange={(e) => setNewReferralCode(e.target.value)}
                                placeholder="e.g. YENKOABC"
                            />
                            <CustomButton
                                title="Apply Code"
                                loading={loading}
                                disabled={loading || !newReferralCode}
                            />
                        </form>
                    </div>

                    {/* Referral History */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Your Referrals</h3>
                        {referrals.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <div className="text-gray-300 text-2xl mb-2">👥</div>
                                <p>No referrals yet</p>
                                <p className="text-xs text-gray-400 mt-2">Share your code to start earning</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {referrals.map((ref) => (
                                    <div
                                        key={ref._id}
                                        className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                                {ref.referred?.fullname?.firstname?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {ref.referred?.fullname?.firstname} {ref.referred?.fullname?.lastname}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {ref.referred?.email}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div
                                                className={`font-bold ${
                                                    ref.status === 'completed'
                                                        ? 'text-green-600'
                                                        : ref.status === 'pending'
                                                        ? 'text-yellow-600'
                                                        : 'text-red-600'
                                                }`}
                                            >
                                                {ref.status === 'completed'
                                                    ? `+${formatFare(ref.rewardAmount)}`
                                                    : ref.status}
                                            </div>
                                            <div className="text-xs text-gray-500 capitalize">{ref.status}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">💡 How It Works</h3>
                    <div className="space-y-3 text-sm text-gray-600">
                        <div className="flex gap-3">
                            <span className="w-6 h-6 rounded bg-green-100 text-green-600 flex items-center justify-center">1</span>
                            <div>
                                <span className="font-medium">Share your code</span> — Send your referral link to friends
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="w-6 h-6 rounded bg-green-100 text-green-600 flex items-center justify-center">2</span>
                            <div>
                                <span className="font-medium">Friend signs up</span> — They use your code during registration
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="w-6 h-6 rounded bg-green-100 text-green-600 flex items-center justify-center">3</span>
                            <div>
                                <span className="font-medium">First ride completed</span> — You both get GH₵5 credit
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Referral;
