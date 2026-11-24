/**
 * DriverVerification — driver document verification workflow
 * Drivers submit license / vehicle / ID documents; admins review.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CustomButton from '../components/ui/CustomButton';
import InputField from '../components/ui/InputField';
import { getToken } from '../lib/authToken';

const DOC_TYPES = [
    { value: 'license', label: 'Driver License', icon: '🪪' },
    { value: 'vehicle', label: 'Vehicle Documents', icon: '🚗' },
    { value: 'id', label: 'National ID', icon: '🪪' },
];

const DriverVerification = () => {
    const [documents, setDocuments] = useState([
        { type: 'license', url: '', vehicleType: '', plateNumber: '' },
    ]);
    const [verification, setVerification] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchVerification();
    }, []);

    const fetchVerification = async () => {
        try {
            const token = getToken();
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/driver-verification/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setVerification(res.data);
        } catch (err) {
            if (err.response?.status === 401) {
                setError('A captain account is required to submit verification documents.');
            } else {
                setError('Unable to load verification status. Please try again.');
            }
        }
    };

    const updateDocument = (index, field, value) => {
        const updated = documents.map((d, i) => (i === index ? { ...d, [field]: value } : d));
        setDocuments(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        const cleaned = documents
            .filter((d) => d.url && d.url.trim().length > 0)
            .map((d) => ({
                type: d.type,
                url: d.url.trim(),
                ...(d.type === 'vehicle' ? { vehicleType: d.vehicleType, plateNumber: d.plateNumber } : {}),
            }));

        if (cleaned.length === 0) {
            setError('Please provide at least one document URL');
            return;
        }

        setLoading(true);
        try {
            const token = getToken();
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/driver-verification/submit`,
                { documents: cleaned },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setVerification(res.data.verification);
            setMessage(res.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit verification');
        } finally {
            setLoading(false);
        }
    };

    const statusBadge = () => {
        if (!verification) return <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold">Not Submitted</span>;
        const status = verification.status;
        const color =
            status === 'approved' ? 'bg-green-100 text-green-700' : status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';
        return <span className={`px-3 py-1 rounded-full text-sm font-semibold ${color}`}>{status}</span>;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">🛡️ Driver Verification</h1>
                    <p className="text-gray-600">Submit verification documents to start receiving ride requests</p>
                </div>

                {message && <div className="mb-6 px-4 py-3 rounded-xl bg-green-100 text-green-700 text-sm font-medium">{message}</div>}
                {error && <div className="mb-6 px-4 py-3 rounded-xl bg-red-100 text-red-700 text-sm font-medium">{error}</div>}

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Documents</h3>
                        {documents.map((doc, index) => (
                            <div key={index} className="border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <select
                                        value={doc.type}
                                        onChange={(e) => updateDocument(index, 'type', e.target.value)}
                                        className="px-4 py-3 border border-gray-300 rounded-xl bg-white"
                                    >
                                        {DOC_TYPES.map((t) => (
                                            <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                                        ))}
                                    </select>
                                    {doc.type === 'vehicle' && (
                                        <>
                                            <InputField
                                                label="Vehicle Type"
                                                value={doc.vehicleType}
                                                onChange={(e) => updateDocument(index, 'vehicleType', e.target.value)}
                                                placeholder="e.g. car"
                                            />
                                            <InputField
                                                label="Plate Number"
                                                value={doc.plateNumber}
                                                onChange={(e) => updateDocument(index, 'plateNumber', e.target.value)}
                                                placeholder="e.g. GHA-1234-A"
                                            />
                                        </>
                                    )}
                                </div>
                                <InputField
                                    label="Document URL / Data"
                                    value={doc.url}
                                    onChange={(e) => updateDocument(index, 'url', e.target.value)}
                                    placeholder="https://... or data URL"
                                />
                            </div>
                        ))}
                        <CustomButton
                            title="Add Document"
                            bgVariant="secondary"
                            onPress={() => setDocuments([...documents, { type: 'license', url: '', vehicleType: '', plateNumber: '' }])}
                        />
                    </div>

                    <CustomButton type="submit" title={loading ? 'Submitting...' : 'Submit for Review'} onPress={handleSubmit} disabled={loading} />
                </form>

                {verification && (
                    <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Current Status</h3>
                            {statusBadge()}
                        </div>
                        <div className="text-sm text-gray-600">
                            Status: <span className="font-semibold">{verification.status}</span>
                            {verification.reviewNote && <div className="mt-2"><strong>Review note:</strong> {verification.reviewNote}</div>}
                            {verification.reviewedAt && <div className="mt-2"><strong>Reviewed:</strong> {new Date(verification.reviewedAt).toLocaleString()}</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DriverVerification;
