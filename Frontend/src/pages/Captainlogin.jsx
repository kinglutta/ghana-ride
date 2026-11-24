import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { CaptainDataContext } from '../context/CaptainContext'
import AuthShell, { authFieldClass, authLabelClass } from '../components/ui/AuthShell'

const Captainlogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { setCaptain } = useContext(CaptainDataContext)
  const navigate = useNavigate()

  const submitHandler = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/captains/login`, {
        email,
        password,
      })

      if (response.status === 200) {
        setCaptain(response.data.captain)
        localStorage.setItem('token', response.data.token)
        navigate('/captain-home')
      }
    } catch (err) {
      setError(
        err.response?.status === 401
          ? 'Those captain credentials were not recognised. Please try again.'
          : 'We could not reach YENKO right now. Check your connection and retry.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow='Captain Sign In'
      title='Captain, welcome back.'
      subtitle='Go online, receive YENKO ride requests, and earn on your own schedule.'
      footer={
        <div className='space-y-3'>
          <p className='text-center'>
            New to the fleet?{' '}
            <Link to='/captain-signup' className='font-bold text-[#111] underline decoration-[#f5c400] decoration-2 underline-offset-4'>
              Register as a Captain
            </Link>
          </p>
          <Link
            to='/login'
            className='flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50'
          >
            ← Rider sign in
          </Link>
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
          <label className={authLabelClass} htmlFor='captain-email'>Email address</label>
          <input
            id='captain-email'
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
          <label className={authLabelClass} htmlFor='captain-password'>Password</label>
          <input
            id='captain-password'
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authFieldClass}
            type='password'
            autoComplete='current-password'
            placeholder='Enter your password'
          />
        </div>

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
              Signing you in…
            </>
          ) : (
            'Sign in to Captain mode'
          )}
        </button>
      </form>
    </AuthShell>
  )
}

export default Captainlogin
