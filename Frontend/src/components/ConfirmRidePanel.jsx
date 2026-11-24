import React from 'react'
import { formatFare } from '../lib/mapUtils'
import { VEHICLE_TYPES } from '../lib/vehicleTypes'

const ConfirmRidePanel = ({ selectedVehicle, fare, setConfirmRidePanel, setVehiclePanel, selectedLocation, pickup, destination, setLookingForDriver }) => {

    const getVehicleDetails = () => {
        const config = VEHICLE_TYPES[selectedVehicle]
        if (!config) return null

        return {
            image: config.icon,
            name: config.name,
            capacity: config.seats,
            time: '2 mins away',
            price: fare?.finalFare ? formatFare(fare.finalFare) : 'See fare',
            description: config.desc,
        }
    }

    const vehicleDetails = getVehicleDetails()

    if (!vehicleDetails) return null

    return (
        <div>
            <h5
                onClick={() => {
                    setConfirmRidePanel(false)
                    setVehiclePanel(true)
                }}
                className='p-1 text-center absolute top-0 w-[93%] cursor-pointer'
            >
                <i className="ri-arrow-down-wide-fill text-3xl text-gray-200"></i>
            </h5>

            <h3 className='text-2xl font-semibold mb-5'>Confirm your YENKO Ride</h3>

            <div className='flex w-full items-center justify-between p-3 bg-white border-2 border-black rounded-xl mb-4'>
                <img className='h-12' src={vehicleDetails.image} alt="" />
                <div className='w-1/2 ml-2'>
                    <h4 className='font-medium text-base'>
                        {vehicleDetails.name} <span><i className="ri-user-fill"></i>{vehicleDetails.capacity}</span>
                    </h4>
                    <h5 className='font-medium text-sm'>{vehicleDetails.time}</h5>
                    <p className='font-normal text-xs text-gray-600'>{vehicleDetails.description}</p>
                </div>
                <h2 className='text-lg font-semibold'>{vehicleDetails.price}</h2>
            </div>

            <div className='w-full mt-5'>
                <div className='flex items-center gap-5 p-3 border-b-2 border-gray-100'>
                    <i className="ri-map-pin-user-fill text-lg"></i>
                    <div>
                        <h3 className='text-lg font-medium'>{pickup || 'Current Location'}</h3>
                        <p className='text-sm -mt-1 text-gray-600'>Pickup Location</p>
                    </div>
                </div>
                <div className='flex items-center gap-5 p-3 border-b-2 border-gray-100'>
                    <i className="ri-map-pin-2-fill text-lg"></i>
                    <div>
                        <h3 className='text-lg font-medium'>{selectedLocation?.address || destination || 'Select Destination'}</h3>
                        <p className='text-sm -mt-1 text-gray-600'>{selectedLocation?.fullAddress || 'Destination Location'}</p>
                    </div>
                </div>
                <div className='flex items-center gap-5 p-3'>
                    <i className="ri-currency-line text-lg"></i>
                    <div>
                        <h3 className='text-lg font-medium'>{vehicleDetails.price}</h3>
                        <p className='text-sm -mt-1 text-gray-600'>Cash or Mobile Money</p>
                    </div>
                </div>
            </div>

            <button
                className='w-full mt-5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-4 py-3 transition-colors duration-200'
                onClick={() => {
                    // Hide confirm panel and show looking for driver
                    setConfirmRidePanel(false)
                    setLookingForDriver(true)
                }}
            >
                Confirm Ride
            </button>
        </div>
    )
}

export default ConfirmRidePanel
