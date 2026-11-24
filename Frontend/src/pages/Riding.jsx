import React from 'react'
import { Link, useLocation } from 'react-router-dom' // Added useLocation
import { useEffect, useContext, useState } from 'react'
import { SocketContext } from '../context/socket.context'
import { useNavigate } from 'react-router-dom'
import LiveTracking from '../components/LiveTracking'
import { generateCaptainAvatar } from '../utils/avatarGenerator'
import RideCompleted from '../components/RideCompleted'
import Chat from './Chat'
import ShareRideButton from '../components/ShareRideButton'
import { Brand } from '../components/ui/YenkoShell'

const Riding = () => {
    const location = useLocation()
    const { ride } = location.state || {} // Retrieve ride data
    const { socket } = useContext(SocketContext)
    const navigate = useNavigate()
    const [rideCompleted, setRideCompleted] = useState(false)
    const [completedRideData, setCompletedRideData] = useState(null)
    const [chatOpen, setChatOpen] = useState(false)

    useEffect(() => {
        if (!ride) navigate('/home', { replace: true })
    }, [ride, navigate])

    useEffect(() => {
        if (!socket) return

        const handleRideCompleted = (data) => {
            setCompletedRideData(data)
            setRideCompleted(true)
        }

        socket.on('ride-completed', handleRideCompleted)
        return () => socket.off('ride-completed', handleRideCompleted)
    }, [socket])


    if (!ride) return null

    // Show ride completion screen if ride is completed
    if (rideCompleted && completedRideData) {
        return (
            <div className='h-screen'>
                <RideCompleted
                    ride={completedRideData}
                    onClose={() => navigate('/home', { replace: true })}
                />
            </div>
        );
    }

    return (
        <div className='h-screen'>
            <div className='fixed left-3 top-3 z-20 rounded-xl bg-white/95 px-3 py-2 shadow-md backdrop-blur'>
                <Brand compact />
            </div>
            <div className='fixed right-3 top-3 z-20 flex items-center gap-2'>
                <ShareRideButton ride={ride} role='rider' />
                <button
                    type='button'
                    onClick={() => setChatOpen(true)}
                    title='Chat with your YENKO Captain'
                    className='flex h-10 w-10 items-center justify-center rounded-full bg-[#111] text-white shadow-md'
                >
                    💬
                </button>
                <Link to='/home' title='Back to YENKO home' className='h-10 w-10 bg-white flex items-center justify-center rounded-full shadow-md'>
                    <i className="text-lg font-medium ri-home-5-line"></i>
                </Link>
            </div>
            <div className='h-1/2'>
                <LiveTracking
                    ride={ride}
                    showCaptain={true}
                    showRoute={true}
                />
            </div>
            <div className='h-1/2 p-4'>
                <div className='bg-green-50 p-4 rounded-lg mb-4'>
                    <h2 className='text-xl font-semibold text-green-800 mb-2'>🚗 YENKO Ride in Progress</h2>
                    <p className='text-green-600'>Your YENKO Captain is taking you to your destination</p>
                </div>

                <div className='flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg'>
                    <img
                        className='h-16 w-16 rounded-full object-cover border-2 border-green-200'
                        src={generateCaptainAvatar(ride?.captain)}
                        alt="Captain Avatar"
                        onError={(e) => {
                            e.target.src = generateCaptainAvatar({ fullname: { firstname: 'Captain' } });
                        }}
                    />
                    <div className='text-right'>
                        <h2 className='text-lg font-medium capitalize'>{ride?.captain?.fullname?.firstname || 'Driver'}</h2>
                        <h4 className='text-xl font-semibold -mt-1 -mb-1'>{ride?.captain?.vehicle?.plate || 'N/A'}</h4>
                        <p className='text-sm text-gray-600 capitalize'>{ride?.captain?.vehicle?.vehicleType || 'Car'} • {ride?.captain?.vehicle?.color || 'Unknown'}</p>
                    </div>
                </div>

                <div className='w-full'>
                    <div className='flex items-center gap-5 p-3 border-b-2'>
                        <i className="text-lg ri-map-pin-user-fill text-blue-600"></i>
                        <div>
                            <h3 className='text-lg font-medium'>Pickup Location</h3>
                            <p className='text-sm -mt-1 text-gray-600'>{ride?.pickup || 'Pickup location'}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-3 border-b-2'>
                        <i className="text-lg ri-map-pin-2-fill text-red-600"></i>
                        <div>
                            <h3 className='text-lg font-medium'>Destination</h3>
                            <p className='text-sm -mt-1 text-gray-600'>{ride?.destination || 'Destination'}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-3'>
                        <i className="ri-currency-line text-green-600"></i>
                        <div>
                            <h3 className='text-lg font-medium'>GH₵{ride?.fare || '0'}</h3>
                            <p className='text-sm -mt-1 text-gray-600'>Total Fare</p>
                        </div>
                    </div>
                </div>

                <div className='mt-4 p-3 bg-blue-50 rounded-lg text-center'>
                    <p className='text-blue-800 font-medium'>🚗 Enjoy your YENKO ride!</p>
                    <p className='text-blue-600 text-sm mt-1'>You'll be notified when you reach your destination</p>
                </div>
            </div>

            {chatOpen && (
                <Chat ride={ride} viewerRole='rider' onClose={() => setChatOpen(false)} />
            )}
        </div>
    )
}

export default Riding