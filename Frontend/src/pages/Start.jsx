import React from 'react'
import { Link } from 'react-router-dom'
import homepageCover from '../assets/homepage-cover.jpg'

const Start = () => {
  return (
    <div
      className='relative h-screen w-full bg-cover bg-center flex flex-col justify-between overflow-hidden'
      style={{ backgroundImage: `url(${homepageCover})` }}
    >
      {/* Dark overlay for a premium, readable hero */}
      <div className='absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/80' />

      <div className='relative z-10 px-6 pt-10 md:px-12'>
        <div className='inline-flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-xl backdrop-blur'>
          <span className='text-2xl font-black tracking-[0.2em] text-[#111]'>YENKO</span>
          <span className='h-6 w-px bg-gray-300' />
          <span className='text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500'>Ride · Ghana</span>
        </div>
      </div>

      <div className='relative z-10 bg-white px-6 py-8 md:px-12 md:py-10 rounded-t-3xl'>
        <div className='mx-auto max-w-md'>
          <div className='mb-4 inline-flex items-center gap-2 rounded-full bg-[#fff8dc] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8a6d00]'>
            <span className='h-2 w-2 rounded-full bg-[#f5c400]' /> Ghana&apos;s smartest ride
          </div>

          <h1 className='text-3xl md:text-4xl font-black leading-tight text-[#111]'>
            Move smarter.
            <br />
            <span className='text-[#f5c400]'>Ride YENKO.</span>
          </h1>

          <p className='mt-3 text-sm leading-relaxed text-gray-600'>
            Safe, affordable rides across Ghana. Book in seconds, track in real time, and pay
            however you want — all on one free app.
          </p>

          <div className='mt-5 flex flex-wrap gap-2'>
            {['Live Tracking', 'Mobile Money', 'SOS Safety', 'No Hidden Fees'].map((chip) => (
              <span key={chip} className='rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700'>
                {chip}
              </span>
            ))}
          </div>

          <Link
            to='/login'
            className='mt-7 flex items-center justify-center w-full rounded-xl bg-[#111] px-4 py-3.5 text-base font-bold text-white transition-colors hover:bg-gray-800'
          >
            Continue with YENKO
          </Link>

          <p className='mt-4 text-center text-[11px] text-gray-400'>
            YENKO RIDE · Built for Ghana · Powered by OpenStreetMap
          </p>
        </div>
      </div>
    </div>
  )
}

export default Start
