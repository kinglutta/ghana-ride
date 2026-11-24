import React, { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CaptainDetails from '../components/CaptainDetails'
import RidePopUp from '../components/RidePopUp'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import ConfirmRidePopUp from '../components/ConfirmRidePopUp'
import { useEffect, useContext } from 'react'
import { SocketContext } from '../context/socket.context'
import { CaptainDataContext } from '../context/captain.context'
import axios from 'axios'
import { Brand } from '../components/ui/YenkoShell'
import { generateCaptainAvatar } from '../utils/avatarGenerator'
import SocketStatus from '../components/SocketStatus'
import homepageCover from '../assets/homepage-cover.jpg'
import { getToken, clearToken } from '../lib/authToken';

const CaptainHome = () => {

    const navigate = useNavigate()
    const [ridePopupPanel, setRidePopupPanel] = useState(false)
    const [confirmRidePopupPanel, setConfirmRidePopupPanel] = useState(false)

    const ridePopupPanelRef = useRef(null)
    const confirmRidePopupPanelRef = useRef(null)
    const [ride, setRide] = useState(null)

    const { socket } = useContext(SocketContext)
    const { captain } = useContext(CaptainDataContext)

    useEffect(() => {
        console.log('🔍 CaptainHome useEffect - Socket:', !!socket, 'Captain:', !!captain);
        console.log('🔍 Socket connected:', socket?.connected);

        if (socket && captain) {
            console.log('🔌 Captain connecting to socket with ID:', captain._id);
            console.log('🔌 Socket ID:', socket.id);

            socket.emit('join', {
                userId: captain._id,
                userType: 'captain',
                token: getToken('captain')
            })
            console.log('🚪 Captain joined socket room');

            // Test socket connection
            socket.emit('test-captain-connection', { captainId: captain._id });

            // Listen for connection confirmation
            socket.on('connection-confirmed', (data) => {
                console.log('✅ Socket connection confirmed:', data);
            });

            const updateLocation = () => {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        position => {
                            const location = {
                                ltd: position.coords.latitude,
                                lng: position.coords.longitude
                            };

                            console.log('📍 Updating captain location:', location);

                            // Emit to socket for real-time updates
                            socket.emit('update-location-captain', {
                                userId: captain._id,
                                location: location
                            });

                            // Also update in database via API
                            updateLocationInDatabase(location);
                        },
                        error => {
                            console.error('❌ Error getting location:', error);
                            alert('Please enable location access to receive ride requests');
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 60000
                        }
                    );
                }
            }

            const updateLocationInDatabase = async (location) => {
                try {
                    const token = getToken();
                    if (!token) {
                        console.error('❌ No authentication token found');
                        alert('Authentication required. Please login again.');
                        navigate('/captain-login');
                        return;
                    }

                    console.log('💾 Updating location in database:', location);
                    console.log('🔐 Using token for location update:', !!token);
                    console.log('🌐 API URL:', import.meta.env.VITE_API_URL);

                    const response = await axios.post(`${import.meta.env.VITE_API_URL}/captains/update-location`, {
                        location: location
                    }, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000 // 10 second timeout
                    });

                    console.log('✅ Location updated successfully:', response.data);
                } catch (error) {
                    console.error('❌ Failed to update location in database:', error);
                    console.error('❌ Error response:', error.response?.data);
                    console.error('❌ Error status:', error.response?.status);
                    console.error('❌ API URL being used:', import.meta.env.VITE_API_URL);

                    // Handle specific error cases
                    if (error.response?.status === 401) {
                        console.error('❌ Authentication failed for location update');
                        console.error('❌ Error details:', error.response?.data);

                        // Check if this is a token-database ID mismatch
                        if (error.response?.data?.error === 'TOKEN_ID_MISMATCH') {
                            console.error('🔧 Token-Database ID mismatch detected');
                            console.error('🔧 Token ID:', error.response.data.tokenId);
                            console.error('🔧 Available DB ID:', error.response.data.availableId);

                            // Show user-friendly message and offer to fix
                            const shouldFix = confirm(
                                'Authentication Error: Token-Database ID mismatch detected.\n\n' +
                                `Your token has captain ID: ${error.response.data.tokenId}\n` +
                                `But database has captain ID: ${error.response.data.availableId}\n\n` +
                                'This happens when the captain account was recreated.\n' +
                                'Click OK to clear the old token and login again with fresh credentials.'
                            );

                            if (shouldFix) {
                                clearToken('captain');
                                localStorage.removeItem('captain');
                                alert('Token cleared! Redirecting to login...');
                                navigate('/captain-login');
                            }
                        } else {
                            console.error('❌ Token might be expired or invalid');
                        }
                    } else if (error.response?.status === 400) {
                        console.error('❌ Invalid location data:', error.response.data);
                    } else if (error.code === 'ECONNABORTED') {
                        console.error('❌ Request timeout - server may be slow');
                    } else if (error.code === 'ERR_NETWORK') {
                        console.error('❌ Network error - check internet connection');
                        alert('Network error. Please check your internet connection.');
                    } else {
                        console.error('❌ Unexpected error:', error.message);
                    }
                }
            };

            const locationInterval = setInterval(updateLocation, 10000)
            updateLocation() // Get location immediately

            // Set up event listeners
            const handleNewRide = (data) => {
                console.log('🚨 NEW RIDE EVENT RECEIVED!', data);
                console.log('🚨 Setting ride data and showing popup');
                setRide(data)
                setRidePopupPanel(true)
                console.log('🚨 Popup state set to true');

                // Play notification sound (optional)
                try {
                    const audio = new Audio('/notification.mp3') // You can add a notification sound file
                    audio.play().catch(() => console.log('Could not play notification sound'))
                } catch {
                    console.log('Notification sound not available')
                }

                // Vibrate if supported (mobile)
                if (navigator.vibrate) {
                    navigator.vibrate([200, 100, 200])
                }
            }

            const handleNewRideRequest = (data) => {
                console.log('🚨 NEW RIDE REQUEST EVENT RECEIVED!', data);
                console.log('🚨 Setting ride data and showing popup');
                setRide(data)
                setRidePopupPanel(true)
                console.log('🚨 Popup state set to true');

                // Play notification sound (optional)
                try {
                    const audio = new Audio('/notification.mp3')
                    audio.play().catch(() => console.log('Could not play notification sound'))
                } catch {
                    console.log('Notification sound not available')
                }

                // Vibrate if supported (mobile)
                if (navigator.vibrate) {
                    navigator.vibrate([200, 100, 200])
                }
            }

            // Add event listeners
            console.log('🎧 Registering socket event listeners for captain');
            socket.on('new-ride', handleNewRide)
            socket.on('new-ride-request', handleNewRideRequest)

            // Test event listeners
            socket.on('join-confirmed', (data) => {
                console.log('✅ Join confirmed:', data);
            });

            socket.on('test-captain-connection', (data) => {
                console.log('🧪 Test connection received:', data);
            });

            console.log('🎧 Event listeners registered: new-ride, new-ride-request, join-confirmed, test-captain-connection');

            // Cleanup function
            return () => {
                clearInterval(locationInterval)
                socket.off('new-ride', handleNewRide)
                socket.off('new-ride-request', handleNewRideRequest)
            }
        }
    }, [socket, captain, navigate])

    async function confirmRide() {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/rides/confirm`, {
                rideId: ride._id,
                captainId: captain._id,
            }, {
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            })

            setRidePopupPanel(false)
            setConfirmRidePopupPanel(true)
        } catch (error) {
            console.error('Error confirming ride:', error)
            alert('Failed to confirm ride. Please try again.')
        }
    }

    async function declineRide() {
        try {
            // You can implement a decline API endpoint here if needed
            // For now, just close the popup and notify via socket
            if (socket && ride) {
                socket.emit('ride-declined', {
                    rideId: ride._id,
                    captainId: captain._id
                })
            }

            setRidePopupPanel(false)
            setRide(null)

            // Optional: Show a brief notification
            console.log('Ride declined successfully')
        } catch (error) {
            console.error('Error declining ride:', error)
        }
    }


    useGSAP(function () {
        console.log('🎬 GSAP animation triggered - ridePopupPanel:', ridePopupPanel);
        if (ridePopupPanel) {
            console.log('🎬 Showing popup - animating to translateY(0)');
            gsap.to(ridePopupPanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            console.log('🎬 Hiding popup - animating to translateY(100%)');
            gsap.to(ridePopupPanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ridePopupPanel])

    useGSAP(function () {
        if (confirmRidePopupPanel) {
            gsap.to(confirmRidePopupPanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(confirmRidePopupPanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [confirmRidePopupPanel])

    return (
        <div className='h-screen'>
            <div className='fixed p-6 top-0 flex items-center justify-between w-screen'>
                <div className='flex items-center gap-3'>
                    <div className='rounded-xl bg-white/95 px-3 py-2 shadow-md backdrop-blur'>
                        <Brand compact />
                    </div>
                    <span className='rounded-full bg-[#111] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f5c400]'>
                        Captain
                    </span>
                </div>
                <div className='flex items-center gap-3'>
                    <img
                        className='h-10 w-10 rounded-full object-cover border-2 border-white shadow-lg'
                        src={generateCaptainAvatar(captain)}
                        alt="Captain Avatar"
                        onError={(e) => {
                            e.target.src = generateCaptainAvatar({ fullname: { firstname: 'Captain' } });
                        }}
                    />
                    <Link to='/driver-verification' title='Driver Verification' className=' h-10 w-10 bg-white flex items-center justify-center rounded-full'>
                        <i className="text-lg font-medium ri-shield-check-line"></i>
                    </Link>
                    <Link to='/captains/logout' title='Logout' className=' h-10 w-10 bg-white flex items-center justify-center rounded-full'>
                        <i className="text-lg font-medium ri-logout-box-r-line"></i>
                    </Link>
                </div>
            </div>
            <div className='h-3/5'>
                <img className='h-full w-full object-cover' src={homepageCover} alt="Map Background" />

            </div>
            <div className='h-2/5 p-6'>
                <CaptainDetails />
            </div>
            <div ref={ridePopupPanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12 h-[80vh] max-h-[700px]'>
                <RidePopUp
                    ride={ride}
                    setRidePopupPanel={setRidePopupPanel}
                    setConfirmRidePopupPanel={setConfirmRidePopupPanel}
                    confirmRide={confirmRide}
                    declineRide={declineRide}
                />
            </div>
            <div ref={confirmRidePopupPanelRef} className='fixed w-full h-screen z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
                <ConfirmRidePopUp
                    ride={ride}
                    setConfirmRidePopupPanel={setConfirmRidePopupPanel} setRidePopupPanel={setRidePopupPanel} />
            </div>

            {/* Socket Status Indicator */}
            <SocketStatus />
        </div>
    )
}

export default CaptainHome