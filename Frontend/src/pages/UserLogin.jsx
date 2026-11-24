import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserDataContext } from '../context/UserContext'
import axios from 'axios'
import AuthShell, { authFieldClass, authLabelClass } from '../components/ui/AuthShell'

const UserLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { setUser } = useContext(UserDataContext)
  const navigate = useNavigate()

  const submitHandler = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/login`, {
        email,
        password,
      })

      if (response.status === 200) {
        setUser(response.data.user)
        localStorage.setItem('token', response.data.token)
        navigate('/home')
      }
    } catch (err) {
      setError(
        err.response?.status === 401
          ? 'Those details do not match a YENKO account. Please try again.'
          : 'We could not reach YENKO right now. Check your connection and retry.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow='Rider Sign In'
      title='Welcome back to YENKO.'
      subtitle='Your next ride across Ghana is only a few taps away.'
      footer={
        <div className='space-y-3'>
          <p className='text-center'>
            New to YENKO?{' '}
            <Link to='/signup' className='font-bold text-[#111] underline decoration-[#f5c400] decoration-2 underline-offset-4'>
              Create a rider account
            </Link>
          </p>
          <Link
            to='/captain-login'
            className='flex items-center justify-center rounded-xl bg-[#111] px-4 py-3 font-semibold text-white transition-colors hover:bg-gray-800'
          >
            Continue as a YENKO Captain →
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
          <label className={authLabelClass} htmlFor='rider-email'>Email address</label>
          <input
            id='rider-email'
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
          <label className={authLabelClass} htmlFor='rider-password'>Password</label>
          <input
            id='rider-password'
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
            isLoading ? 'cursor-not-allowed bg-gray-400' : 'bg-[#f5c400] text-[#111] hover:bg-[#e5b600]'
          }`}
        >
          {isLoading ? (
            <>
              <span className='mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-[#111]' />
              Signing you in…
            </>
          ) : (
            'Sign in to YENKO'
          )}
        </button>
      </form>
    </AuthShell>
  )
}

export default UserLogin
