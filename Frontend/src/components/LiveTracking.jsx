import React, { useState, useEffect, useContext } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import axios from 'axios'
import MapFallback from './MapFallback'
import { SocketContext } from '../context/socket.context'
import { getToken } from '../lib/authToken';

const containerStyle = {
    width: '100%',
    height: '100%',
};

const center = {
    lat: -3.745,
    lng: -38.523
};

// Inner component rendered inside MapContainer so we can use the useMap hook
const TrackingMap = ({ currentPosition, captainPosition, showCaptain, routeCoordinates }) => {
    const map = useMap();

    // Keep the map centered on the user / captain position
    useEffect(() => {
        if (!map) return;
        map.setView([currentPosition.lat, currentPosition.lng], 15);
    }, [currentPosition, map]);

    useEffect(() => {
        if (map && showCaptain && captainPosition) {
            map.setView([captainPosition.lat, captainPosition.lng], 15);
        }
    }, [captainPosition, showCaptain, map]);

    return (
        <>
            {/* Route between pickup and destination */}
            {routeCoordinates && (
                <Polyline
                    positions={routeCoordinates}
                    lineCap="round"
                    lineJoin="round"
                    pathOptions={{
                        color: '#3b82f6',
                        weight: 5,
                        opacity: 0.8
                    }}
                />
            )}

            {/* User location marker */}
            <CircleMarker
                center={[currentPosition.lat, currentPosition.lng]}
                pathOptions={{
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.35,
                    weight: 0
                }}
                radius={8}
            >
                <Popup>Your Location</Popup>
            </CircleMarker>

            {/* Captain location marker */}
            {showCaptain && captainPosition && (
                <Marker position={[captainPosition.lat, captainPosition.lng]}>
                    <Popup>Captain Location</Popup>
                </Marker>
            )}
        </>
    );
};

const LiveTracking = ({ ride, showCaptain = false, showRoute = false }) => {
    const [currentPosition, setCurrentPosition] = useState(center);
    const [captainPosition, setCaptainPosition] = useState(null);
    const [routeCoordinates, setRouteCoordinates] = useState(null);
    const [sosActive, setSosActive] = useState(false);
    const { socket } = useContext(SocketContext);

    // Get initial position
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setCurrentPosition({
                    lat: latitude,
                    lng: longitude
                });
            },
            (error) => {
                console.error('Error getting location:', error);
            }
        );

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                console.log('📍 Position updated:', latitude, longitude);
                setCurrentPosition({
                    lat: latitude,
                    lng: longitude
                });
            },
            (error) => {
                console.error('Error watching location:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // SOS emergency handler
    const handleSOS = async () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const token = getToken();
                    const body = {
                        location: { ltd: latitude, lng: longitude },
                    };
                    if (ride) body.rideId = ride._id;
                    await axios.post(
                        `${import.meta.env.VITE_API_URL}/safety/sos`,
                        body,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setSosActive(true);
                    if (socket) {
                        socket.emit('sos-activated', {
                            location: { ltd: latitude, lng: longitude },
                            rideId: ride ? ride._id : null,
                        });
                    }
                } catch (err) {
                    console.error('SOS error:', err);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Listen for captain location updates if showing captain
    useEffect(() => {
        if (socket && showCaptain) {
            const handleCaptainLocationUpdate = (data) => {
                console.log('📍 Captain location update:', data);
                if (data.location) {
                    setCaptainPosition({
                        lat: data.location.ltd,
                        lng: data.location.lng
                    });
                }
            };

            socket.on('captain-location-update', handleCaptainLocationUpdate);

            return () => {
                socket.off('captain-location-update', handleCaptainLocationUpdate);
            };
        }
    }, [socket, showCaptain]);

    // Fetch route between pickup and destination using the free OSRM demo server
    useEffect(() => {
        const fetchRoute = async () => {
            if (!showRoute || !ride?.pickup || !ride?.destination) {
                setRouteCoordinates(null);
                return;
            }

            try {
                const token = getToken();
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                const [pickupResponse, destinationResponse] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/maps/get-coordinates`, {
                        params: { address: ride.pickup },
                        headers
                    }),
                    axios.get(`${import.meta.env.VITE_API_URL}/maps/get-coordinates`, {
                        params: { address: ride.destination },
                        headers
                    })
                ]);

                const pickupCoords = pickupResponse.data; // { ltd, lng }
                const destinationCoords = destinationResponse.data; // { ltd, lng }

                const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${pickupCoords.lng},${pickupCoords.ltd};${destinationCoords.lng},${destinationCoords.ltd}?overview=full&geometries=geojson`;

                const response = await fetch(osrmUrl);
                const data = await response.json();
                const coordinates = data?.routes?.[0]?.geometry?.coordinates;

                if (coordinates) {
                    // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
                    setRouteCoordinates(coordinates.map(coordinate => [coordinate[1], coordinate[0]]));
                } else {
                    console.error('❌ No route found');
                    setRouteCoordinates(null);
                }
            } catch (error) {
                console.error('❌ Error fetching route:', error);
                setRouteCoordinates(null);
            }
        };

        fetchRoute();
    }, [showRoute, ride]);

    if (!currentPosition || typeof currentPosition.lat !== 'number') {
        return <MapFallback loading={true} />;
    }

    return (
        <MapContainer
            center={[currentPosition.lat, currentPosition.lng]}
            zoom={15}
            style={containerStyle}
        >
            <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <TrackingMap
                currentPosition={currentPosition}
                captainPosition={captainPosition}
                showCaptain={showCaptain}
                routeCoordinates={routeCoordinates}
            />

            {/* SOS Emergency Button Overlay */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
                <button
                    onClick={handleSOS}
                    disabled={sosActive}
                    className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all transform active:scale-90 ${
                        sosActive
                            ? 'bg-red-100 text-red-700 border-2 border-red-400 animate-pulse'
                            : 'bg-red-600 hover:bg-red-700'
                    }`}
                    title="Emergency SOS"
                >
                    <span className="text-2xl">{sosActive ? '✅' : '🚨'}</span>
                </button>
                {sosActive && (
                    <div className="mt-2 text-xs text-red-600 font-medium text-center bg-red-50 px-2 py-1 rounded">
                        SOS Active — Help on the way
                    </div>
                )}
            </div>
        </MapContainer>
    );
};

export default LiveTracking
