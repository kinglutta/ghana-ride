import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { CaptainDataContext } from '../context/captain.context'
import AuthShell, { authFieldClass, authLabelClass } from '../components/ui/AuthShell'
import { setToken } from '../lib/authToken';
import { CAPTAIN_VEHICLE_ORDER, VEHICLE_TYPES } from '../lib/vehicleTypes';

const CaptainSignup = () => {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [vehicleColor, setVehicleColor] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [vehicleCapacity, setVehicleCapacity] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { setCaptain } = useContext(CaptainDataContext)

  const submitHandler = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/captains/register`, {
        fullname: { firstname: firstName, lastname: lastName },
        email,
        password,
        vehicle: {
          color: vehicleColor,
          plate: vehiclePlate,
          capacity: vehicleCapacity,
          vehicleType,
        },
      })

      if (response.status === 201) {
        setCaptain(response.data.captain)
        setToken('captain',  response.data.token)
        navigate('/captain-home')
      }
    } catch (err) {
      setError(
        err.response?.status === 400
          ? 'A captain account with these details already exists, or your information is invalid.'
          : 'We could not create your captain account right now. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow='Captain Registration'
      title='Drive with YENKO.'
      subtitle='Join Ghana’s smartest ride network. Set your own hours and earn with confidence.'
      footer={
        <div className='space-y-3 text-center'>
          <p>
            Already a captain?{' '}
            <Link to='/captain-login' className='font-bold text-[#111] underline decoration-[#f5c400] decoration-2 underline-offset-4'>
              Sign in here
            </Link>
          </p>
          <p className='text-xs leading-relaxed text-gray-400'>
            Captain verification can be submitted from your dashboard after registration.
          </p>
        </div>
      }
    >
      <form onSubmit={submitHandler} className='space-y-5'>
        {error && (
          <div className='rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700'>
            {error}
          </div>
        )}

        <fieldset className='space-y-5'>
          <legend className='mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gray-400'>Your details</legend>
          <div>
            <label className={authLabelClass} htmlFor='captain-name'>Full name</label>
            <div className='flex gap-3'>
              <input
                id='captain-name'
                required
                className={authFieldClass}
                type='text'
                autoComplete='given-name'
                placeholder='First name'
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                required
                aria-label='Last name'
                className={authFieldClass}
                type='text'
                autoComplete='family-name'
                placeholder='Last name'
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={authLabelClass} htmlFor='captain-signup-email'>Email address</label>
            <input
              id='captain-signup-email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authFieldClass}
              type='email'
              autoComplete='email'
              placeholder='captain@example.com'
            />
          </div>

          <div>
            <label className={authLabelClass} htmlFor='captain-signup-password'>Create a password</label>
            <input
              id='captain-signup-password'
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authFieldClass}
              type='password'
              autoComplete='new-password'
              placeholder='At least 8 characters'
            />
          </div>
        </fieldset>

        <fieldset className='space-y-5 border-t border-gray-100 pt-6'>
          <legend className='mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gray-400'>Vehicle information</legend>
          <div className='flex gap-3'>
            <input
              required
              aria-label='Vehicle colour'
              className={authFieldClass}
              type='text'
              placeholder='Vehicle colour'
              value={vehicleColor}
              onChange={(e) => setVehicleColor(e.target.value)}
            />
            <input
              required
              aria-label='Vehicle plate'
              className={authFieldClass}
              type='text'
              placeholder='Vehicle plate'
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value)}
            />
          </div>
          <div className='flex gap-3'>
            <input
              required
              aria-label='Vehicle capacity'
              className={authFieldClass}
              type='number'
              min='1'
              placeholder='Seats'
              value={vehicleCapacity}
              onChange={(e) => setVehicleCapacity(e.target.value)}
            />
            <select
              required
              aria-label='Vehicle type'
              className={authFieldClass}
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
            >
              <option value='' disabled>Select vehicle type</option>
              {CAPTAIN_VEHICLE_ORDER.map((id) => (
                <option key={id} value={id}>{VEHICLE_TYPES[id].label}</option>
              ))}
            </select>
          </div>
        </fieldset>

        <button
          type='submit'
          disabled={isLoading}
          className={`flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-base font-bold transition-all ${
            isLoading ? 'cursor-not-allowed bg-gray-400' : 'bg-[#111] text-white hover:bg-gray-800'
          }`}
        >
          {isLoading ? (
            <>
              <span className='mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white' />
              Creating captain account…
            </>
          ) : (
            'Create my Captain account'
          )}
        </button>
      </form>
    </AuthShell>
  )
}

export default CaptainSignup
