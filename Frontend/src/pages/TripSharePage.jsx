/**
 * TripSharePage — public, read-only live ride view for a trusted contact.
 * No sign-in, no rider details, no payment data. Auto-refreshes from the API.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Brand } from '../components/ui/YenkoShell';
import { formatFare } from '../lib/mapUtils';
import usePageTitle from '../hooks/usePageTitle';

const DEFAULT_CENTER = [-3.745, -38.523];

const StatusBadge = ({ status }) => {
    const labels = {
        ongoing: 'On the way',
        accepted: 'Captain assigned',
        completed: 'Ride completed',
        pending: 'Finding a captain',
    };
    return (
        <span className='rounded-full bg-[#111] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#f5c400]'>
            {labels[status] || status || 'Live'}
        </span>
    );
};

const Recenter = ({ position }) => {
    const map = useMap();
    const lat = position?.[0];
    const lng = position?.[1];

    useEffect(() => {
        if (lat !== undefined && lng !== undefined) map.setView([lat, lng], 15);
    }, [map, lat, lng]);

    return null;
};

const TripSharePage = () => {
    const { token } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [updatedAt, setUpdatedAt] = useState(null);
    const deadRef = useRef(false);

    usePageTitle('Live YENKO Trip');

    useEffect(() => {
        let active = true;
        deadRef.current = false;

        const load = async (first = false) => {
            if (deadRef.current) return;
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/trip/${token}`);
                if (!active) return;
                setData(res.data);
                setUpdatedAt(new Date());
                setError('');
            } catch (err) {
                if (!active) return;
                const message = err.response?.data?.message || 'Could not load this live link.';
                setError(message);
                if (err.response?.status === 404) deadRef.current = true;
            } finally {
                if (active && first) setLoading(false);
            }
        };

        load(true);
        const timer = setInterval(() => load(false), 5000);
        return () => {
            active = false;
            clearInterval(timer);
        };
    }, [token]);

    const location = data?.captain?.location;
    const position = location && Number.isFinite(Number(location.ltd)) && Number.isFinite(Number(location.lng))
        ? [Number(location.ltd), Number(location.lng)]
        : null;

    return (
        <div className='flex min-h-screen flex-col bg-[#f6f7f8]'>
            <header className='border-b border-gray-200 bg-white'>
                <div className='mx-auto flex h-16 max-w-4xl items-center justify-between px-5'>
                    <Link to='/' aria-label='YENKO RIDE home'><Brand compact /></Link>
                    <div className='flex items-center gap-2'>
                        <span className='h-2 w-2 animate-pulse rounded-full bg-green-500' />
                        <span className='text-[10px] font-black uppercase tracking-[0.2em] text-gray-500'>Live trip</span>
                    </div>
                </div>
                <div className='h-[3px] bg-gradient-to-r from-[#f5c400] via-[#111] to-transparent' />
            </header>

            <main className='mx-auto w-full max-w-4xl flex-1 px-4 py-6'>
                {error && !data && (
                    <div className='rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-lg'>
                        <span className='text-5xl'>🔒</span>
                        <h1 className='mt-4 text-2xl font-black text-[#111]'>Link unavailable</h1>
                        <p className='mx-auto mt-2 max-w-sm text-sm text-gray-500'>{error}</p>
                        <p className='mx-auto mt-4 max-w-sm text-xs text-gray-400'>
                            Live links expire automatically and can be revoked by the person who shared them.
                        </p>
                        <Link to='/' className='mt-6 inline-block rounded-xl bg-[#f5c400] px-5 py-2 text-sm font-bold text-[#111]'>
                            Go to YENKO
                        </Link>
                    </div>
                )}

                {loading && (
                    <div className='rounded-3xl bg-white p-10 text-center shadow-lg'>
                        <span className='inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-[#f5c400]' />
                        <p className='mt-3 text-sm font-semibold text-gray-500'>Connecting to the live trip…</p>
                    </div>
                )}

                {data && (
                    <>
                        <section className='mb-5 flex flex-wrap items-center justify-between gap-3'>
                            <div>
                                <div className='flex items-center gap-3'>
                                    <h1 className='text-2xl font-black text-[#111] md:text-3xl'>
                                        {data.label === 'sos' ? 'Emergency location' : 'Follow this YENKO ride'}
                                    </h1>
                                    <StatusBadge status={data.ride.status} />
                                </div>
                                <p className='mt-1 text-sm text-gray-500'>
                                    Shared by a YENKO {data.label === 'sos' ? 'rider in need' : 'rider or captain'} ·{' '}
                                    {updatedAt ? `Updated ${updatedAt.toLocaleTimeString()}` : 'Connecting…'}
                                </p>
                            </div>
                            <div className='rounded-xl bg-white px-4 py-2 text-right shadow-sm'>
                                <p className='text-[10px] font-bold uppercase tracking-widest text-gray-400'>Link expires</p>
                                <p className='text-xs font-bold text-[#111]'>
                                    {new Date(data.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </section>

                        <section className='overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl'>
                            <div className='h-[330px] w-full bg-gray-100'>
                                <MapContainer center={position || DEFAULT_CENTER} zoom={14} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                                    />
                                    {position && (
                                        <>
                                            <Recenter position={position} />
                                            <CircleMarker
                                                center={position}
                                                radius={13}
                                                pathOptions={{ color: '#111', fillColor: '#f5c400', fillOpacity: 1, weight: 3 }}
                                            />
                                        </>
                                    )}
                                </MapContainer>
                            </div>

                            <div className='grid gap-0 md:grid-cols-3'>
                                <div className='border-b border-gray-100 p-5 md:border-b-0 md:border-r'>
                                    <p className='text-[10px] font-bold uppercase tracking-widest text-gray-400'>Captain</p>
                                    <p className='mt-1 text-lg font-black text-[#111]'>
                                        {data.captain ? `${data.captain.firstname} Captain` : 'Assigning…'}
                                    </p>
                                    <p className='mt-1 text-xs text-gray-500'>
                                        {data.captain?.vehicle
                                            ? `${data.captain.vehicle.color || ''} ${data.captain.vehicle.vehicleType || 'car'} · ${data.captain.vehicle.plate || ''}`
                                            : 'Vehicle details when assigned'}
                                    </p>
                                    {data.captain?.rating ? (
                                        <p className='mt-2 text-xs font-bold text-[#8a6d00]'>⭐ {data.captain.rating} rating</p>
                                    ) : null}
                                </div>
                                <div className='border-b border-gray-100 p-5 md:border-b-0 md:border-r'>
                                    <p className='text-[10px] font-bold uppercase tracking-widest text-gray-400'>Route</p>
                                    <p className='mt-1 truncate text-sm font-bold text-[#111]'>📍 {data.ride.pickup || 'Pickup'}</p>
                                    <p className='mt-1 truncate text-sm font-bold text-[#111]'>🏁 {data.ride.destination || 'Destination'}</p>
                                    {data.ride.distance && (
                                        <p className='mt-2 text-xs text-gray-500'>{data.ride.distance} · {data.ride.duration || '—'}</p>
                                    )}
                                </div>
                                <div className='p-5'>
                                    <p className='text-[10px] font-bold uppercase tracking-widest text-gray-400'>Fare</p>
                                    <p className='mt-1 text-xl font-black text-[#111]'>{formatFare(data.ride.fare || 0)}</p>
                                    <p className='mt-1 text-xs text-gray-500'>Fixed YENKO fare · no surge surprises</p>
                                </div>
                            </div>
                        </section>

                        <div className='mt-5 rounded-2xl border border-[#f5c400]/40 bg-[#fffdf2] px-4 py-3 text-xs leading-relaxed text-[#8a6d00]'>
                            🔒 This page shows only the ride status and live captain location. It never shows phone numbers,
                            payment details or rider identity. Location stops updating when the link expires.
                        </div>
                    </>
                )}
            </main>

            <footer className='border-t border-gray-200 bg-white px-5 py-4 text-center text-[11px] text-gray-400'>
                YENKO RIDE · Move smarter, Ghana · Powered by OpenStreetMap
            </footer>
        </div>
    );
};

export default TripSharePage;
