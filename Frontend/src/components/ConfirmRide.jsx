import React, { useState } from 'react'
import { formatFare } from '../lib/mapUtils'
import { vehicleConfig } from '../lib/vehicleTypes'

const ConfirmRide = (props) => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const vehicle = vehicleConfig(props.vehicleType)
    const fare = props.fare
    const methods = [
        { id: 'cash', label: 'Cash', icon: '💵' },
        { id: 'momo', label: 'Mobile Money', icon: '📱' },
    ]

    const confirm = async () => {
        setIsLoading(true)
        setError('')
        try {
            await props.createRide()
            props.setConfirmRidePanel(false)
            props.setVehicleFound(true)
        } catch (err) {
            setError(err.response?.data?.message || 'We could not create your ride. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className='h-full flex flex-col'>
            <h5 className='p-1 text-center w-[93%] absolute top-0 cursor-pointer' onClick={() => props.setConfirmRidePanel(false)}>
                <i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i>
            </h5>

            <h3 className='text-2xl font-semibold mb-1'>Confirm your YENKO Ride</h3>
            <p className='text-xs text-gray-500 mb-4'>One tap and your Captain is on the way.</p>

            <div className='flex-1 flex flex-col justify-between overflow-y-auto'>
                <div className='flex flex-col items-center'>
                    <img className='h-20' src={vehicle.icon} alt={`YENKO ${vehicle.label}`} />
                    <p className='mt-1 text-xs font-semibold text-gray-500'>
                        {vehicle.emoji} {vehicle.name} · {vehicle.seats} seat{vehicle.seats > 1 ? 's' : ''}
                    </p>

                    <div className='w-full mt-4'>
                        <div className='flex items-center gap-5 p-3 border-b'>
                            <i className="ri-map-pin-user-fill text-lg text-blue-600"></i>
                            <div>
                                <h3 className='text-base font-medium'>Pickup</h3>
                                <p className='text-sm text-gray-600'>{props.pickup}</p>
                            </div>
                        </div>
                        <div className='flex items-center gap-5 p-3 border-b'>
                            <i className="text-lg ri-map-pin-2-fill text-red-600"></i>
                            <div>
                                <h3 className='text-base font-medium'>Destination</h3>
                                <p className='text-sm text-gray-600'>{props.destination}</p>
                            </div>
                        </div>
                        <div className='flex items-center gap-5 p-3 border-b'>
                            <i className="ri-currency-line text-lg text-green-600"></i>
                            <div>
                                <h3 className='text-xl font-semibold'>{fare ? formatFare(fare.finalFare) : 'Fare unavailable'}</h3>
                                <p className='text-xs text-gray-500'>
                                    {fare ? `${fare.distanceKm} km · ~${fare.durationMin} min` : 'Please search again'}
                                </p>
                                {fare?.surgeFactor > 0 && (
                                    <span className='text-xs text-yellow-600 font-bold'>⚡ +{fare.surgeFactor}% demand pricing</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className='w-full mt-4'>
                        <p className='text-xs font-semibold text-gray-600 mb-2'>Pay with</p>
                        <div className='grid grid-cols-2 gap-2'>
                            {methods.map((method) => (
                                <button
                                    type='button'
                                    key={method.id}
                                    onClick={() => props.setPaymentMethod(method.id)}
                                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                        props.paymentMethod === method.id
                                            ? 'border-[#111] bg-[#111] text-white'
                                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {method.icon} {method.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {error && (
                    <p className='mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700'>{error}</p>
                )}

                <button
                    type='button'
                    onClick={confirm}
                    disabled={isLoading || !fare}
                    className={`w-full mt-4 font-semibold p-3 rounded-lg transition-all duration-200 flex justify-center items-center ${
                        isLoading || !fare
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                >
                    {isLoading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Finding your Captain…
                        </>
                    ) : (
                        'Confirm ride'
                    )}
                </button>
            </div>
        </div>
    )
}

export default ConfirmRide
