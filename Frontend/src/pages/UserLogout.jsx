import React from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { getToken, clearToken } from '../lib/authToken';

export const UserLogout = () => {

    const token = getToken()
    const navigate = useNavigate()

    axios.get(`${import.meta.env.VITE_API_URL}/users/logout`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }).then((response) => {
        if (response.status === 200) {
            clearToken('rider')
            navigate('/login')
        }
    })

    return (
        <div>UserLogout</div>
    )
}

export default UserLogout
