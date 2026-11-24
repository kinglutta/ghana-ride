import React, { useContext, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CaptainDetails from '../components/CaptainDetails'
import RidePopUp from '../components/RidePopUp'
import ConfirmRidePopUp from '../components/ConfirmRidePopUp'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { SocketContext } from '../context/socket.context'
import { CaptainDataContext } from '../context/captain.context'
import axios from 'axios'
import { Brand } from '../components/ui/YenkoShell'
import { generateCaptainAvatar } from '../utils/avatarGenerator'
import LiveTracking from '../components/LiveTracking'
import { getToken } from '../lib/authToken'

const CaptainHome = () => {
    const navigate = useNavigate()
    const [ridePopupPanel, setRidePopupPanel] = useState(false)
    const [confirmRidePopupPanel, setConfirmRidePopupPanel] = useState(false)
    const [ride, setRide] = useState(null)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    const ridePopupPanelRef = useRef(null)
    const confirmRidePopupPanelRef = useRef(null)

    const { socket } = useContext(SocketContext)
    const { captain } = useContext(CaptainDataContext)
    const activeRideId = ride?._id

    useEffect(() => {
        if (!socket || !captain) return

        // Identity comes from the verified token; client IDs are ignored.
        socket.emit('join', {
            userId: captain._id,
            userType: 'captain',
            token: getToken('captain'),
        })

        const updateLocation = () => {
            if (!navigator.geolocation) return
            navigator.geolocation.getCurrentPosition(
                ({ coords }) => {
                    const location = { ltd: coords.latitude, lng: coords.longitude }
                    socket.emit('update-location-captain', { rideId: activeRideId, location })
                    axios.post(`${import.meta.env.VITE_API_URL}/captains/update-location`,
                        { location },
                        { headers: { Authorization: `Bearer ${getToken('captain')}` } }
                    ).catch((err) => {
                        if (err.response?.status === 401) {
                            navigate('/onboarding?mode=signin&role=captain')
                        }
                    })
                },
                () => {
                    // Permission is optional; offers need a verified Captain
                    // with a saved location, so the app degrades gracefully.
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            )
        }

        const locationInterval = setInterval(updateLocation, 15000)
        updateLocation()

        const handleNewRide = (offer) => {
            setRide(offer)
            setRidePopupPanel(true)
            setError('')
            if (navigator.vibrate) navigator.vibrate([200, 100, 200])
        }

        const handleCancelled = () => {
            setRide(null)
            setRidePopupPanel(false)
            setConfirmRidePopupPanel(false)
        }

        // One event per offer — the duplicate alias caused double alerts.
        socket.on('new-ride', handleNewRide)
        socket.on('ride-cancelled', handleCancelled)

        return () => {
            clearInterval(locationInterval)
            socket.off('new-ride', handleNewRide)
            socket.off('ride-cancelled', handleCancelled)
        }
    }, [socket, captain, navigate, activeRideId])

    async function confirmRide() {
        if (!ride?._id) throw new Error('No ride selected')
        setBusy(true)
        setError('')
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/rides/confirm`,
                { rideId: ride._id },
                { headers: { Authorization: `Bearer ${getToken('captain')}` } })

            setRide((current) => ({ ...current, status: 'accepted' }))
            setRidePopupPanel(false)
            setConfirmRidePopupPanel(true)
        } catch (err) {
            const message = err.response?.data?.message || 'Could not accept this ride. It may have been taken.'
            setError(message)
            throw err
        } finally {
            setBusy(false)
        }
    }

    function declineRide() {
        // No ride is claimed until accept, so closing is enough; the offer
        // remains available to the next verified Captain.
        setRide(null)
        setRidePopupPanel(false)
    }

    useGSAP(() => {
        gsap.to(ridePopupPanelRef.current, {
            transform: ridePopupPanel ? 'translateY(0)' : 'translateY(100%)',
        })
    }, [ridePopupPanel])

    useGSAP(() => {
        gsap.to(confirmRidePopupPanelRef.current, {
            transform: confirmRidePopupPanel ? 'translateY(0)' : 'translateY(100%)',
        })
    }, [confirmRidePopupPanel])

    return (
        <div className='h-screen'>
            <div className='fixed p-6 top-0 flex items-center justify-between w-screen z-20'>
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
                            e.target.src = generateCaptainAvatar({ fullname: { firstname: 'Captain' } })
                        }}
                    />
                    <Link to='/driver-verification' title='Verification' className='h-10 w-10 bg-white flex items-center justify-center rounded-full'>
                        <i className="text-lg font-medium ri-shield-check-line"></i>
                    </Link>
                    <Link to='/captains/logout' title='Logout' className='h-10 w-10 bg-white flex items-center justify-center rounded-full'>
                        <i className="text-lg font-medium ri-logout-box-r-line"></i>
                    </Link>
                </div>
            </div>

            {error && (
                <div className='fixed top-24 left-5 right-5 z-20 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700 shadow'>
                    {error}
                </div>
            )}

            <div className='h-3/5'>
                <LiveTracking ride={ride} showCaptain={false} showRoute={false} showSos={false} />
            </div>
            <div className='h-2/5 p-6'>
                <CaptainDetails />
            </div>

            <div ref={ridePopupPanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12 h-[80vh] max-h-[700px]'>
                <RidePopUp
                    ride={ride}
                    busy={busy}
                    setRidePopupPanel={setRidePopupPanel}
                    setConfirmRidePopupPanel={setConfirmRidePopupPanel}
                    confirmRide={confirmRide}
                    declineRide={declineRide}
                />
            </div>
            <div ref={confirmRidePopupPanelRef} className='fixed w-full h-screen z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
                <ConfirmRidePopUp
                    ride={ride}
                    setConfirmRidePopupPanel={setConfirmRidePopupPanel}
                    setRidePopupPanel={setRidePopupPanel}
                />
            </div>
        </div>
    )
}

export default CaptainHome
