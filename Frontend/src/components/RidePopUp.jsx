import React from 'react'
import { generateUserAvatar } from '../utils/avatarGenerator'
import { formatFare } from '../lib/mapUtils'
import { vehicleConfig } from '../lib/vehicleTypes'

const RidePopUp = (props) => {
    const ride = props.ride || {}
    const vehicle = vehicleConfig(ride.vehicleType)
    const distanceKm = ride.distance ? (ride.distance / 1000).toFixed(1) : null
    const minutes = ride.duration ? Math.max(1, Math.ceil(ride.duration / 60)) : null

    return (
        <div className='h-full flex flex-col'>
            <h5 className='p-1 text-center w-[93%] absolute top-0 cursor-pointer' onClick={() => props.setRidePopupPanel(false)}>
                <i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i>
            </h5>

            <h3 className='text-2xl font-semibold mb-1'>🚗 New YENKO request</h3>
            <p className='text-xs text-gray-500 mb-4'>Accept to share your OTP with the Rider.</p>

            <div className='flex-1 flex flex-col overflow-y-auto'>
                <div className='flex items-center justify-between p-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg shadow-sm'>
                    <div className='flex items-center gap-3'>
                        <img
                            className='h-12 w-12 rounded-full object-cover border-2 border-white'
                            src={generateUserAvatar(ride.user)}
                            alt="Rider Avatar"
                            onError={(e) => {
                                e.target.src = generateUserAvatar({ fullname: { firstname: 'Rider' } })
                            }}
                        />
                        <div>
                            <h2 className='text-lg font-medium text-white'>
                                {[ride.user?.fullname?.firstname, ride.user?.fullname?.lastname].filter(Boolean).join(' ') || 'YENKO Rider'}
                            </h2>
                            <p className='text-sm text-yellow-100'>Verified YENKO Rider</p>
                        </div>
                    </div>
                    <div className='text-right'>
                        <h5 className='text-lg font-semibold text-white'>{distanceKm ? `${distanceKm} KM` : 'New request'}</h5>
                        <p className='text-sm text-yellow-100'>{minutes ? `~${minutes} min trip` : 'Pickup nearby'}</p>
                    </div>
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
                            <p className='text-sm text-gray-600'>{vehicle.emoji} {vehicle.label} · Cash or Mobile Money</p>
                        </div>
                    </div>
                </div>

                <div className='mt-6 w-full flex flex-col gap-3'>
                    <button
                        type='button'
                        onClick={() => props.confirmRide()}
                        disabled={props.busy}
                        className={`w-full font-semibold p-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                            props.busy ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                    >
                        <i className="ri-check-line text-lg"></i>
                        {props.busy ? 'Accepting…' : 'Accept ride'}
                    </button>
                    <button
                        type='button'
                        onClick={props.declineRide}
                        className='w-full bg-red-500 hover:bg-red-600 text-white font-semibold p-3 rounded-lg transition-colors flex items-center justify-center gap-2'
                    >
                        <i className="ri-close-line text-lg"></i>
                        Decline
                    </button>
                </div>
            </div>
        </div>
    )
}

export default RidePopUp
