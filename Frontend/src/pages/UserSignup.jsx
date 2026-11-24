import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { UserDataContext } from '../context/user.context'
import AuthShell, { authFieldClass, authLabelClass } from '../components/ui/AuthShell'
import { setToken } from '../lib/authToken';

const UserSignup = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const navigate = useNavigate()
  const { setUser } = useContext(UserDataContext)

  const submitHandler = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/register`, {
        fullname: { firstname: firstName, lastname: lastName },
        email,
        password,
      })

      if (response.status === 201) {
        setUser(response.data.user)
        setToken('rider',  response.data.token)
        navigate('/home')
      }
    } catch (err) {
      setError(
        err.response?.status === 400
          ? 'An account with these details already exists, or your information is invalid.'
          : 'We could not create your account right now. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow='Rider Registration'
      title='Join the YENKO movement.'
      subtitle='Create your rider account and discover a smarter way to move in Ghana.'
      footer={
        <div className='space-y-3 text-center'>
          <p>
            Already riding with YENKO?{' '}
            <Link to='/login' className='font-bold text-[#111] underline decoration-[#f5c400] decoration-2 underline-offset-4'>
              Sign in here
            </Link>
          </p>
          <p className='text-xs leading-relaxed text-gray-400'>
            YENKO RIDE uses secure token-based sessions and open-source maps. No paid map APIs, no hidden tracking fees.
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

        <div>
          <label className={authLabelClass} htmlFor='signup-name'>Your full name</label>
          <div className='flex gap-3'>
            <input
              id='signup-name'
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
          <label className={authLabelClass} htmlFor='signup-email'>Email address</label>
          <input
            id='signup-email'
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authFieldClass}
            type='email'
            autoComplete='email'
            placeholder='you@example.com'
          />
        </div>

        <div>
          <label className={authLabelClass} htmlFor='signup-password'>Create a password</label>
          <input
            id='signup-password'
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authFieldClass}
            type='password'
            autoComplete='new-password'
            placeholder='At least 8 characters'
          />
        </div>

        <button
          type='submit'
          disabled={isLoading}
          className={`flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-base font-bold transition-all ${
            isLoading ? 'cursor-not-allowed bg-gray-400' : 'bg-[#f5c400] text-[#111] hover:bg-[#e5b600]'
          }`}
        >
          {isLoading ? (
            <>
              <span className='mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-[#111]' />
              Creating your account…
            </>
          ) : (
            'Create my YENKO account'
          )}
        </button>
      </form>
    </AuthShell>
  )
}

export default UserSignup
