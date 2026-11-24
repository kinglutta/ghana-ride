/**
 * YENKO Onboarding — one professional entry point for every role.
 *
 * Riders and Captains choose their lane and sign in or create an account.
 * Operations accounts are invite-only: the access code is checked by the API.
 */
import React, { useContext, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { UserDataContext } from '../context/user.context'
import { CaptainDataContext } from '../context/captain.context'
import { Brand } from '../components/ui/YenkoShell'
import { authFieldClass, authLabelClass } from '../components/ui/AuthShell'
import { setToken } from '../lib/authToken'
import usePageTitle from '../hooks/usePageTitle'

const ROLES = [
    {
        id: 'rider',
        icon: '🧍',
        name: 'Rider',
        tagline: 'Move around Ghana',
        detail: 'Book a ride, track it live and pay your way.',
    },
    {
        id: 'captain',
        icon: '🚙',
        name: 'Captain',
        tagline: 'Drive and earn',
        detail: 'Go online, accept rides and grow your earnings.',
    },
    {
        id: 'admin',
        icon: '🛡️',
        name: 'Operations',
        tagline: 'Command the fleet',
        detail: 'Safety, verification, payouts and live operations.',
        gated: true,
    },
]

const COPY = {
    rider: {
        signin: {
            eyebrow: 'Rider sign in',
            title: 'Welcome back to YENKO.',
            subtitle: 'Your next ride across Ghana is one sign in away.',
            button: 'Sign in to YENKO',
        },
        signup: {
            eyebrow: 'Rider registration',
            title: 'Ride smarter with YENKO.',
            subtitle: 'Create your rider account in under a minute.',
            button: 'Create my rider account',
        },
    },
    captain: {
        signin: {
            eyebrow: 'Captain sign in',
            title: 'Captain, welcome back.',
            subtitle: 'Go online and start earning on your own schedule.',
            button: 'Sign in to Captain mode',
        },
        signup: {
            eyebrow: 'Captain registration',
            title: 'Drive with YENKO.',
            subtitle: 'Join Ghana’s smartest ride network. Verification comes after signup.',
            button: 'Create my Captain account',
        },
    },
    admin: {
        signin: {
            eyebrow: 'Operations sign in',
            title: 'Command your fleet.',
            subtitle: 'Your invite code is only needed when creating an operations account.',
            button: 'Open the command centre',
        },
        signup: {
            eyebrow: 'Invite-only onboarding',
            title: 'Join YENKO Operations.',
            subtitle: 'Enter the access code issued by your YENKO operations lead.',
            button: 'Create operations account',
        },
    },
}

const emptyForm = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    adminCode: '',
    vehicleColor: '',
    vehiclePlate: '',
    vehicleCapacity: '',
    vehicleType: 'car',
}

/** Turns API errors into calm, human language. */
const readableError = (err) => {
    const message = err.response?.data?.message || ''
    const validation = err.response?.data?.errors

    if (err.response?.status === 403 && /admin access code/i.test(message)) {
        return 'That operations access code was not accepted. Check it with your YENKO lead and try again.'
    }
    if (Array.isArray(validation) && validation.length) {
        return validation[0].msg || 'Please check the details you entered.'
    }
    if (message) return message
    return 'We could not reach YENKO right now. Check your connection and try again.'
}

