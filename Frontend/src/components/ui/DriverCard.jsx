/**
 * DriverCard — YENKO captain selection card.
 * Shows driver photo, rating, fare, ETA, and car seats. Web-optimized (React + Tailwind).
 */

import React from 'react';

const DriverCard = ({
    item,
    selected = false,
    onSelect,
}) => {
    const driverName = `${item.firstname || item.firstName || 'Driver'}`;
    const rating = item.rating || 5;
    const price = item.price || item.fare || 0;
    const time = item.time || item.eta || 5;
    const seats = item.capacity || item.car_seats || 4;
    const imageUrl = item.profile_image_url || '/assets/driver-logo.svg';

    return (
        <button
            onClick={() => onSelect && onSelect(item)}
            className={`flex flex-row items-center justify-between py-4 px-4 rounded-2xl border transition-all ${
                selected
                    ? 'bg-blue-50 border-blue-200 shadow-sm'
                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-md'
            }`}
        >
            <div className="flex flex-row items-center gap-4 flex-1">
                <img
                    src={imageUrl}
                    alt="Driver"
                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                />
                <div className="flex-1">
                    <div className="flex flex-row items-center justify-between">
                        <h3 className="font-semibold text-gray-900">{driverName}</h3>
                        <div className="flex items-center gap-1">
                            <svg
                                className="w-4 h-4 fill-yellow-400"
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.416 3.967 1.481-8.279-6.064-5.828 8.332-1.151z" />
                            </svg>
                            <span className="font-bold text-yellow-600">{rating}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <span>{seats} seats</span>
                        <span>•</span>
                        <span>{time} min away</span>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <div className="text-lg font-bold text-black">{`GH₵${price}`}</div>
                <div className="text-xs text-gray-500">fare</div>
            </div>
        </button>
    );
};

export default DriverCard;
