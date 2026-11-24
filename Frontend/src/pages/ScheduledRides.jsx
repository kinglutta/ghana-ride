/** ScheduledRides — rider view of booked future trips. */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import RoleShell from '../components/ui/RoleShell';
import useApiResource from '../hooks/useApiResource';
import { ActionButton, EmptyState, Panel, Pill, SectionTitle } from '../components/ui/AppKit';
import { formatFare } from '../lib/mapUtils';
import { getToken } from '../lib/authToken';

const NAV = [
    { path: '/rider', label: 'Overview', icon: '⌂' },
    { path: '/scheduled-rides/book', label: 'Book', icon: '➕' },
    { path: '/scheduled-rides/my-rides', label: 'My Rides', icon: '📅', end: true },
    { path: '/home', label: 'Ride Now', icon: '📍' },
    { path: '/notifications', label: 'Alerts', icon: '🔔' },
];

const ScheduledRides = () => {
    const { data: rides, loading, error, refresh } = useApiResource('/scheduled-rides/my-rides');
    const [cancelling, setCancelling] = useState('');
    const [notice, setNotice] = useState('');

    const cancel = async (id) => {
        setCancelling(id);
        setNotice('');
        try {
            const token = getToken();
            await axios.post(
                `${import.meta.env.VITE_API_URL}/scheduled-rides/${id}/cancel`,
                { reason: 'Cancelled by rider' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNotice('Scheduled ride cancelled.');
            await refresh();
        } catch (err) {
            setNotice(err.response?.data?.message || 'Could not cancel this ride.');
        } finally {
            setCancelling('');
        }
    };

    return (
        <RoleShell title='My Scheduled Rides' role='RIDER APP' items={NAV} logoutPath='/users/logout'>
            <SectionTitle
                title='Scheduled rides'
                subtitle='Your upcoming YENKO bookings'
                action={
                    <Link to='/scheduled-rides/book' className='text-xs font-bold text-ink underline decoration-yenko decoration-2 underline-offset-4'>
                        Book another
                    </Link>
                }
            />

            {notice && <div className='mb-4 rounded-xl bg-yenko/15 px-4 py-3 text-sm font-semibold text-ink'>{notice}</div>}

            <Panel>
                {loading && <p className='py-12 text-center text-sm text-gray-400'>Loading your schedule…</p>}
                {!loading && error && (
                    <div className='py-8 text-center'>
                        <p className='text-sm text-rose-600'>{error}</p>
                        <ActionButton className='mt-4' onClick={refresh}>Retry</ActionButton>
                    </div>
                )}
                {!loading && !error && rides?.length === 0 && (
                    <EmptyState icon='📅' title='Nothing scheduled' description='Book a ride for later and it will appear here.' />
                )}

                <div className='divide-y divide-gray-100'>
                    {(rides || []).map((ride) => (
                        <div key={ride._id} className='flex flex-wrap items-center gap-4 py-5 first:pt-0 last:pb-0'>
                            <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-yenko/15 text-xl'>📆</div>
                            <div className='min-w-[200px] flex-1'>
                                <p className='font-bold text-ink'>{ride.pickup} → {ride.destination}</p>
                                <p className='mt-1 text-xs text-gray-500'>{new Date(ride.scheduledAt).toLocaleString()}</p>
                            </div>
                            <p className='text-lg font-black text-ink'>{formatFare(ride.fare)}</p>
                            <Pill tone={ride.status === 'cancelled' ? 'red' : 'green'}>{ride.status}</Pill>
                            {ride.status === 'scheduled' && (
                                <button
                                    type='button'
                                    onClick={() => cancel(ride._id)}
                                    disabled={cancelling === ride._id}
                                    className='rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50'
                                >
                                    {cancelling === ride._id ? 'Cancelling…' : 'Cancel'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </Panel>
        </RoleShell>
    );
};

export default ScheduledRides;
