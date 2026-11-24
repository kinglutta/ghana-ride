
import { useEffect, useState } from 'react';
import { SocketContext } from './socket.context';
import { io } from 'socket.io-client';
import { getToken, roleForPath } from '../lib/authToken';

const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Check if API URL is configured
        if (!import.meta.env.VITE_API_URL) {
            console.error('❌ VITE_API_URL is not defined! Check your .env file.');
            return;
        }

        console.log('🔌 Initializing Socket.IO connection to:', import.meta.env.VITE_API_URL);

        // WebSocket first with polling fallback. Live ride tracking needs the
        // low latency that polling-only transport cannot provide.
        const newSocket = io(`${import.meta.env.VITE_API_URL}`, {
            transports: ['websocket', 'polling'],
            timeout: 30000,
            forceNew: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: Infinity,
            withCredentials: false,
            autoConnect: true,
        });

        // Room membership lives on the socket, so every new connection must
        // re-join or ride events are silently missed after a reconnect.
        const joinSession = () => {
            const role = roleForPath();
            const token = getToken(role);
            if (token) {
                newSocket.emit('join', { userType: role === 'rider' ? 'user' : role, token });
            }
        };

        // Connection event handlers
        newSocket.on('connect', () => {
            console.log('✅ Connected to Socket.IO server:', newSocket.id);
            setIsConnected(true);
            joinSession();
        });

        newSocket.on('disconnect', (reason) => {
            console.log('❌ Disconnected from Socket.IO server:', reason);
            setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('🔴 Socket.IO connection error:', error);
            setIsConnected(false);
        });

        newSocket.on('reconnect', (attemptNumber) => {
            console.log('🔄 Reconnected to Socket.IO server, attempt:', attemptNumber);
            setIsConnected(true);
            joinSession();
        });

        newSocket.on('reconnect_error', (error) => {
            console.error('🔴 Socket.IO reconnection error:', error);
        });

        newSocket.on('reconnect_failed', () => {
            console.error('🔴 Socket.IO reconnection failed - max attempts reached');
            setIsConnected(false);
        });

        // Transport upgrade events
        newSocket.io.on('upgrade', () => {
            console.log('🟢 Transport upgraded to:', newSocket.io.engine.transport.name);
        });

        newSocket.io.on('upgradeError', (error) => {
            console.error('🔴 Transport upgrade error:', error);
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
            console.log('🧹 Cleaning up Socket.IO connection');
            newSocket.close();
        };
    }, []);

    // Helper functions for common socket operations
    const joinRoom = (data) => {
        if (socket && isConnected) {
            socket.emit('join', data);
            console.log(`📍 Joined room: ${data.userType}`, data);
        }
    };

    const sendRideRequest = (rideData) => {
        if (socket && isConnected) {
            socket.emit('ride-request', rideData);
            console.log('🚗 Ride request sent:', rideData);
        }
    };

    const updateCaptainLocation = (locationData) => {
        if (socket && isConnected) {
            socket.emit('update-location-captain', locationData);
            console.log('📍 Captain location updated:', locationData);
        }
    };

    const acceptRide = (rideData) => {
        if (socket && isConnected) {
            socket.emit('ride-accepted', rideData);
            console.log('✅ Ride accepted:', rideData);
        }
    };

    const completeRide = (rideData) => {
        if (socket && isConnected) {
            socket.emit('ride-completed', rideData);
            console.log('🏁 Ride completed:', rideData);
        }
    };

    return (
        <SocketContext.Provider value={{
            socket,
            isConnected,
            joinRoom,
            sendRideRequest,
            updateCaptainLocation,
            acceptRide,
            completeRide
        }}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketProvider;