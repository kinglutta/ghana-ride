/**
 * RiderApp — the rider's home base.
 * Book, track, pay, stay safe and manage scheduled rides from one branded screen.
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RoleShell from '../components/ui/RoleShell';
import useApiResource from '../hooks/useApiResource';
import { ActionButton, Avatar, EmptyState, Panel, Pill, SectionTitle, StatCard } from '../components/ui/AppKit';
import { formatFare, formatTime } from '../lib/mapUtils';

const NAV = [
    { path: '/rider', label: 'Overview', icon: '⌂', end: true },
    { path: '/home', label: 'Book a Ride', icon: '📍' },
    { path: '/ride-history', label: 'My Rides', icon: '🧾' },
    { path: '/payment', label: 'Payments', icon: '💳' },
    { path: '/safety', label: 'Safety', icon: '🛡️' },
    { path: '/scheduled-rides/book', label: 'Schedule', icon: '📅' },
    { path: '/referrals', label: 'Refer & Earn', icon: '🎁' },
    { path: '/notifications', label: 'Notifications', icon: '🔔' },
];

const QUICK_ACTIONS = [
    { path: '/home', icon: '🚗', title: 'Ride now', hint: 'YenkoGo, Bike or Auto' },
    { path: '/scheduled-rides/book', icon: '📅', title: 'Schedule', hint: 'Book for later' },
    { path: '/payment', icon: '💳', title: 'Wallet', hint: 'Top up & pay' },
    { path: '/safety', icon: '🛡️', title: 'Safety', hint: 'SOS & contacts' },
];

const RiderApp = () => {
    const navigate = useNavigate();
    const { data: rides, loading: ridesLoading } = useApiResource('/rides/history');
    const { data: wallet } = useApiResource('/payment/wallet');

    const completed = (rides || []).filter((ride) => ride.status === 'completed');
    const recent = completed.slice(0, 3);
    const balance = wallet?.balance ?? 0;

    return (
        <RoleShell title='Rider Overview' role='RIDER APP' items={NAV} logoutPath='/users/logout'>
            <section className='yenko-panel-dark relative mb-6 overflow-hidden p-6 md:p-8'>
                <div className='relative z-10 max-w-2xl'>
                    <Pill tone='yellow'>YENKO RIDER</Pill>
                    <h2 className='mt-4 text-3xl font-black tracking-tight md:text-4xl'>
                        Where to next, Ghana?
                    </h2>
                    <p className='mt-2 max-w-lg text-sm text-white/70'>
                        Fair fares, verified Captains and safety tools in one place.
                        Built on free OpenStreetMap routing.
                    </p>
                    <ActionButton className='mt-6' onClick={() => navigate('/home')}>
                        Find a ride →
                    </ActionButton>
                </div>
                <div className='pointer-events-none absolute -right-8 -top-10 text-[180px] opacity-10'>🚗</div>
            </section>

            <div className='mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                <StatCard icon='🧾' label='Completed rides' value={ridesLoading ? '—' : completed.length} loading={ridesLoading} />
                <StatCard icon='💳' label='Wallet balance' value={formatFare(balance)} hint='GHS' tone='green' />
                <StatCard icon='🛡️' label='Safety contacts' value='Always on' tone='red' />
                <StatCard icon='🎁' label='Referral credit' value='Earn GH₵5' tone='blue' />
            </div>

            <SectionTitle title='Quick actions' subtitle='Everything you need for today’s trip' />
            <div className='mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                {QUICK_ACTIONS.map((action) => (
                    <Link key={action.path} to={action.path} className='yenko-panel group p-5 transition-transform hover:-translate-y-1'>
                        <span className='text-2xl transition-transform group-hover:scale-110'>{action.icon}</span>
                        <p className='mt-4 font-black text-ink'>{action.title}</p>
                        <p className='mt-1 text-xs text-gray-500'>{action.hint}</p>
                    </Link>
                ))}
            </div>

            <div className='grid gap-6 lg:grid-cols-3'>
                <div className='lg:col-span-2'>
                    <SectionTitle
                        title='Recent rides'
                        subtitle='Your latest YENKO trips'
                        action={<Link to='/ride-history' className='text-xs font-bold text-ink underline decoration-yenko decoration-2 underline-offset-4'>View all</Link>}
                    />
                    <Panel>
                        {ridesLoading && <p className='py-10 text-center text-sm text-gray-400'>Loading rides…</p>}
                        {!ridesLoading && recent.length === 0 && (
                            <EmptyState icon='🧭' title='No rides yet' description='Your first YENKO trip will appear here.' />
                        )}
                        <div className='divide-y divide-gray-100'>
                            {recent.map((ride) => (
                                <div key={ride._id} className='flex items-center gap-3 py-4 first:pt-0 last:pb-0'>
                                    <Avatar name={ride.captain?.fullname?.firstname || 'YENKO'} size='sm' />
                                    <div className='min-w-0 flex-1'>
                                        <p className='truncate text-sm font-bold text-ink'>{ride.pickup} → {ride.destination}</p>
                                        <p className='text-xs text-gray-500'>
                                            {formatTime(ride.duration)} · {Math.round((ride.distance || 0) / 1000)} km
                                        </p>
                                    </div>
                                    <p className='text-sm font-black text-ink'>{formatFare(ride.fare)}</p>
                                    <Link to={`/chat/${ride._id}`} className='rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold hover:bg-yenko'>
                                        Chat
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </Panel>
                </div>

                <div>
                    <SectionTitle title='Ride with confidence' subtitle='YENKO safety standard' />
                    <Panel className='bg-[#111] text-white'>
                        <p className='text-3xl'>🛡️</p>
                        <p className='mt-4 text-lg font-black'>SOS is one tap away</p>
                        <p className='mt-2 text-xs leading-relaxed text-white/60'>
                            Share your live location with emergency contacts and the YENKO operations team.
                        </p>
                        <Link
                            to='/safety'
                            className='mt-5 inline-flex rounded-xl bg-yenko px-4 py-2 text-sm font-bold text-ink'
                        >
                            Open Safety Centre
                        </Link>
                    </Panel>
                </div>
            </div>
        </RoleShell>
    );
};

export default RiderApp;
