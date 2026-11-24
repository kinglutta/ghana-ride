import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { generateCaptainAvatar } from '../utils/avatarGenerator'
import RateRideModal from './RateRideModal'
import { formatFare } from '../lib/mapUtils'
import { getToken } from '../lib/authToken'
import { vehicleConfig } from '../lib/vehicleTypes'

const RideCompleted = ({ ride, onClose }) => {
    const navigate = useNavigate()
    const [isProcessingPayment, setIsProcessingPayment] = useState(false)
    const [showRating, setShowRating] = useState(false)
    const [notice, setNotice] = useState('')
    const vehicle = vehicleConfig(ride?.vehicleType || ride?.captain?.vehicle?.vehicleType)
    const rating = Number(ride?.captain?.rating || 0).toFixed(1)
    const isPaid = ride?.paymentStatus === 'paid'
    const isCash = ride?.paymentMethod === 'cash' || !ride?.paymentMethod

    const handlePayment = async () => {
        if (!ride?._id) {
            setNotice('Ride reference is unavailable. Pay from the Payments page.')
            return
        }

        setIsProcessingPayment(true)
        setNotice('')
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/payment/pay-ride`,
                { rideId: ride._id, method: 'wallet' },
                { headers: { Authorization: `Bearer ${getToken('rider')}` } }
            )
            setNotice(res.data.message || 'Ride paid from wallet.')
            setShowRating(true)
        } catch (err) {
            setNotice(err.response?.data?.message || 'Payment failed. Try the Payments page.')
        } finally {
            setIsProcessingPayment(false)
        }
    }

    const handlePayLater = () => {
        onClose()
        navigate(`/payment${ride?._id ? `?rideId=${ride._id}` : ''}`)
    }

    return (
        <div className='h-full flex flex-col bg-white'>
            <div className='p-6 bg-green-50 text-center border-b'>
                <div className='w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3'>
                    <i className="ri-check-line text-3xl text-white"></i>
                </div>
                <h2 className='text-2xl font-bold text-green-800'>Ride complete</h2>
                <p className='text-green-600 mt-1'>Thank you for riding YENKO</p>
            </div>

            <div className='flex-1 p-6 overflow-y-auto'>
                <div className='flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg'>
                    <div className='flex items-center gap-3'>
                        <img
                            className='h-16 w-16 rounded-full object-cover border-2 border-green-200'
                            src={generateCaptainAvatar(ride?.captain)}
                            alt="Captain Avatar"
                            onError={(e) => {
                                e.target.src = generateCaptainAvatar({ fullname: { firstname: 'Captain' } })
                            }}
                        />
                        <div>
                            <h3 className='text-lg font-medium capitalize'>
                                {ride?.captain?.fullname?.firstname || 'Your Captain'}
                            </h3>
                            <p className='text-sm text-gray-600 capitalize'>
                                {ride?.captain?.vehicle?.plate || 'Plate pending'} · {vehicle.label}
                            </p>
                            <div className='flex items-center mt-1'>
                                <span className='text-yellow-400'>★</span>
                                <span className='text-sm text-gray-600 ml-1'>{rating}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='space-y-4 mb-6'>
                    <div className='flex items-center gap-4 p-3 border-b'>
                        <i className="ri-map-pin-user-fill text-lg text-blue-600"></i>
                        <div className='flex-1'>
                            <h4 className='font-medium'>Pickup</h4>
                            <p className='text-sm text-gray-600'>{ride?.pickup || 'Pickup location'}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-4 p-3 border-b'>
                        <i className="ri-map-pin-2-fill text-lg text-red-600"></i>
                        <div className='flex-1'>
                            <h4 className='font-medium'>Destination</h4>
                            <p className='text-sm text-gray-600'>{ride?.destination || 'Destination'}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-4 p-3 border-b'>
                        <i className="ri-time-line text-lg text-gray-600"></i>
                        <div className='flex-1'>
                            <h4 className='font-medium'>Trip duration</h4>
                            <p className='text-sm text-gray-600'>
                                {ride?.duration ? `${Math.round(ride.duration / 60)} minutes` : '—'}
                            </p>
                        </div>
                    </div>
                    <div className='flex items-center gap-4 p-3'>
                        <i className="ri-map-line text-lg text-gray-600"></i>
                        <div className='flex-1'>
                            <h4 className='font-medium'>Distance</h4>
                            <p className='text-sm text-gray-600'>
                                {ride?.distance ? `${(ride.distance / 1000).toFixed(1)} km` : '—'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className='bg-gray-50 rounded-lg p-4 mb-4'>
                    <div className='flex justify-between font-semibold text-lg'>
                        <span>Total fare</span>
                        <span className='text-green-600'>{formatFare(ride?.fare)}</span>
                    </div>
                    <p className='text-xs text-gray-500 mt-1'>
                        {isCash ? 'Pay your Captain in cash' : 'Mobile Money or wallet payment'}
                        {isPaid ? ' · Paid' : ''}
                    </p>
                </div>
            </div>

            <div className='p-6 border-t bg-white'>
                <div className='space-y-3'>
                    {!isPaid && !isCash && (
                        <button
                            type='button'
                            onClick={handlePayment}
                            disabled={isProcessingPayment}
                            className={`w-full font-semibold py-4 rounded-lg text-lg transition-colors flex justify-center items-center ${
                                isProcessingPayment ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                        >
                            {isProcessingPayment ? 'Processing payment…' : `💳 Pay ${formatFare(ride?.fare)} from wallet`}
                        </button>
                    )}

                    {!isPaid && (
                        <button
                            type='button'
                            onClick={handlePayLater}
                            className='w-full font-semibold py-3 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors'
                        >
                            Pay with Mobile Money
                        </button>
                    )}

                    {notice && <p className='text-center text-xs font-semibold text-ink'>{notice}</p>}

                    {ride?._id && (
                        <button
                            type='button'
                            onClick={() => setShowRating(true)}
                            className='w-full rounded-lg border border-yenko py-3 text-sm font-bold text-ink'
                        >
                            ★ Rate your Captain
                        </button>
                    )}

                    <button
                        type='button'
                        onClick={onClose}
                        className='w-full py-3 text-sm font-semibold text-gray-600 hover:text-gray-800'
                    >
                        Back to home
                    </button>
                </div>
            </div>

            {showRating && (
                <RateRideModal
                    rideId={ride?._id}
                    onClose={() => setShowRating(false)}
                    onRated={() => setShowRating(false)}
                />
            )}
        </div>
    )
}

export default RideCompleted
