import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { generateUserAvatar } from '../utils/avatarGenerator'
import { formatFare } from '../lib/mapUtils'
import { getToken } from '../lib/authToken'

const FinishRide = (props) => {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const ride = props.ride || {}
    const distanceKm = ride.distance ? (ride.distance / 1000).toFixed(1) : null

    async function endRide() {
        setIsLoading(true)
        setError('')
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/rides/end-ride`,
                { rideId: ride._id },
                { headers: { Authorization: `Bearer ${getToken('captain')}` } })
            navigate('/captain-home')
        } catch (err) {
            setError(err.response?.data?.message || 'Could not finish the ride. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0 cursor-pointer' onClick={() => props.setFinishRidePanel(false)}>
                <i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i>
            </h5>
            <h3 className='text-2xl font-semibold mb-1'>Finish this ride</h3>
            <p className='text-xs text-gray-500 mb-4'>Confirm the trip is complete to credit your earnings.</p>

            <div className='flex items-center justify-between p-4 border-2 border-yellow-400 rounded-lg'>
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
                <h5 className='text-lg font-semibold'>{distanceKm ? `${distanceKm} KM` : 'Trip complete'}</h5>
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

            {error && <p className='mt-3 text-sm text-red-600'>{error}</p>}

            <button
                type='button'
                onClick={endRide}
                disabled={isLoading}
                className={`w-full mt-6 flex text-lg justify-center items-center font-semibold p-3 rounded-lg transition-colors ${
                    isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
            >
                {isLoading ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Finishing ride…
                    </>
                ) : (
                    'Finish ride'
                )}
            </button>
        </div>
    )
}

export default FinishRide
