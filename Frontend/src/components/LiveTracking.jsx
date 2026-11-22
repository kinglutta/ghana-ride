import React, { useState, useEffect, useContext } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import axios from 'axios'
import MapFallback from './MapFallback'
import { SocketContext } from '../context/SocketContext'

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
                position={[currentPosition.lat, currentPosition.lng]}
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
    const [loadError, setLoadError] = useState(null);
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
                const token = localStorage.getItem('token');
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

    if (loadError) {
        return <MapFallback error={loadError} />;
    }

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
        </MapContainer>
    );
};

export default LiveTracking
