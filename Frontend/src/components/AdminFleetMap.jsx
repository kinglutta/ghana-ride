/**
 * AdminFleetMap — live captain positions for the YENKO command centre.
 * Uses OpenStreetMap tiles and Leaflet only; no paid map provider.
 */
import 'leaflet/dist/leaflet.css';
import React from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

const captainIcon = L.divIcon({
    className: '',
    html: '<div style="width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:999px;background:#f5c400;border:3px solid #111;box-shadow:0 4px 12px rgba(0,0,0,.25);font-size:16px">🚗</div>',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
});

const AdminFleetMap = ({ captains = [] }) => {
    const pins = captains.filter(
        (captain) => Number.isFinite(captain.location?.ltd) && Number.isFinite(captain.location?.lng)
    );
    const center = pins.length ? [pins[0].location.ltd, pins[0].location.lng] : [5.6037, -0.187];

    return (
        <div className='h-72 overflow-hidden rounded-2xl border border-gray-200'>
            <MapContainer center={center} zoom={11} scrollWheelZoom={false} className='h-full w-full'>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                />
                {pins.map((captain) => (
                    <Marker
                        key={captain._id}
                        position={[captain.location.ltd, captain.location.lng]}
                        icon={captainIcon}
                    >
                        <Popup>
                            <strong className='capitalize'>
                                {captain.fullname?.firstname || 'Captain'} {captain.fullname?.lastname || ''}
                            </strong>
                            <br />
                            {captain.vehicle?.plate || 'No plate'} · {captain.vehicle?.vehicleType || 'car'}
                            <br />
                            ⭐ {captain.rating || 5} · {captain.isVerified ? 'Verified' : 'Unverified'}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default AdminFleetMap;