const Onboarding = () => {
    const [params, setParams] = useSearchParams()
    const navigate = useNavigate()
    const { setUser } = useContext(UserDataContext)
    const { setCaptain } = useContext(CaptainDataContext)

    const requestedRole = ROLES.some((item) => item.id === params.get('role')) ? params.get('role') : 'rider'
    const requestedMode = params.get('mode') === 'signin' ? 'signin' : 'signup'

    const [role, setRole] = useState(requestedRole)
    const [mode, setMode] = useState(requestedMode)
    const [form, setForm] = useState(emptyForm)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const copy = COPY[role][mode]
    const activeRole = ROLES.find((item) => item.id === role)

    usePageTitle(`${mode === 'signin' ? 'Sign In' : 'Join YENKO'} · ${activeRole.name}`)

    useEffect(() => {
        setRole(requestedRole)
        setMode(requestedMode)
    }, [requestedRole, requestedMode])

    useEffect(() => {
        setError('')
    }, [role, mode])

    const chooseRole = (nextRole) => {
        setRole(nextRole)
        setParams({ role: nextRole, mode })
    }

    const chooseMode = (nextMode) => {
        setMode(nextMode)
        setParams({ role, mode: nextMode })
    }

    const update = (field) => (event) => {
        setForm((current) => ({ ...current, [field]: event.target.value }))
    }

    const signIn = async () => {
        const isCaptain = role === 'captain'
        const response = await axios.post(`${import.meta.env.VITE_API_URL}${isCaptain ? '/captains/login' : '/users/login'}`, {
            email: form.email,
            password: form.password,
        })

        if (isCaptain) {
            setCaptain(response.data.captain)
            setToken('captain', response.data.token)
            navigate('/captain-home')
            return
        }

        const account = response.data.user || {}
        const isAdmin = account.role === 'admin'

        if (role === 'admin' && !isAdmin) {
            setError('This account is not an operations account. Please switch to Rider sign in.')
            return
        }

        setUser(account)
        setToken(role === 'admin' ? 'admin' : 'rider', response.data.token)
        navigate(role === 'admin' ? '/admin' : '/rider')
    }

    const registerRiderOrAdmin = async () => {
        const isAdmin = role === 'admin'
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/register`, {
            fullname: { firstname: form.firstName, lastname: form.lastName },
            email: form.email,
            password: form.password,
            role: isAdmin ? 'admin' : 'rider',
            ...(isAdmin ? { adminCode: form.adminCode.trim() } : {}),
        })

        setUser(response.data.user)
        setToken(isAdmin ? 'admin' : 'rider', response.data.token)
        navigate(isAdmin ? '/admin' : '/rider')
    }

    const registerCaptain = async () => {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/captains/register`, {
            fullname: { firstname: form.firstName, lastname: form.lastName },
            email: form.email,
            password: form.password,
            vehicle: {
                color: form.vehicleColor,
                plate: form.vehiclePlate,
                capacity: form.vehicleCapacity,
                vehicleType: form.vehicleType,
            },
        })

        setCaptain(response.data.captain)
        setToken('captain', response.data.token)
        navigate('/captain-home')
    }

    const submitHandler = async (event) => {
        event.preventDefault()
        setLoading(true)
        setError('')

        try {
            if (mode === 'signin') await signIn()
            else if (role === 'captain') await registerCaptain()
            else await registerRiderOrAdmin()
        } catch (err) {
            setError(readableError(err))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='flex min-h-screen flex-col bg-[#f6f7f8]'>
            <header className='border-b border-gray-200 bg-white'>
                <div className='mx-auto flex h-20 max-w-6xl items-center justify-between px-5 md:px-8'>
                    <Link to='/' aria-label='YENKO RIDE home'>
                        <Brand compact />
                    </Link>
                    <span className='rounded-full bg-[#fff8dc] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a6d00]'>
                        One entry · Three roles
                    </span>
                </div>
                <div className='h-[3px] bg-gradient-to-r from-[#f5c400] via-[#111111] to-transparent' />
            </header>

            <main className='flex flex-1 items-start justify-center px-4 py-8 md:items-center md:py-12'>
                <div className='grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]'>
                    <section className='relative overflow-hidden rounded-3xl bg-[#111] p-6 text-white shadow-2xl md:p-9'>
                        <div className='absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#f5c400]/10 blur-3xl' />
                        <div className='absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#f5c400]/5 blur-3xl' />

                        <div className='relative'>
                            <div className='inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70'>
                                <span className='h-2 w-2 rounded-full bg-[#f5c400]' />
                                Step 01 · Choose your lane
                            </div>
                            <h1 className='mt-5 text-3xl font-black leading-tight md:text-5xl'>
                                One door.
                                <br />
                                <span className='text-[#f5c400]'>Your YENKO.</span>
                            </h1>
                            <p className='mt-4 max-w-md text-sm leading-relaxed text-white/60'>
                                Whether you ride, drive or run operations, start here. We will take you straight to the right dashboard.
                            </p>

                            <div className='mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1'>
                                {ROLES.map((item) => {
                                    const selected = item.id === role
                                    return (
                                        <button
                                            key={item.id}
                                            type='button'
                                            onClick={() => chooseRole(item.id)}
                                            aria-pressed={selected}
                                            className={`group flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                                                selected
                                                    ? 'border-[#f5c400] bg-[#f5c400] text-[#111] shadow-lg'
                                                    : 'border-white/10 bg-white/5 text-white hover:border-white/30 hover:bg-white/10'
                                            }`}
                                        >
                                            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${selected ? 'bg-[#111] text-[#f5c400]' : 'bg-white/10'}`}>
                                                {item.icon}
                                            </span>
                                            <span className='min-w-0 flex-1'>
                                                <span className='flex items-center gap-2'>
                                                    <span className='text-sm font-black'>{item.name}</span>
                                                    {item.gated && (
                                                        <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${selected ? 'bg-[#111]/10' : 'bg-white/10 text-white/60'}`}>
                                                            Invite only
                                                        </span>
                                                    )}
                                                </span>
                                                <span className={`mt-0.5 block text-xs ${selected ? 'text-[#111]/70' : 'text-white/50'}`}>
                                                    {item.tagline}
                                                </span>
                                            </span>
                                            <span className={`text-lg ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>→</span>
                                        </button>
                                    )
                                })}
                            </div>

                            <p className='mt-6 text-xs leading-relaxed text-white/40'>
                                {activeRole.detail}
                            </p>

                            <div className='mt-8 grid grid-cols-3 gap-2 border-t border-white/10 pt-6 text-center'>
                                {[
                                    ['Free maps', 'OpenStreetMap'],
                                    ['Live rides', 'Socket.IO'],
                                    ['Safety first', 'SOS alerts'],
                                ].map(([title, caption]) => (
                                    <div key={title}>
                                        <p className='text-[11px] font-bold text-[#f5c400]'>{title}</p>
                                        <p className='mt-1 text-[9px] uppercase tracking-wider text-white/40'>{caption}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className='rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/60 md:p-9'>
                        <div className='mb-7'>
                            <div className='inline-flex items-center gap-2'>
                                <span className='h-2.5 w-2.5 rounded-full bg-[#f5c400]' />
                                <span className='text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400'>
                                    Step 02 · {copy.eyebrow}
                                </span>
                            </div>

                            <div className='mt-5 flex rounded-xl bg-gray-100 p-1'>
                                {[
                                    ['signin', 'Sign in'],
                                    ['signup', 'Create account'],
                                ].map(([value, label]) => (
                                    <button
                                        key={value}
                                        type='button'
                                        onClick={() => chooseMode(value)}
                                        className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                                            mode === value ? 'bg-white text-[#111] shadow-sm' : 'text-gray-500 hover:text-[#111]'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <h2 className='mt-6 text-2xl font-black leading-tight text-[#111] md:text-3xl'>{copy.title}</h2>
                            <p className='mt-2 text-sm leading-relaxed text-gray-500'>{copy.subtitle}</p>
                        </div>

                        <form onSubmit={submitHandler} className='space-y-5'>
                            {error && (
                                <div className='rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700'>
                                    {error}
                                </div>
                            )}

                            {mode === 'signup' && (
                                <div>
                                    <label className={authLabelClass} htmlFor='onboarding-name'>Full name</label>
                                    <div className='flex gap-3'>
                                        <input
                                            id='onboarding-name'
                                            required
                                            className={authFieldClass}
                                            type='text'
                                            autoComplete='given-name'
                                            placeholder='First name'
                                            value={form.firstName}
                                            onChange={update('firstName')}
                                        />
                                        <input
                                            required
                                            aria-label='Last name'
                                            className={authFieldClass}
                                            type='text'
                                            autoComplete='family-name'
                                            placeholder='Last name'
                                            value={form.lastName}
                                            onChange={update('lastName')}
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className={authLabelClass} htmlFor='onboarding-email'>Email address</label>
                                <input
                                    id='onboarding-email'
                                    required
                                    className={authFieldClass}
                                    type='email'
                                    autoComplete='email'
                                    placeholder={role === 'captain' ? 'captain@example.com' : 'you@example.com'}
                                    value={form.email}
                                    onChange={update('email')}
                                />
                            </div>

                            <div>
                                <label className={authLabelClass} htmlFor='onboarding-password'>Password</label>
                                <input
                                    id='onboarding-password'
                                    required
                                    className={authFieldClass}
                                    type='password'
                                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                                    placeholder={mode === 'signin' ? 'Enter your password' : 'At least 6 characters'}
                                    value={form.password}
                                    onChange={update('password')}
                                />
                            </div>

                            {mode === 'signup' && role === 'captain' && (
                                <fieldset className='space-y-4 border-t border-gray-100 pt-6'>
                                    <legend className='text-xs font-bold uppercase tracking-[0.2em] text-gray-400'>
                                        Vehicle information
                                    </legend>
                                    <div className='flex gap-3'>
                                        <input
                                            required
                                            aria-label='Vehicle colour'
                                            className={authFieldClass}
                                            type='text'
                                            placeholder='Colour'
                                            value={form.vehicleColor}
                                            onChange={update('vehicleColor')}
                                        />
                                        <input
                                            required
                                            aria-label='Vehicle plate'
                                            className={authFieldClass}
                                            type='text'
                                            placeholder='Plate'
                                            value={form.vehiclePlate}
                                            onChange={update('vehiclePlate')}
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
                                            value={form.vehicleCapacity}
                                            onChange={update('vehicleCapacity')}
                                        />
                                        <select
                                            required
                                            aria-label='Vehicle type'
                                            className={authFieldClass}
                                            value={form.vehicleType}
                                            onChange={update('vehicleType')}
                                        >
                                            <option value='car'>Car</option>
                                            <option value='auto'>Auto</option>
                                            <option value='moto'>Moto</option>
                                        </select>
                                    </div>
                                </fieldset>
                            )}

                            {mode === 'signup' && role === 'admin' && (
                                <div className='rounded-2xl border border-[#f5c400]/40 bg-[#fffdf2] p-4'>
                                    <label className={authLabelClass} htmlFor='admin-code'>
                                        🔐 Operations access code
                                    </label>
                                    <input
                                        id='admin-code'
                                        required
                                        className={authFieldClass}
                                        type='password'
                                        autoComplete='off'
                                        placeholder='Enter your invite code'
                                        value={form.adminCode}
                                        onChange={update('adminCode')}
                                    />
                                    <p className='mt-2 text-[11px] leading-relaxed text-gray-500'>
                                        Issued by your YENKO operations lead. It is verified securely on the server when your account is created.
                                    </p>
                                </div>
                            )}

                            <button
                                type='submit'
                                disabled={loading}
                                className={`flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-base font-bold transition-all ${
                                    loading
                                        ? 'cursor-not-allowed bg-gray-400 text-white'
                                        : role === 'captain'
                                            ? 'bg-[#111] text-white hover:bg-gray-800'
                                            : 'bg-[#f5c400] text-[#111] hover:bg-[#e5b600]'
                                }`}
                            >
                                {loading ? (
                                    <>
                                        <span className='mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-current' />
                                        Please wait…
                                    </>
                                ) : (
                                    copy.button
                                )}
                            </button>
                        </form>

                        <div className='mt-7 border-t border-gray-100 pt-5 text-center text-sm text-gray-600'>
                            {mode === 'signin' ? (
                                <p>
                                    New to YENKO?{' '}
                                    <button
                                        type='button'
                                        onClick={() => chooseMode('signup')}
                                        className='font-bold text-[#111] underline decoration-[#f5c400] decoration-2 underline-offset-4'
                                    >
                                        Create an account
                                    </button>
                                </p>
                            ) : (
                                <p>
                                    Already have an account?{' '}
                                    <button
                                        type='button'
                                        onClick={() => chooseMode('signin')}
                                        className='font-bold text-[#111] underline decoration-[#f5c400] decoration-2 underline-offset-4'
                                    >
                                        Sign in instead
                                    </button>
                                </p>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            <footer className='border-t border-gray-200 bg-white px-5 py-4 text-center text-[11px] text-gray-400'>
                YENKO RIDE · Move smarter, Ghana · Powered by OpenStreetMap
            </footer>
        </div>
    )
}

export default Onboarding
