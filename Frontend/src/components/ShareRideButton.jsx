/**
 * ShareRideButton — creates an expiring, revocable live link for a ride.
 * The link opens a privacy-filtered public page powered by OpenStreetMap.
 */
import React, { useState } from 'react';
import axios from 'axios';
import { getToken } from '../lib/authToken';

const ShareRideButton = ({ ride, role = 'rider', emergency = false, className = '' }) => {
    const [open, setOpen] = useState(false);
    const [link, setLink] = useState('');
    const [expiresAt, setExpiresAt] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const createLink = async () => {
        if (!ride?._id) return;
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/trip/share`,
                {
                    rideId: ride._id,
                    label: emergency ? 'sos' : 'trip',
                    minutes: emergency ? 60 : 30,
                },
                { headers: { Authorization: `Bearer ${getToken(role)}` } }
            );
            setLink(res.data.url);
            setExpiresAt(res.data.expiresAt);
            setOpen(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not create a live link.');
            setOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
        } catch {
            setError('Copy failed — select the link and copy it manually.');
        }
    };

    const revoke = async () => {
        const token = link.split('/').pop();
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/trip/${token}`, {
                headers: { Authorization: `Bearer ${getToken(role)}` },
            });
            setOpen(false);
            setLink('');
            setCopied(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Could not revoke the link.');
        }
    };

    return (
        <>
            <button
                type='button'
                onClick={createLink}
                disabled={loading || !ride?._id}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    emergency
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-[#111] text-white hover:bg-gray-800'
                } ${className}`}
            >
                {loading ? 'Preparing…' : emergency ? '📍 Share emergency location' : '🔗 Share live trip'}
            </button>

            {open && (
                <div className='fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4'>
                    <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'>
                        <div className='flex items-start justify-between gap-3'>
                            <div>
                                <h3 className='text-xl font-black text-[#111]'>
                                    {emergency ? 'Emergency location link' : 'Live trip link'}
                                </h3>
                                <p className='mt-1 text-xs text-gray-500'>
                                    Anyone with this link can follow this ride — no sign-in needed.
                                </p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setOpen(false)}
                                className='text-gray-400 hover:text-gray-700'
                                aria-label='Close'
                            >
                                ✕
                            </button>
                        </div>

                        {error && (
                            <p className='mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700'>{error}</p>
                        )}

                        {link ? (
                            <>
                                <div className='mt-5'>
                                    <label className='text-[10px] font-bold uppercase tracking-widest text-gray-400' htmlFor='trip-share-link'>
                                        Share this link
                                    </label>
                                    <input
                                        id='trip-share-link'
                                        readOnly
                                        value={link}
                                        onFocus={(event) => event.target.select()}
                                        className='mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-[#111] outline-none'
                                    />
                                </div>

                                <div className='mt-3 flex gap-2'>
                                    <button
                                        type='button'
                                        onClick={copy}
                                        className='flex-1 rounded-xl bg-[#f5c400] px-3 py-2 text-xs font-bold text-[#111] hover:bg-[#e5b600]'
                                    >
                                        {copied ? '✓ Copied' : 'Copy link'}
                                    </button>
                                    {typeof navigator !== 'undefined' && navigator.share && (
                                        <button
                                            type='button'
                                            onClick={() => navigator.share({ title: 'YENKO live trip', url: link })}
                                            className='flex-1 rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-[#111] hover:bg-gray-200'
                                        >
                                            Share
                                        </button>
                                    )}
                                </div>

                                <div className='mt-4 rounded-xl bg-[#fffdf2] px-3 py-2 text-[11px] text-[#8a6d00]'>
                                    {emergency
                                        ? 'Send this to a trusted contact or emergency service. It expires automatically.'
                                        : `Expires ${expiresAt ? new Date(expiresAt).toLocaleString() : 'soon'}. You can revoke it any time.`}
                                </div>

                                <button
                                    type='button'
                                    onClick={revoke}
                                    className='mt-4 text-xs font-bold text-red-600 underline decoration-red-200 underline-offset-4'
                                >
                                    Revoke this link
                                </button>
                            </>
                        ) : (
                            <button
                                type='button'
                                onClick={createLink}
                                className='mt-5 w-full rounded-xl bg-[#111] px-3 py-2 text-xs font-bold text-white'
                            >
                                Try again
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default ShareRideButton;
