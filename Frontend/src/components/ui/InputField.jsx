/**
 * InputField — reusable input component adapted from adrianhajdin/uber patterns.
 * Styled with Tailwind for React web.
 */

import React from 'react';

const InputField = ({
    label,
    icon,
    secureTextEntry = false,
    labelStyle,
    containerStyle,
    inputStyle,
    className = '',
    ...props
}) => {
    return (
        <div className={`w-full mb-4 ${className}`}>
            {label && (
                <label
                    className={`block text-sm font-semibold mb-1 ${labelStyle || ''}`}
                >
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {icon}
                    </div>
                )}
                <input
                    type={secureTextEntry ? 'password' : 'text'}
                    className={
                        `w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-full focus:ring-2 focus:ring-black focus:border-transparent outline-none text-sm transition-all ${inputStyle || ''}`
                    }
                    {...props}
                />
            </div>
        </div>
    );
};

export default InputField;
