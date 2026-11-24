/**
 * CustomButton — reusable button component adapted from adrianhajdin/uber patterns.
 * Styled with Tailwind. Works on web (React + Vite).
 */

import React from 'react';

const getBgVariant = (variant) => {
    switch (variant) {
        case 'secondary':
            return 'bg-gray-200 text-gray-900 hover:bg-gray-300';
        case 'danger':
            return 'bg-red-600 text-white hover:bg-red-700';
        case 'success':
            return 'bg-green-600 text-white hover:bg-green-700';
        case 'outline':
            return 'border-2 border-gray-300 bg-transparent text-gray-900 hover:bg-gray-50';
        default:
            return 'bg-black text-white hover:bg-gray-800';
    }
};

const getTextVariant = (variant) => {
    switch (variant) {
        case 'primary':
            return 'text-black';
        case 'secondary':
            return 'text-gray-100';
        case 'danger':
            return 'text-red-100';
        case 'success':
            return 'text-green-100';
        default:
            return 'text-white';
    }
};

const CustomButton = ({
    onPress,
    title,
    bgVariant = 'primary',
    textVariant = 'default',
    className = '',
    disabled = false,
    children,
    ...props
}) => {
    // `loading` is a UI-state prop used by callers; never forward it to <button>.
    delete props.loading;
    return (
        <button
            onClick={onPress}
            disabled={disabled}
            className={
                `w-full rounded-full p-3 flex flex-row justify-center items-center shadow-md ${getBgVariant(bgVariant)} ${className}`
            }
            {...props}
        >
            {children || (
                <span className={`font-bold ${getTextVariant(textVariant)}`}>
                    {title}
                </span>
            )}
        </button>
    );
};

export default CustomButton;
