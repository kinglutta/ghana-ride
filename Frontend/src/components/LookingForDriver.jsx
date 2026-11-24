import React from 'react'
import { formatFare } from '../lib/mapUtils'
import { vehicleConfig } from '../lib/vehicleTypes'

const LookingForDriver = (props) => {
    const vehicle = vehicleConfig(props.vehicleType)

    return (
        <div className='h-full flex flex-col'>
            <h5 className='p-1 text-center w-[93%] absolute top-0 cursor-pointer' onClick={props.onCancel}>
                <i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i>
            </h5>

            <h3 className='text-2xl font-semibold mb-1'>
                {props.noCaptains ? 'Still looking for your Captain' : 'Finding your YENKO Captain'}
            </h3>
            <p className='text-xs text-gray-500 mb-4'>
                {props.noCaptains
                    ? 'We are expanding the search area. You can keep waiting or cancel.'
                    : 'Your request is live with nearby verified Captains.'}
            </p>

            <div className='flex-1 flex flex-col justify-between overflow-y-auto'>
                <div>
                    <div className='flex flex-col items-center mb-5'>
                        <img className='h-20' src={vehicle.icon} alt={`YENKO ${vehicle.label}`} />
                        <p className='mt-1 text-xs font-semibold text-gray-500'>{vehicle.emoji} {vehicle.name}</p>

                        <div className='mt-4 flex space-x-1'>
                            <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
                            <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '0.1s' }}></div>
                            <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <p className='text-gray-600 text-sm mt-2'>Searching nearby YENKO Captains…</p>
                    </div>

                    <div className='w-full'>
                        <div className='flex items-center gap-5 p-3 border-b-2'>
                            <i className="ri-map-pin-user-fill text-lg text-blue-600"></i>
                            <div>
                                <h3 className='text-base font-medium'>Pickup</h3>
                                <p className='text-sm text-gray-600'>{props.pickup}</p>
                            </div>
                        </div>
                        <div className='flex items-center gap-5 p-3 border-b-2'>
                            <i className="text-lg ri-map-pin-2-fill text-red-600"></i>
                            <div>
                                <h3 className='text-base font-medium'>Destination</h3>
                                <p className='text-sm text-gray-600'>{props.destination}</p>
                            </div>
                        </div>
                        <div className='flex items-center gap-5 p-3'>
                            <i className="ri-currency-line text-lg text-green-600"></i>
                            <div>
                                <h3 className='text-lg font-semibold'>
                                    {props.fare ? formatFare(props.fare.finalFare) : 'GH₵—'}
                                </h3>
                                <p className='text-sm -mt-1 text-gray-600'>Cash or Mobile Money</p>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    type='button'
                    onClick={props.onCancel}
                    className='w-full mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700 hover:bg-red-100 transition-colors'
                >
                    Cancel request
                </button>
            </div>
        </div>
    )
}

export default LookingForDriver
