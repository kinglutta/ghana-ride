/** RateRideModal — post-ride rating using the existing /rides/rate endpoint. */
import React, { useState } from 'react';
import axios from 'axios';
import { ActionButton, Panel } from './ui/AppKit';

const RateRideModal = ({ rideId, captainName = 'your YENKO Captain', onClose, onRated }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const submit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${import.meta.env.VITE_API_URL}/rides/rate`,
                { rideId, rating, comment },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onRated?.();
            onClose?.();
        } catch (err) {
            setError(err.response?.data?.message || 'Could not submit your rating');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4'>
            <Panel className='w-full max-w-md'>
                <form onSubmit={submit}>
                    <div className='flex items-start justify-between'>
                        <div>
                            <p className='text-[10px] font-black uppercase tracking-[0.2em] text-yenko'>
                                YENKO Feedback
                            </p>
                            <h2 className='mt-1 text-xl font-black text-ink'>Rate your ride</h2>
                            <p className='mt-1 text-xs text-gray-500'>How was {captainName}?</p>
                        </div>
                        <button type='button' onClick={onClose} className='text-xl text-gray-400 hover:text-ink' aria-label='Close'>
                            ✕
                        </button>
                    </div>

                    <div className='mt-6 flex justify-center gap-2'>
                        {[1, 2, 3, 4, 5].map((score) => (
                            <button
                                key={score}
                                type='button'
                                onClick={() => setRating(score)}
                                className={`text-4xl transition-transform hover:scale-110 ${score <= rating ? 'text-yenko' : 'text-gray-200'}`}
                                aria-label={`${score} star${score > 1 ? 's' : ''}`}
                            >
                                ★
                            </button>
                        ))}
                    </div>

                    <textarea
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        placeholder='Tell us more (optional)'
                        rows={3}
                        maxLength={500}
                        className='mt-5 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-yenko'
                    />

                    {error && <p className='mt-3 text-xs font-semibold text-rose-600'>{error}</p>}

                    <div className='mt-5 flex gap-3'>
                        <ActionButton type='submit' loading={loading} className='flex-1'>
                            Submit rating
                        </ActionButton>
                        <button
                            type='button'
                            onClick={onClose}
                            className='rounded-xl bg-gray-100 px-4 text-sm font-bold text-gray-600 hover:bg-gray-200'
                        >
                            Later
                        </button>
                    </div>
                </form>
            </Panel>
        </div>
    );
};

export default RateRideModal;
