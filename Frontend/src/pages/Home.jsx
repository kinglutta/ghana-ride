import React, { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import axios from 'axios';
import 'remixicon/fonts/remixicon.css'
import LocationSearchPanel from '../components/LocationSearchPanel';
import VehiclePanel from '../components/VehiclePanel';
import ConfirmRide from '../components/ConfirmRide';
import LookingForDriver from '../components/LookingForDriver';
import WaitingForDriver from '../components/WaitingForDriver';
import { SocketContext } from '../context/socket.context';
import { useContext } from 'react';
import { UserDataContext } from '../context/user.context';
import { useNavigate } from 'react-router-dom';
import LiveTracking from '../components/LiveTracking';
import { Brand } from '../components/ui/YenkoShell';
import { generateUserAvatar } from '../utils/avatarGenerator'
import { getToken } from '../lib/authToken';

const Home = () => {
    const [pickup, setPickup] = useState('')
    const [destination, setDestination] = useState('')
    const [panelOpen, setPanelOpen] = useState(false)
    const vehiclePanelRef = useRef(null)
    const confirmRidePanelRef = useRef(null)
    const vehicleFoundRef = useRef(null)
    const waitingForDriverRef = useRef(null)
    const panelRef = useRef(null)
    const panelCloseRef = useRef(null)
    const [vehiclePanel, setVehiclePanel] = useState(false)
    const [confirmRidePanel, setConfirmRidePanel] = useState(false)
    const [vehicleFound, setVehicleFound] = useState(false)
    const [waitingForDriver, setWaitingForDriver] = useState(false)
    const [pickupSuggestions, setPickupSuggestions] = useState([])
    const [destinationSuggestions, setDestinationSuggestions] = useState([])
    const [activeField, setActiveField] = useState(null)
    const [fares, setFares] = useState(null)
    const [fareLoading, setFareLoading] = useState(false)
    const [tripError, setTripError] = useState('')
    const [noCaptains, setNoCaptains] = useState(false)
    const [captainLocation, setCaptainLocation] = useState(null)
    const [paymentMethod, setPaymentMethod] = useState('cash')
    const [vehicleType, setVehicleType] = useState(null)
    const [ride, setRide] = useState(null)
    const rideRef = useRef(null)

    rideRef.current = ride
    const selectedFare = fares?.fares?.[vehicleType] || null

    const navigate = useNavigate()

    const { socket } = useContext(SocketContext)
    const { user } = useContext(UserDataContext)

    useEffect(() => {
        if (!socket || !user) return

        // Identity is verified from the token by the server; userType is kept
        // only for older clients that still read it.
        socket.emit('join', { userType: 'user', userId: user._id, token: getToken('rider') })

        const handleRideConfirmed = (assigned) => {
            setVehicleFound(false)
            setNoCaptains(false)
            setWaitingForDriver(true)
            setRide(assigned)
        }

        const handleRideStarted = (started) => {
            setWaitingForDriver(false)
            navigate('/riding', { state: { ride: started } })
        }

        const handleNoCaptains = (data) => {
            setNoCaptains(true)
            setTripError(data?.message || 'No Captain nearby yet. We are still looking.')
        }

        const handleCancelled = () => {
            setWaitingForDriver(false)
            setVehicleFound(false)
            setRide(null)
            setTripError('This ride was cancelled. You can request another one.')
        }

        const handleCaptainLocationUpdate = (data) => {
            // The server scopes ride events to participants; still ignore
            // positions that belong to another active ride.
            if (!rideRef.current || (data?.rideId && String(data.rideId) !== String(rideRef.current._id))) return
            const location = data?.location || data
            if (location?.ltd && location?.lng) {
                setCaptainLocation({ lat: location.ltd, lng: location.lng })
            }
        }

        const handlers = {
            'ride-confirmed': handleRideConfirmed,
            'ride-started': handleRideStarted,
            'no-captains-nearby': handleNoCaptains,
            'ride-cancelled': handleCancelled,
            'captain-location-update': handleCaptainLocationUpdate,
        }

        Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler))
        return () => {
            Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler))
        }
    }, [socket, user, navigate])


    const handlePickupChange = async (e) => {
        setPickup(e.target.value)

        // Only fetch suggestions if input is at least 3 characters
        if (e.target.value.length < 3) {
            setPickupSuggestions([])
            return
        }

        try {
            console.log('Fetching pickup suggestions for:', e.target.value)
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/maps/get-suggestions`, {
                params: { input: e.target.value },
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            })
            console.log('Pickup suggestions response:', response.data)
            setPickupSuggestions(response.data)
        } catch (error) {
            console.error('Error fetching pickup suggestions:', error)
            setPickupSuggestions([])
        }
    }

    const handleDestinationChange = async (e) => {
        setDestination(e.target.value)

        // Only fetch suggestions if input is at least 3 characters
        if (e.target.value.length < 3) {
            setDestinationSuggestions([])
            return
        }

        try {
            console.log('Fetching destination suggestions for:', e.target.value)
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/maps/get-suggestions`, {
                params: { input: e.target.value },
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            })
            console.log('Destination suggestions response:', response.data)
            setDestinationSuggestions(response.data)
        } catch (error) {
            console.error('Error fetching destination suggestions:', error)
            setDestinationSuggestions([])
        }
    }

    const submitHandler = (e) => {
        e.preventDefault()
    }

    useGSAP(function () {
        if (panelOpen) {
            gsap.to(panelRef.current, {
                height: '70%',
                padding: 24
                // opacity:1
            })
            gsap.to(panelCloseRef.current, {
                opacity: 1
            })
        } else {
            gsap.to(panelRef.current, {
                height: '0%',
                padding: 0
                // opacity:0
            })
            gsap.to(panelCloseRef.current, {
                opacity: 0
            })
        }
    }, [panelOpen])


    useGSAP(function () {
        if (vehiclePanel) {
            gsap.to(vehiclePanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(vehiclePanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [vehiclePanel])

    useGSAP(function () {
        if (confirmRidePanel) {
            gsap.to(confirmRidePanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(confirmRidePanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [confirmRidePanel])

    useGSAP(function () {
        if (vehicleFound) {
            gsap.to(vehicleFoundRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(vehicleFoundRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [vehicleFound])

    useGSAP(function () {
        if (waitingForDriver) {
            gsap.to(waitingForDriverRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(waitingForDriverRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [waitingForDriver])


    const getPosition = async () => {
        if (!navigator.geolocation) return {}
        try {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 5000,
                    maximumAge: 60000,
                })
            })
            return { lat: pos.coords.latitude, lng: pos.coords.longitude }
        } catch {
            return {}
        }
    }

    async function findTrip() {
        if (pickup.trim().length < 3 || destination.trim().length < 3) {
            setTripError('Add a pickup and destination to see YENKO fares.')
            return
        }

        setTripError('')
        setNoCaptains(false)
        setFareLoading(true)
        setVehiclePanel(true)
        setPanelOpen(false)

        try {
            const { lat, lng } = await getPosition()
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/rides/get-fares`, {
                params: { pickup, destination, lat, lng },
                headers: { Authorization: `Bearer ${getToken()}` },
            })
            setFares(response.data)
        } catch (error) {
            setTripError(error.response?.data?.message || 'Could not calculate fares. Please try again.')
            setVehiclePanel(false)
        } finally {
            setFareLoading(false)
        }
    }

    async function createRide() {
        // Errors are re-thrown so the confirm panel can recover and retry.
        const { lat, lng } = await getPosition()
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/rides/create`, {
            pickup,
            destination,
            vehicleType,
            lat,
            lng,
            paymentMethod,
        }, {
            headers: { Authorization: `Bearer ${getToken()}` },
        })

        setRide(response.data)
        setNoCaptains(false)
        return response.data
    }

    async function cancelSearch() {
        if (ride?._id) {
            try {
                await axios.post(`${import.meta.env.VITE_API_URL}/rides/cancel`,
                    { rideId: ride._id },
                    { headers: { Authorization: `Bearer ${getToken()}` } })
            } catch (error) {
                console.error('Cancel ride failed:', error.message)
            }
        }

        setVehicleFound(false)
        setWaitingForDriver(false)
        setRide(null)
        setNoCaptains(false)
        setTripError('Ride request cancelled. You can request another one.')
    }

    return (
        <div className='h-screen relative overflow-hidden'>
            {/* YENKO brand, user avatar and quick actions */}
            <div className='absolute left-5 top-5 z-20'>
                <div className='rounded-xl bg-white/95 px-3 py-2 shadow-md backdrop-blur'>
                    <Brand compact />
                </div>
            </div>
            <div className='absolute right-5 top-5 z-20 flex items-center gap-3'>
                <button
                    onClick={() => navigate('/payment')}
                    className='w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors'
                    title='Wallet & Payments'
                >
                    💳
                </button>
                <button
                    onClick={() => navigate('/safety')}
                    className='w-12 h-12 rounded-full bg-white border border-red-100 flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors'
                    title='Safety & SOS'
                >
                    🛡️
                </button>
                <button
                    onClick={() => navigate('/scheduled-rides/book')}
                    className='w-12 h-12 rounded-full bg-white border border-orange-100 flex items-center justify-center shadow-sm hover:bg-orange-50 transition-colors'
                    title='Schedule Ride'
                >
                    📅
                </button>
                <button
                    onClick={() => navigate('/disputes')}
                    className='w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors'
                    title='Disputes & Support'
                >
                    ❓
                </button>
                <img
                    className='h-12 w-12 rounded-full object-cover border-2 border-white shadow-lg bg-white'
                    src={generateUserAvatar(user)}
                    alt="User Avatar"
                    onError={(e) => {
                        e.target.src = generateUserAvatar({ fullname: { firstname: 'User' } });
                    }}
                />
            </div>

            {/* Trust strip — every action here is a real, working shortcut. */}
            <div className='absolute top-24 left-5 right-5 z-20 flex flex-wrap gap-2 justify-center'>
                <span className='px-4 py-2 rounded-full border border-blue-200 bg-blue-50/95 text-blue-700 text-xs font-semibold shadow-sm'>
                    🇬🇭 Built for Ghana · GH₵ fares
                </span>
                <button
                    type='button'
                    onClick={() => (fares ? setVehiclePanel(true) : findTrip())}
                    className='px-4 py-2 rounded-full border border-gray-200 bg-white/95 text-gray-700 text-xs font-semibold shadow-sm hover:bg-gray-50'
                >
                    🚗 Compare ride prices
                </button>
                <button
                    type='button'
                    onClick={() => navigate('/safety')}
                    className='px-4 py-2 rounded-full border border-red-200 bg-red-50/95 text-red-700 text-xs font-semibold shadow-sm hover:bg-red-100'
                >
                    🛡️ Safety & SOS
                </button>
            </div>

            {tripError && (
                <div className='absolute top-40 left-5 right-5 z-20 flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50/95 px-4 py-3 shadow-md'>
                    <span className='text-lg'>⚠️</span>
                    <p className='flex-1 text-sm text-yellow-800'>{tripError}</p>
                    <button type='button' onClick={() => setTripError('')} className='text-yellow-700 font-bold' aria-label='Dismiss message'>×</button>
                </div>
            )}

            <div className='h-screen w-screen'>
                <LiveTracking
                    ride={ride}
                    showCaptain={Boolean(ride)}
                    captainPosition={captainLocation}
                    showSos={false}
                />
            </div>
            <div className=' flex flex-col justify-end h-screen absolute top-0 w-full'>
                <div className='h-[30%] p-6 bg-white relative'>
                    <h5 ref={panelCloseRef} onClick={() => {
                        setPanelOpen(false)
                    }} className='absolute opacity-0 right-6 top-6 text-2xl'>
                        <i className="ri-arrow-down-wide-line"></i>
                    </h5>
                    <h4 className='text-2xl font-semibold'>Find a trip</h4>
                    <form className='relative py-3' onSubmit={(e) => {
                        submitHandler(e)
                    }}>
                        <div className="line absolute h-16 w-1 top-[50%] -translate-y-1/2 left-5 bg-gray-700 rounded-full"></div>
                        <input
                            onClick={() => {
                                setPanelOpen(true)
                                setActiveField('pickup')
                                // Clear destination suggestions when focusing on pickup
                                setDestinationSuggestions([])
                            }}
                            value={pickup}
                            onChange={handlePickupChange}
                            className={`bg-[#eee] px-12 py-2 text-lg rounded-lg w-full transition-all duration-200 ${activeField === 'pickup' && panelOpen ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                                }`}
                            type="text"
                            placeholder='Add a pick-up location'
                        />
                        <input
                            onClick={() => {
                                setPanelOpen(true)
                                setActiveField('destination')
                                // Clear pickup suggestions when focusing on destination
                                setPickupSuggestions([])
                            }}
                            value={destination}
                            onChange={handleDestinationChange}
                            className={`bg-[#eee] px-12 py-2 text-lg rounded-lg w-full mt-3 transition-all duration-200 ${activeField === 'destination' && panelOpen ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                                }`}
                            type="text"
                            placeholder='Enter your destination' />
                    </form>
                    <button
                        type='button'
                        onClick={findTrip}
                        disabled={fareLoading}
                        className='bg-[#111] text-white px-4 py-3 rounded-lg mt-3 w-full font-semibold disabled:bg-gray-400 transition-colors'>
                        {fareLoading ? 'Calculating fares…' : 'Find Trip'}
                    </button>
                </div>
                <div ref={panelRef} className='bg-white h-0'>
                    <LocationSearchPanel
                        suggestions={activeField === 'pickup' ? pickupSuggestions : destinationSuggestions}
                        setPanelOpen={setPanelOpen}
                        setVehiclePanel={setVehiclePanel}
                        setPickup={setPickup}
                        setDestination={setDestination}
                        activeField={activeField}
                    />
                </div>
            </div>
            <div ref={vehiclePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12 h-[70vh] max-h-[500px]'>
                <VehiclePanel
                    selectVehicle={setVehicleType}
                    selectedVehicle={vehicleType}
                    fares={fares}
                    loading={fareLoading}
                    tripDistance={fares?.distanceKm}
                    tripDuration={fares?.durationMin}
                    setConfirmRidePanel={setConfirmRidePanel}
                    setVehiclePanel={setVehiclePanel} />
            </div>
            <div ref={confirmRidePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12 h-[75vh] max-h-[600px]'>
                <ConfirmRide
                    createRide={createRide}
                    pickup={pickup}
                    destination={destination}
                    fare={selectedFare}
                    vehicleType={vehicleType}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    setConfirmRidePanel={setConfirmRidePanel}
                    setVehicleFound={setVehicleFound} />
            </div>
            <div ref={vehicleFoundRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12 h-[75vh] max-h-[600px]'>
                <LookingForDriver
                    pickup={pickup}
                    destination={destination}
                    fare={selectedFare}
                    vehicleType={vehicleType}
                    noCaptains={noCaptains}
                    onCancel={cancelSearch}
                    setVehicleFound={setVehicleFound} />
            </div>
            <div ref={waitingForDriverRef} className='fixed w-full z-10 bottom-0 bg-white px-3 py-6 pt-12 h-[80vh] max-h-[700px]'>
                <WaitingForDriver
                    ride={ride}
                    onMessage={() => ride?._id && navigate(`/chat/${ride._id}`)}
                    setVehicleFound={setVehicleFound}
                    setWaitingForDriver={setWaitingForDriver}
                    waitingForDriver={waitingForDriver} />
            </div>
        </div>
    )
}

export default Home