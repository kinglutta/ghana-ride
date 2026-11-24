import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

/**
 * Fetches one API resource with the YENKO auth token.
 * Returns `{ data, loading, error, refresh }` and never throws to the caller.
 */
const useApiResource = (path, { enabled = true, intervalMs = 0 } = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        if (!enabled || !path) return;
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${import.meta.env.VITE_API_URL}${path}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            setData(response.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Request failed');
        } finally {
            setLoading(false);
        }
    }, [enabled, path]);

    useEffect(() => {
        load();
        if (!intervalMs) return undefined;
        const timer = setInterval(load, intervalMs);
        return () => clearInterval(timer);
    }, [load, intervalMs]);

    return { data, loading, error, refresh: load };
};

export default useApiResource;
