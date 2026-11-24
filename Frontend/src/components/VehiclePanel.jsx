import React from 'react'
import { formatFare } from '../lib/mapUtils'
import { RIDER_VEHICLE_ORDER, VEHICLE_TYPES } from '../lib/vehicleTypes'

const VehiclePanel = ({ setVehiclePanel, selectVehicle, fare, setConfirmRidePanel, selectedVehicle }) => {
    const isSurge = fare && fare.surgeMultiplier > 1

    return (
        <div className='h-full flex flex-col'>
            <h5 onClick={() => setVehiclePanel(false)} className='p-1 text-center absolute top-0 w-[93%] '><i className="ri-arrow-down-wide-fill text-3xl text-gray-200"></i></h5>
            <h3 className='text-2xl font-semibold mb-5'>Choose a Vehicle</h3>
            {isSurge && (
                <div className='mb-4 px-4 py-2 rounded-lg bg-yellow-50 border border-yellow-200 flex items-center gap-2'>
                    <span className='text-yellow-600 text-xs font-bold'>⚡ Surge Pricing</span>
                    <span className='text-yellow-700 text-xs'>+{fare.surgeFactor}% demand — {fare.surgeReason}</span>
                </div>
            )}
            <div className='flex-1 overflow-y-auto'>
                {RIDER_VEHICLE_ORDER.map((vt) => {
                    const cfg = VEHICLE_TYPES[vt]
                    const fareForVT = fare && fare.vehicleType === vt ? fare : null
                    const price = fareForVT ? fareForVT.finalFare : null
                    const basePrice = fareForVT ? fareForVT.baseFare : null
                    const isSelected = selectedVehicle === vt
                    return (
                        <div
                            key={vt}
                            onClick={() => {
                                selectVehicle(vt)
                                setConfirmRidePanel(true)
                                setVehiclePanel(false)
                            }}
                            className={`flex w-full items-center justify-between p-3 bg-white border-2 rounded-xl mb-2 cursor-pointer transition-all duration-200 ${
                                isSelected
                                    ? 'border-black shadow-md'
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }`}
                        >
                            <div className='flex items-center gap-3'>
                                <img className='h-12' src={cfg.icon} alt="" />
                                <div className='w-1/2 ml-2'>
                                    <h4 className='font-medium text-base flex items-center gap-1'>
                                        {cfg.emoji} {cfg.name} <span className='text-xs text-gray-500'><i className="ri-user-fill"></i>{cfg.seats}</span>
                                    </h4>
                                    <h5 className='font-medium text-sm'>{Math.floor(Math.random() * 3) + 2} mins away</h5>
                                    <p className='font-normal text-xs text-gray-600'>{cfg.desc}</p>
                                </div>
                            </div>
                            <div className='text-right'>
                                {price ? (
                                    <>
                                        <h2 className='text-lg font-semibold text-gray-900'>{formatFare(price)}</h2>
                                        {basePrice && price !== basePrice && (
                                            <div className='text-xs text-gray-500 line-through'>GH₵{basePrice}</div>
                                        )}
                                        {fareForVT && fareForVT.surgeFactor > 0 && (
                                            <div className='text-xs text-yellow-600 font-bold'>+{fareForVT.surgeFactor}%</div>
                                        )}
                                    </>
                                ) : (
                                    <h2 className='text-lg font-semibold text-gray-400'>--</h2>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default VehiclePanel
