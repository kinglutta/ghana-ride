/**
 * AdminDashboard — YENKO fleet command centre.
 * Live operations, verification queues, analytics and a captain fleet map.
 * Backed only by the project's free Node/MongoDB API and OpenStreetMap.
 */
import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import RoleShell from '../components/ui/RoleShell';
import AdminFleetMap from '../components/AdminFleetMap';
import {
    ActionButton,
    Avatar,
    EmptyState,
    LiveDot,
    Panel,
    Pill,
    Progress,
    SectionTitle,
    Skeleton,
    Sparkline,
    StatCard,
} from '../components/ui/AppKit';
import { formatFare } from '../lib/mapUtils';

const NAV = [
    { path: '/admin', label: 'Overview', icon: '⌂', end: true },
    { path: '/disputes', label: 'Disputes', icon: '🤝' },
    { path: '/notifications', label: 'Alerts', icon: '🔔' },
    { path: '/payment', label: 'Payments', icon: '💳' },
];

const ENDPOINTS = {
    stats: '/admin/stats',
    operations: '/admin/operations',
    overview: '/admin/analytics/overview',
    daily: '/admin/analytics/daily-rides?days=14',
    vehicles: '/admin/analytics/revenue-by-vehicle',
    locations: '/admin/captains/locations',
    rides: '/admin/rides/recent',
};

const authHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const settled = (result, fallback) => (result.status === 'fulfilled' ? result.data : fallback);

