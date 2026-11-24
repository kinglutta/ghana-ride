import React from 'react'
import { formatFare } from '../lib/mapUtils'
import { RIDER_VEHICLE_ORDER, VEHICLE_TYPES } from '../lib/vehicleTypes'

const VehiclePanel = ({
    setVehiclePanel,
    selectVehicle,
    fares,
    loading,
    tripDistance,
    tripDuration,
    setConfirmRidePanel,
    selectedVehicle,
}) => {
    const isSurge = fares && fares.surgeMultiplier > 1

    // Deterministic arrival estimate: faster categories arrive sooner, with a
    // small spread by position so the numbers never jitter on re-render.
    const arrivalMinutes = (index) => 2 + Math.floor(index / 3)

    return (
        <div className='h-full flex flex-col'>
            <h5 onClick={() => setVehiclePanel(false)} className='p-1 text-center absolute top-0 w-[93%] cursor-pointer'>
                <i className="ri-arrow-down-wide-fill text-3xl text-gray-200"></i>
            </h5>
            <h3 className='text-2xl font-semibold mb-1'>Choose your YENKO ride</h3>
            <p className='text-xs text-gray-500 mb-4'>
                {tripDistance ? `${tripDistance} km · ~${tripDuration} min trip` : 'Live fares for your trip'}
            </p>

            {isSurge && (
                <div className='mb-3 px-4 py-2 rounded-lg bg-yellow-50 border border-yellow-200 flex items-center gap-2'>
                    <span className='text-yellow-600 text-xs font-bold'>⚡ Higher demand</span>
                    <span className='text-yellow-700 text-xs'>+{fares.surgeFactor}% · {fares.surgeReason}</span>
                </div>
            )}

            {loading && (
                <div className='mb-3 text-sm text-gray-500'>Refreshing live fares…</div>
            )}

            <div className='flex-1 overflow-y-auto pb-2'>
                {RIDER_VEHICLE_ORDER.map((type, index) => {
                    const cfg = VEHICLE_TYPES[type]
                    const quote = fares?.fares?.[type] || null
                    const isSelected = selectedVehicle === type

                    return (
                        <button
                            type='button'
                            key={type}
                            onClick={() => {
                                if (!quote) return
                                selectVehicle(type)
                                setConfirmRidePanel(true)
                                setVehiclePanel(false)
                            }}
                            disabled={!quote}
                            className={`w-full flex items-center justify-between p-3 bg-white border-2 rounded-xl mb-2 text-left transition-all duration-200 ${
                                isSelected
                                    ? 'border-[#111] shadow-md'
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            } ${!quote ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <div className='flex items-center gap-3'>
                                <img className='h-12 w-14 object-contain' src={cfg.icon} alt={`YENKO ${cfg.label}`} />
                                <div>
                                    <h4 className='font-semibold text-base flex items-center gap-1'>
                                        {cfg.emoji} {cfg.name}
                                        <span className='text-xs text-gray-500 ml-1'><i className="ri-user-fill"></i>{cfg.seats}</span>
                                    </h4>
                                    <h5 className='text-xs text-gray-500'>{arrivalMinutes(index)} mins away</h5>
                                    <p className='text-xs text-gray-600'>{cfg.desc}</p>
                                </div>
                            </div>
                            <div className='text-right shrink-0'>
                                <h2 className='text-lg font-semibold text-gray-900'>
                                    {quote ? formatFare(quote.finalFare) : '—'}
                                </h2>
                                {quote && quote.baseFare < quote.finalFare && (
                                    <div className='text-xs text-gray-400 line-through'>GH₵{quote.baseFare}</div>
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export default VehiclePanel
