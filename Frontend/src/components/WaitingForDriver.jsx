import React from 'react'
import { generateCaptainAvatar } from '../utils/avatarGenerator'
import { formatFare } from '../lib/mapUtils'
import { vehicleConfig } from '../lib/vehicleTypes'

const WaitingForDriver = (props) => {
    const ride = props.ride || {}
    const vehicle = vehicleConfig(ride.vehicleType || ride.captain?.vehicle?.vehicleType)

    return (
        <div className='h-full flex flex-col'>
            <h5 className='p-1 text-center w-[93%] absolute top-0 cursor-pointer' onClick={() => props.setWaitingForDriver(false)}>
                <i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i>
            </h5>

            <h3 className='text-2xl font-semibold mb-1'>Your Captain is on the way</h3>
            <p className='text-xs text-gray-500 mb-4'>Share the OTP only when you are in the vehicle.</p>

            <div className='flex-1 flex flex-col justify-between overflow-y-auto'>
                <div>
                    <div className='flex items-center justify-between mb-5 p-4 bg-gray-50 rounded-xl'>
                        <img
                            className='h-16 w-16 rounded-full object-cover border-2 border-green-200'
                            src={generateCaptainAvatar(ride.captain)}
                            alt="Captain Avatar"
                            onError={(e) => {
                                e.target.src = generateCaptainAvatar({ fullname: { firstname: 'Captain' } })
                            }}
                        />
                        <div className='text-right'>
                            <h2 className='text-lg font-medium capitalize'>
                                {ride.captain?.fullname?.firstname || 'Your Captain'}
                            </h2>
                            <h4 className='text-xl font-semibold -mt-1'>
                                {ride.captain?.vehicle?.plate || 'Plate pending'}
                            </h4>
                            <p className='text-sm text-gray-600 capitalize'>
                                {vehicle.label} · {ride.captain?.vehicle?.color || 'Vehicle details in app'}
                            </p>
                            {ride.otp && (
                                <div className='mt-2 inline-block bg-green-100 px-3 py-1 rounded-full'>
                                    <span className='text-sm font-bold text-green-800 tracking-widest'>
                                        OTP {ride.otp}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className='w-full'>
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
                                <p className='text-sm -mt-1 text-gray-600'>Cash or Mobile Money</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='mt-4 flex gap-2'>
                    <button
                        type='button'
                        onClick={props.onMessage}
                        className='flex-1 rounded-lg bg-[#111] px-4 py-3 font-semibold text-white hover:bg-gray-800 transition-colors'
                    >
                        💬 Message Captain
                    </button>
                    <div className='flex-1 rounded-lg bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-800'>
                        📍 Waiting at pickup
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WaitingForDriver
