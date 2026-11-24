import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AuthGateMessage from '../components/ui/AuthGateMessage';
import { getToken, clearToken } from '../lib/authToken';

/**
 * AdminProtectedWrapper — verifies admin access with the server, not the client.
 * A 403 means a valid rider/captain session without admin privileges.
 */
const AdminProtectedWrapper = ({ children }) => {
    const [state, setState] = useState('loading');
    const navigate = useNavigate();

    useEffect(() => {
        const token = getToken();
        if (!token) {
            navigate('/login');
            return;
        }

        let active = true;
        axios
            .get(`${import.meta.env.VITE_API_URL}/admin/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then(() => active && setState('ready'))
            .catch((err) => {
                if (!active) return;
                const status = err.response?.status;
                if (status === 401) {
                    clearToken('admin');
                    navigate('/login');
                    return;
                }
                if (status === 403) {
                    setState('denied');
                    return;
                }
                console.log('Admin session check unavailable:', err.message);
                setState('offline');
            });

        return () => {
            active = false;
        };
    }, [navigate]);

    if (state === 'loading') {
        return <AuthGateMessage title='Loading YENKO…' message='Opening the command centre.' />;
    }

    if (state === 'denied') {
        return (
            <AuthGateMessage
                title='Admin access required'
                message='This area is for YENKO fleet administrators. Sign in with an admin account to continue.'
                onRetry={() => window.location.reload()}
            />
        );
    }

    if (state === 'offline') {
        return (
            <AuthGateMessage
                title='Connection interrupted'
                message='We could not verify admin access right now.'
                onRetry={() => window.location.reload()}
            />
        );
    }

    return <>{children}</>;
};

export default AdminProtectedWrapper;
