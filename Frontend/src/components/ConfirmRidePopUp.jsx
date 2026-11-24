import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { generateUserAvatar } from '../utils/avatarGenerator'
import { formatFare } from '../lib/mapUtils'
import { getToken } from '../lib/authToken'

const ConfirmRidePopUp = (props) => {
    const [otp, setOtp] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const ride = props.ride || {}
    const distanceKm = ride.distance ? (ride.distance / 1000).toFixed(1) : null

    const cancel = () => {
        props.setConfirmRidePopupPanel(false)
        props.setRidePopupPanel(false)
    }

    const startRide = async (event) => {
        event.preventDefault()
        if (!/^\d{6}$/.test(otp)) {
            setError('Enter the 6-digit OTP shown by the Rider.')
            return
        }

        setIsLoading(true)
        setError('')
        try {
            await axios.get(`${import.meta.env.VITE_API_URL}/rides/start-ride`, {
                params: { rideId: ride._id, otp },
                headers: { Authorization: `Bearer ${getToken('captain')}` },
            })
            cancel()
            navigate('/captain-riding', { state: { ride } })
        } catch (err) {
            setError(err.response?.data?.message || 'Could not start the ride. Check the OTP and try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0 cursor-pointer' onClick={cancel}>
                <i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i>
            </h5>
            <h3 className='text-2xl font-semibold mb-1'>Confirm and start ride</h3>
            <p className='text-xs text-gray-500 mb-4'>Ask the Rider for their OTP before you drive off.</p>

            <div className='flex items-center justify-between p-3 border-2 border-yellow-400 rounded-lg'>
                <div className='flex items-center gap-3'>
                    <img
                        className='h-12 w-12 rounded-full object-cover border-2 border-blue-200'
                        src={generateUserAvatar(ride.user)}
                        alt="Rider Avatar"
                        onError={(e) => {
                            e.target.src = generateUserAvatar({ fullname: { firstname: 'Rider' } })
                        }}
                    />
                    <h2 className='text-lg font-medium capitalize'>
                        {ride.user?.fullname?.firstname || 'YENKO Rider'}
                    </h2>
                </div>
                <h5 className='text-lg font-semibold'>{distanceKm ? `${distanceKm} KM` : 'Trip ready'}</h5>
            </div>

            <div className='w-full mt-4'>
                <div className='flex items-center gap-5 p-3 border-b-2'>
                    <i className="ri-map-pin-user-fill text-lg text-blue-600"></i>
                    <div>
                        <h3 className='text-base font-medium'>Pickup</h3>
                        <p className='text-sm text-gray-600'>{ride.pickup}</p>
                    </div>
                </div>
                <div className='flex items-center gap-5 p-3 border-b-2'>
                    <i className="text-lg ri-map-pin-2-fill text-red-600"></i>
                    <div>
                        <h3 className='text-base font-medium'>Destination</h3>
                        <p className='text-sm text-gray-600'>{ride.destination}</p>
                    </div>
                </div>
                <div className='flex items-center gap-5 p-3'>
                    <i className="ri-currency-line text-lg text-green-600"></i>
                    <div>
                        <h3 className='text-lg font-semibold'>{formatFare(ride.fare)}</h3>
                        <p className='text-sm text-gray-600'>Cash or Mobile Money</p>
                    </div>
                </div>
            </div>

            <form onSubmit={startRide} className='mt-6 w-full'>
                <label className='text-sm font-semibold text-gray-700' htmlFor='ride-otp'>
                    Rider OTP
                </label>
                <input
                    id='ride-otp'
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    type='text'
                    inputMode='numeric'
                    pattern='[0-9]{6}'
                    maxLength={6}
                    autoComplete='one-time-code'
                    className='bg-[#eee] px-6 py-4 font-mono text-lg tracking-[0.5em] rounded-lg w-full mt-2'
                    placeholder='••••••'
                    required
                />

                {error && <p className='mt-2 text-sm text-red-600'>{error}</p>}

                <button
                    type='submit'
                    disabled={isLoading}
                    className={`w-full mt-5 text-lg flex justify-center items-center font-semibold p-3 rounded-lg transition-colors ${
                        isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                >
                    {isLoading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Starting ride…
                        </>
                    ) : (
                        'Start ride'
                    )}
                </button>
                <button
                    type='button'
                    onClick={cancel}
                    className='w-full mt-2 bg-gray-100 text-gray-700 text-lg font-semibold p-3 rounded-lg hover:bg-gray-200 transition-colors'
                >
                    Cancel
                </button>
            </form>
        </div>
    )
}

export default ConfirmRidePopUp
