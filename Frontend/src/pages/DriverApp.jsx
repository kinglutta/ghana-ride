/**
 * DriverApp — the Captain's home base.
 * Go live, track earnings, check verification and see upcoming scheduled rides.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RoleShell from '../components/ui/RoleShell';
import useApiResource from '../hooks/useApiResource';
import { ActionButton, Avatar, EmptyState, Panel, Pill, SectionTitle, StatCard } from '../components/ui/AppKit';
import { formatFare } from '../lib/mapUtils';
import { getToken } from '../lib/authToken';

const NAV = [
    { path: '/captain-home', label: 'Live Map', icon: '🗺️' },
    { path: '/driver', label: 'Overview', icon: '⌂', end: true },
    { path: '/driver-earnings', label: 'Earnings', icon: '💰' },
    { path: '/driver-verification', label: 'Verification', icon: '📄' },
    { path: '/captain-riding', label: 'Current Ride', icon: '🚗' },
    { path: '/notifications', label: 'Notifications', icon: '🔔' },
];

const DriverApp = () => {
    const navigate = useNavigate();
    const [goingOnline, setGoingOnline] = useState(false);
    const [notice, setNotice] = useState('');

    const { data: profile, loading: profileLoading } = useApiResource('/captains/profile');
    const { data: earnings, loading: earningsLoading } = useApiResource('/payout/earnings');
    const { data: verification } = useApiResource('/driver-verification/me');
    const { data: upcoming } = useApiResource('/scheduled-rides/upcoming');

    const captain = profile?.captain || profile || {};
    const name = captain.fullname?.firstname || 'Captain';
    const isActive = captain.status === 'active';

    const goOnline = () => {
        setGoingOnline(true);
        setNotice('');

        if (!navigator.geolocation) {
            setNotice('Location unavailable — opening the live map instead.');
            setGoingOnline(false);
            navigate('/captain-home');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const token = getToken();
                    await axios.post(
                        `${import.meta.env.VITE_API_URL}/captains/update-location`,
                        { location: { ltd: position.coords.latitude, lng: position.coords.longitude } },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    navigate('/captain-home');
                } catch (err) {
                    setNotice(err.response?.data?.message || 'Could not go online right now.');
                    setGoingOnline(false);
                }
            },
            () => {
                setNotice('Location permission needed to go online. Opening the live map.');
                setGoingOnline(false);
                navigate('/captain-home');
            },
            { timeout: 8000 }
        );
    };

    return (
        <RoleShell title='Captain Overview' role='DRIVER APP' items={NAV} logoutPath='/captains/logout'>
            <section className='yenko-panel-dark relative mb-6 overflow-hidden p-6 md:p-8'>
                <div className='relative z-10 flex flex-wrap items-center gap-5'>
                    <Avatar name={`${name} YENKO`} size='lg' />
                    <div className='min-w-0 flex-1'>
                        <Pill tone={isActive ? 'green' : 'gray'}>{isActive ? 'ONLINE' : 'OFFLINE'}</Pill>
                        <h2 className='mt-3 text-3xl font-black tracking-tight'>
                            {profileLoading ? 'Loading Captain…' : `Star ${name}`}
                        </h2>
                        <p className='mt-1 text-sm text-white/70'>
                            {captain.vehicle?.plate || 'No vehicle'} · {captain.vehicle?.vehicleType || 'car'} · ⭐ {captain.rating || 5}
                        </p>
                    </div>
                    <ActionButton loading={goingOnline} onClick={goOnline}>
                        {isActive ? 'Open live map' : 'Go online'}
                    </ActionButton>
                </div>
                {notice && <p className='relative z-10 mt-4 text-xs text-yenko'>{notice}</p>}
                <div className='pointer-events-none absolute -right-6 -top-12 text-[180px] opacity-10'>🚙</div>
            </section>

            <div className='mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                <StatCard icon='💰' label='Total earnings' value={formatFare(earnings?.totalEarnings || 0)} loading={earningsLoading} />
                <StatCard icon='🏦' label='Available to payout' value={formatFare(earnings?.availableForPayout || 0)} tone='green' loading={earningsLoading} />
                <StatCard icon='🧾' label='Completed rides' value={earnings?.completedRides ?? 0} tone='blue' loading={earningsLoading} />
                <StatCard
                    icon='📄'
                    label='Verification'
                    value={verification?.status ? verification.status.toUpperCase() : 'PENDING'}
                    tone={verification?.status === 'approved' ? 'green' : 'yellow'}
                />
            </div>

            <div className='grid gap-6 lg:grid-cols-3'>
                <div className='lg:col-span-2'>
                    <SectionTitle
                        title='Upcoming scheduled rides'
                        subtitle='Accepted bookings waiting for pickup'
                        action={<Link to='/captain-home' className='text-xs font-bold text-ink underline decoration-yenko decoration-2 underline-offset-4'>Live map</Link>}
                    />
                    <Panel>
                        {!upcoming || upcoming.length === 0 ? (
                            <EmptyState icon='📅' title='No scheduled rides' description='New bookings will arrive here automatically.' />
                        ) : (
                            <div className='divide-y divide-gray-100'>
                                {upcoming.slice(0, 5).map((ride) => (
                                    <div key={ride._id} className='flex items-center gap-3 py-4 first:pt-0 last:pb-0'>
                                        <span className='text-xl'>⏰</span>
                                        <div className='min-w-0 flex-1'>
                                            <p className='truncate text-sm font-bold text-ink'>{ride.pickup} → {ride.destination}</p>
                                            <p className='text-xs text-gray-500'>{new Date(ride.scheduledAt).toLocaleString()}</p>
                                        </div>
                                        <Pill tone='blue'>{ride.status}</Pill>
                                        <p className='text-sm font-black text-ink'>{formatFare(ride.fare)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>
                </div>

                <div>
                    <SectionTitle title='Captain toolkit' subtitle='Everything else in one tap' />
                    <div className='space-y-3'>
                        {[
                            { path: '/driver-earnings', icon: '💸', label: 'Request a payout' },
                            { path: '/driver-verification', icon: '🪪', label: 'Verification documents' },
                            { path: '/safety', icon: '🛡️', label: 'Safety centre' },
                            { path: '/disputes', icon: '🤝', label: 'Disputes & support' },
                        ].map((item) => (
                            <Link key={item.path} to={item.path} className='yenko-panel flex items-center gap-3 p-4 hover:border-yenko'>
                                <span className='text-xl'>{item.icon}</span>
                                <span className='flex-1 text-sm font-bold text-ink'>{item.label}</span>
                                <span className='text-gray-400'>→</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </RoleShell>
    );
};

export default DriverApp;
