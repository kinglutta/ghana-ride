import React, { useContext, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import FinishRide from '../components/FinishRide'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import LiveTracking from '../components/LiveTracking'
import Chat from './Chat'
import ShareRideButton from '../components/ShareRideButton'
import { Brand } from '../components/ui/YenkoShell'
import { SocketContext } from '../context/socket.context'

const CaptainRiding = () => {
    const [finishRidePanel, setFinishRidePanel] = useState(false)
    const [chatOpen, setChatOpen] = useState(false)
    const finishRidePanelRef = useRef(null)
    const location = useLocation()
    const navigate = useNavigate()
    const { socket } = useContext(SocketContext)
    const ride = location.state?.ride
    const distanceKm = ride?.distance ? (ride.distance / 1000).toFixed(1) : null

    useEffect(() => {
        if (!ride) navigate('/captain-home', { replace: true })
    }, [ride, navigate])

    useEffect(() => {
        if (!socket || !ride?._id || !navigator.geolocation) return

        const share = ({ coords }) => {
            socket.emit('update-location-captain', {
                rideId: ride._id,
                location: { ltd: coords.latitude, lng: coords.longitude },
            })
        }

        navigator.geolocation.getCurrentPosition(share, () => {})
        const watchId = navigator.geolocation.watchPosition(share, () => {}, {
            enableHighAccuracy: true,
            maximumAge: 5000,
        })
        return () => navigator.geolocation.clearWatch(watchId)
    }, [socket, ride])

    useGSAP(() => {
        gsap.to(finishRidePanelRef.current, {
            transform: finishRidePanel ? 'translateY(0)' : 'translateY(100%)',
        })
    }, [finishRidePanel])

    if (!ride) return null

    return (
        <div className='h-screen relative flex flex-col justify-end'>
            <div className='fixed p-6 top-0 flex items-center justify-between w-screen z-20'>
                <div className='rounded-xl bg-white/95 px-3 py-2 shadow-md backdrop-blur'>
                    <Brand compact />
                </div>
                <div className='flex items-center gap-2'>
                    <ShareRideButton ride={ride} role='captain' />
                    <button
                        type='button'
                        onClick={() => setChatOpen(true)}
                        title='Message rider'
                        className='flex h-10 w-10 items-center justify-center rounded-full bg-[#f5c400] text-[#111] shadow-md'
                    >
                        💬
                    </button>
                    <Link to='/captain-home' title='Captain home' className='h-10 w-10 bg-white flex items-center justify-center rounded-full shadow-md'>
                        <i className="text-lg font-medium ri-home-5-line"></i>
                    </Link>
                </div>
            </div>

            <button
                type='button'
                onClick={() => setFinishRidePanel(true)}
                className='h-1/5 p-6 flex items-center justify-between relative bg-yellow-400 pt-10 w-full text-left'
            >
                <h5 className='p-1 text-center w-[90%] absolute top-0'>
                    <i className="text-3xl text-gray-800 ri-arrow-up-wide-line"></i>
                </h5>
                <h4 className='text-xl font-semibold'>
                    {distanceKm ? `${distanceKm} KM to destination` : 'Ride in progress'}
                </h4>
                <span className='bg-green-600 text-white font-semibold p-3 px-10 rounded-lg'>
                    Complete Ride
                </span>
            </button>

            <div ref={finishRidePanelRef} className='fixed w-full z-[500] bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
                <FinishRide ride={ride} setFinishRidePanel={setFinishRidePanel} />
            </div>

            <div className='h-screen fixed w-screen top-0 z-[-1]'>
                <LiveTracking ride={ride} showCaptain={false} showRoute={true} showSos={false} />
            </div>

            {chatOpen && (
                <Chat ride={ride} viewerRole='captain' onClose={() => setChatOpen(false)} />
            )}
        </div>
    )
}

export default CaptainRiding
