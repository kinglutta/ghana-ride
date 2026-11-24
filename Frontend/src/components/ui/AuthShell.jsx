/**
 * YENKO RIDE auth layout.
 * One premium, consistent shell for rider and captain login/signup screens.
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { Brand } from './YenkoShell'

export const authFieldClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-[#f5c400] focus:bg-white focus:ring-4 focus:ring-yellow-50 placeholder:text-gray-400'

export const authLabelClass = 'mb-2 block text-sm font-semibold text-gray-800'

export const AuthShell = ({ eyebrow, title, subtitle, children, footer }) => (
    <div className='min-h-screen bg-[#f6f7f8] flex flex-col'>
        <header className='bg-white border-b border-gray-200'>
            <div className='mx-auto flex h-20 max-w-6xl items-center justify-between px-5 md:px-8'>
                <Link to='/' aria-label='YENKO RIDE home'>
                    <Brand compact />
                </Link>
                <span className='rounded-full bg-[#fff8dc] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a6d00]'>
                    {eyebrow}
                </span>
            </div>
            <div className='h-[3px] bg-gradient-to-r from-[#f5c400] via-[#111111] to-transparent' />
        </header>

        <main className='flex flex-1 items-center justify-center px-4 py-10'>
            <div className='w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/60 md:p-9'>
                <div className='mb-7'>
                    <div className='mb-4 inline-flex items-center gap-2'>
                        <span className='h-2.5 w-2.5 rounded-full bg-[#f5c400]' />
                        <span className='text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400'>
                            YENKO RIDE · Ghana
                        </span>
                    </div>
                    <h1 className='text-2xl font-black leading-tight text-[#111] md:text-3xl'>{title}</h1>
                    <p className='mt-2 text-sm leading-relaxed text-gray-500'>{subtitle}</p>
                </div>

                {children}

                {footer && (
                    <div className='mt-7 border-t border-gray-100 pt-5 text-sm text-gray-600'>{footer}</div>
                )}
            </div>
        </main>

        <footer className='border-t border-gray-200 bg-white px-5 py-4 text-center text-[11px] text-gray-400'>
            YENKO RIDE · Move smarter, Ghana · Powered by OpenStreetMap
        </footer>
    </div>
)

export default AuthShell