const QueueCard = ({ title, icon, items, empty, render, actionLabel, onAction }) => (
    <Panel>
        <div className='mb-3 flex items-center justify-between'>
            <p className='text-sm font-black text-ink'>{icon} {title}</p>
            <Pill tone={items.length ? 'yellow' : 'gray'}>{items.length}</Pill>
        </div>
        {items.length === 0 ? (
            <p className='py-4 text-center text-xs text-gray-400'>{empty}</p>
        ) : (
            <div className='yenko-scroll max-h-64 divide-y divide-gray-100 overflow-auto'>
                {items.map((item, index) => (
                    <div key={item._id || index} className='py-3 first:pt-0 last:pb-0'>
                        {render(item)}
                        {onAction && (
                            <button
                                type='button'
                                onClick={() => onAction(item)}
                                className='mt-2 rounded-lg bg-gray-100 px-3 py-1 text-[11px] font-bold text-ink hover:bg-yenko'
                            >
                                {actionLabel}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        )}
    </Panel>
);

const AdminDashboard = () => {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [notice, setNotice] = useState('');

    const load = useCallback(async () => {
        const requests = Object.entries(ENDPOINTS).map(async ([key, path]) => {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}${path}`, { headers: authHeaders() });
            return [key, response.data];
        });

        const results = await Promise.allSettled(requests);
        const next = {};
        results.forEach((result, index) => {
            const key = Object.keys(ENDPOINTS)[index];
            next[key] = settled(result, null);
        });

        setData(next);
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const mutate = async (method, path, body) => {
        setNotice('');
        try {
            await axios({
                method,
                url: `${import.meta.env.VITE_API_URL}${path}`,
                data: body,
                headers: authHeaders(),
            });
            setNotice('Updated successfully.');
            await load();
        } catch (err) {
            setNotice(err.response?.data?.message || 'Could not update this item.');
        }
    };

    const stats = data.stats || {};
    const overview = data.overview || {};
    const operations = data.operations || { counts: {}, queues: {} };
    const queues = operations.queues || {};
    const daily = Array.isArray(data.daily) ? data.daily : [];
    const vehicles = Array.isArray(data.vehicles) ? data.vehicles : [];
    const captains = Array.isArray(data.locations) ? data.locations : [];
    const rides = Array.isArray(data.rides) ? data.rides : [];
    const trend = daily.map((day) => day.count || 0);
    const maxDaily = Math.max(...trend, 1);

    return (
        <RoleShell title='Fleet Command Centre' role='ADMIN APP' items={NAV} logoutPath='/users/logout'>
            <section className='yenko-panel-dark mb-6 flex flex-wrap items-center justify-between gap-4 p-6'>
                <div>
                    <div className='flex items-center gap-3'>
                        <Pill tone='yellow'>YENKO OPERATIONS</Pill>
                        <LiveDot active />
                    </div>
                    <h2 className='mt-3 text-3xl font-black tracking-tight'>Good day, Admin</h2>
                    <p className='mt-1 text-sm text-white/60'>
                        Live fleet health, verification queues and safety alerts — one screen.
                    </p>
                </div>
                <ActionButton tone='bg-white' onClick={load} loading={loading}>Refresh data</ActionButton>
            </section>

            {notice && (
                <div className='mb-5 rounded-xl border border-yenko bg-yenko/15 px-4 py-3 text-sm font-semibold text-ink'>
                    {notice}
                </div>
            )}

            <div className='mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                <StatCard icon='🚗' label='Active rides' value={operations.counts?.activeRides ?? 0} loading={loading} />
                <StatCard icon='🛎️' label='Pending requests' value={operations.counts?.pendingRides ?? 0} tone='blue' loading={loading} />
                <StatCard icon='🧑‍✈️' label='Captains online' value={operations.counts?.activeCaptains ?? 0} tone='green' loading={loading} />
                <StatCard icon='🚨' label='Active SOS' value={operations.counts?.activeSos ?? 0} tone='red' loading={loading} />
            </div>

            <div className='mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                <StatCard icon='🧾' label='Total rides' value={stats.totalRides ?? 0} loading={loading} />
                <StatCard icon='✅' label='Completed' value={stats.completedRides ?? 0} tone='green' loading={loading} />
                <StatCard icon='💰' label='Gross earnings' value={formatFare(stats.totalEarnings || 0)} loading={loading} />
                <StatCard icon='📈' label='Platform share (20%)' value={formatFare(overview.platformRevenue || 0)} tone='blue' loading={loading} />
            </div>

            <div className='mb-6 grid gap-6 lg:grid-cols-3'>
                <div className='lg:col-span-2'>
                    <SectionTitle title='Live fleet map' subtitle='Captains sharing their location right now' />
                    {loading ? <Skeleton className='h-72' /> : <AdminFleetMap captains={captains} />}
                    <p className='mt-2 text-[11px] text-gray-400'>
                        {captains.length} captain{captains.length === 1 ? '' : 's'} visible · OpenStreetMap tiles
                    </p>
                </div>
                <div>
                    <SectionTitle title='Ride demand' subtitle='Completed rides per day (14 days)' />
                    <Panel>
                        <Sparkline data={trend} className='h-16 w-full' />
                        <div className='yenko-scroll mt-4 flex h-24 gap-2 overflow-x-auto pb-2'>
                            {daily.map((day) => (
                                <div key={day._id} className='flex w-10 shrink-0 flex-col items-center justify-end gap-1'>
                                    <span className='text-[10px] font-bold text-ink'>{day.count}</span>
                                    <div
                                        className='w-6 rounded-t-lg bg-yenko'
                                        style={{ height: `${Math.max(6, (day.count / maxDaily) * 72)}px` }}
                                    />
                                    <span className='text-[9px] text-gray-400'>{day._id.slice(5)}</span>
                                </div>
                            ))}
                            {daily.length === 0 && <p className='m-auto text-xs text-gray-400'>No ride data yet.</p>}
                        </div>
                    </Panel>
                </div>
            </div>

            <SectionTitle title='Action queues' subtitle='Items that need an admin decision' />
            <div className='mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
                <QueueCard
                    title='Safety alerts'
                    icon='🚨'
                    items={queues.activeSos || []}
                    empty='No active SOS alerts'
                    actionLabel='Resolve'
                    onAction={(alert) => mutate('PATCH', `/safety/alerts/${alert._id}/resolve`)}
                    render={(alert) => (
                        <>
                            <p className='text-sm font-bold text-ink'>{alert.user?.fullname?.firstname || 'Rider'} · SOS</p>
                            <p className='truncate text-xs text-gray-500'>
                                {alert.location?.ltd?.toFixed(4)}, {alert.location?.lng?.toFixed(4)}
                            </p>
                        </>
                    )}
                />
                <QueueCard
                    title='Verifications'
                    icon='🪪'
                    items={queues.pendingVerification || []}
                    empty='No pending documents'
                    actionLabel='Approve'
                    onAction={(item) => mutate('PATCH', `/driver-verification/${item._id}/review`, { status: 'approved' })}
                    render={(item) => (
                        <>
                            <p className='text-sm font-bold text-ink'>
                                {item.captain?.fullname?.firstname || 'Captain'} · {item.documents?.length || 0} docs
                            </p>
                            <p className='text-xs text-gray-500'>{item.captain?.vehicle?.plate || 'No plate'}</p>
                        </>
                    )}
                />
                <QueueCard
                    title='Payouts'
                    icon='💸'
                    items={queues.pendingPayouts || []}
                    empty='No pending payouts'
                    actionLabel='Mark completed'
                    onAction={(item) => mutate('PATCH', `/payout/${item._id}/process`, { status: 'completed' })}
                    render={(item) => (
                        <>
                            <p className='text-sm font-bold text-ink'>
                                {item.captain?.fullname?.firstname || 'Captain'} · {formatFare(item.amount)}
                            </p>
                            <p className='text-xs text-gray-500'>{item.provider}</p>
                        </>
                    )}
                />
                <QueueCard
                    title='Disputes'
                    icon='🤝'
                    items={queues.openDisputes || []}
                    empty='No open disputes'
                    actionLabel='No action'
                    onAction={(item) => mutate('PATCH', `/disputes/${item._id}/resolve`, { resolution: 'no_action' })}
                    render={(item) => (
                        <>
                            <p className='text-sm font-bold text-ink'>{item.reason?.replaceAll('_', ' ')}</p>
                            <p className='truncate text-xs text-gray-500'>{item.ride?.pickup || 'Ride'} → {item.ride?.destination || 'Destination'}</p>
                        </>
                    )}
                />
            </div>

            <div className='grid gap-6 lg:grid-cols-3'>
                <div className='lg:col-span-2'>
                    <SectionTitle title='Recent rides' subtitle='Latest platform activity' />
                    <Panel>
                        {rides.length === 0 ? (
                            <EmptyState icon='🧾' title='No recent rides' description='Completed trips will appear here.' />
                        ) : (
                            <div className='yenko-scroll overflow-x-auto'>
                                <table className='w-full min-w-[560px] text-left text-sm'>
                                    <thead className='text-[10px] uppercase tracking-wider text-gray-400'>
                                        <tr>
                                            <th className='pb-3'>Rider</th>
                                            <th className='pb-3'>Trip</th>
                                            <th className='pb-3'>Fare</th>
                                            <th className='pb-3'>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className='divide-y divide-gray-100'>
                                        {rides.slice(0, 8).map((ride) => (
                                            <tr key={ride._id}>
                                                <td className='py-3'>
                                                    <div className='flex items-center gap-2'>
                                                        <Avatar name={ride.user?.fullname?.firstname || 'Rider'} size='sm' />
                                                        <span className='font-semibold text-ink'>
                                                            {ride.user?.fullname?.firstname || 'Rider'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className='max-w-[220px] truncate py-3 text-gray-500'>
                                                    {ride.pickup} → {ride.destination}
                                                </td>
                                                <td className='py-3 font-bold text-ink'>{formatFare(ride.fare)}</td>
                                                <td className='py-3'><Pill tone={ride.status === 'completed' ? 'green' : 'yellow'}>{ride.status}</Pill></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Panel>
                </div>

                <div>
                    <SectionTitle title='Revenue by vehicle' subtitle='Where demand is strongest' />
                    <Panel>
                        {vehicles.length === 0 ? (
                            <EmptyState icon='📊' title='No revenue yet' description='Paid rides will populate this chart.' />
                        ) : (
                            <div className='space-y-4'>
                                {vehicles.map((item) => (
                                    <div key={item._id}>
                                        <div className='mb-1 flex justify-between text-xs'>
                                            <span className='font-bold capitalize text-ink'>{item._id}</span>
                                            <span className='font-bold text-ink'>{formatFare(item.revenue || 0)}</span>
                                        </div>
                                        <Progress
                                            value={(item.revenue / Math.max(...vehicles.map((v) => v.revenue || 0), 1)) * 100}
                                        />
                                        <p className='mt-1 text-[10px] text-gray-400'>{item.rides} completed rides</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Link to='/disputes' className='mt-6 block text-center text-xs font-bold text-ink underline decoration-yenko decoration-2 underline-offset-4'>
                            Open dispute desk
                        </Link>
                    </Panel>
                </div>
            </div>
        </RoleShell>
    );
};

export default AdminDashboard;
