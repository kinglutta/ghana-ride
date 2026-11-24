import React, { useContext, useEffect, useState } from 'react'
import { CaptainDataContext } from '../context/captain.context'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import AuthGateMessage from '../components/ui/AuthGateMessage'
import { getToken, clearToken } from '../lib/authToken';

const CaptainProtectedWrapper = ({ children }) => {
    const token = getToken()
    const navigate = useNavigate()
    const { setCaptain } = useContext(CaptainDataContext)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!token) {
            navigate('/captain-login')
            return
        }

        let active = true

        axios.get(`${import.meta.env.VITE_API_URL}/captains/profile`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(response => {
                if (!active) return
                setCaptain(response.data.captain)
                setIsLoading(false)
            })
            .catch(err => {
                if (!active) return
                const status = err.response?.status

                if (status === 401 || status === 403) {
                    clearToken('captain')
                    navigate('/captain-login')
                    return
                }

                console.log('Captain session check unavailable:', err.message)
                setError('We could not verify your YENKO Captain session right now.')
                setIsLoading(false)
            })

        return () => { active = false }
    }, [token, navigate, setCaptain])

    if (isLoading) {
        return <AuthGateMessage title='Loading Captain mode…' message='Preparing your YENKO fleet dashboard.' />
    }

    if (error) {
        return (
            <AuthGateMessage
                title='Connection interrupted'
                message={error}
                onRetry={() => window.location.reload()}
            />
        )
    }

    return <>{children}</>
}

export default CaptainProtectedWrapper
