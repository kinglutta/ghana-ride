import React, { useContext, useEffect, useState } from 'react'
import { UserDataContext } from '../context/user.context'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import AuthGateMessage from '../components/ui/AuthGateMessage'

const UserProtectedWrapper = ({ children }) => {
    const token = localStorage.getItem('token')
    const navigate = useNavigate()
    const { setUser } = useContext(UserDataContext)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!token) {
            navigate('/login')
            return
        }

        let active = true

        axios.get(`${import.meta.env.VITE_API_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(response => {
                if (!active) return
                setUser(response.data.user || response.data)
                setIsLoading(false)
            })
            .catch(err => {
                if (!active) return
                const status = err.response?.status

                // Only a real auth failure should clear the session.
                if (status === 401 || status === 403) {
                    localStorage.removeItem('token')
                    navigate('/login')
                    return
                }

                console.log('Session check unavailable:', err.message)
                setError('We could not verify your YENKO session right now.')
                setIsLoading(false)
            })

        return () => { active = false }
    }, [token, navigate, setUser])

    if (isLoading) {
        return <AuthGateMessage title='Loading YENKO…' message='Preparing your ride experience.' />
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

export default UserProtectedWrapper
