import React from 'react'
import { Brand } from './YenkoShell'

/** Branded loading / retry state used by protected route wrappers. */
const AuthGateMessage = ({ title, message, onRetry }) => (
    <div className='flex min-h-screen flex-col items-center justify-center bg-[#f6f7f8] px-6 text-center'>
        <div className='mb-8 rounded-2xl bg-white px-4 py-3 shadow-md'>
            <Brand compact />
        </div>
        <h1 className='text-2xl font-black text-[#111]'>{title}</h1>
        <p className='mt-2 max-w-sm text-sm leading-relaxed text-gray-500'>{message}</p>
        {onRetry && (
            <button
                onClick={onRetry}
                className='mt-6 rounded-xl bg-[#f5c400] px-6 py-3 text-sm font-bold text-[#111] transition-colors hover:bg-[#e5b600]'
            >
                Retry connection
            </button>
        )}
        <p className='mt-10 text-[11px] uppercase tracking-[0.2em] text-gray-400'>YENKO RIDE · Ghana</p>
    </div>
)

export default AuthGateMessage
