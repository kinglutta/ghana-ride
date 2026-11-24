/**
 * SafetyPage — YENKO-standard safety features
 * SOS button, emergency contacts, trip sharing
 * Safety first — always visible, always accessible
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useContext } from 'react';
import { SocketContext } from '../context/socket.context';
import CustomButton from '../components/ui/CustomButton';
import InputField from '../components/ui/InputField';
import { getToken } from '../lib/authToken';

const SafetyPage = ({ ride }) => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newContactName, setNewContactName] = useState('');
    const [newContactPhone, setNewContactPhone] = useState('');
    const [newContactRelation, setNewContactRelation] = useState('Emergency Contact');
    const [sosActive, setSosActive] = useState(false);
    const [activeAlertId, setActiveAlertId] = useState(null);
    const [sosLoading, setSosLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [sosMessage, setSosMessage] = useState('');

    const { socket } = useContext(SocketContext);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/safety/contacts`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setContacts(res.data);
        } catch (err) {
            console.error('Error fetching contacts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddContact = async (e) => {
        e.preventDefault();
        if (!newContactName || !newContactPhone) {
            setMessage('Name and phone number required');
            return;
        }
        try {
            const token = getToken();
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/safety/contacts`,
                {
                    name: newContactName,
                    phoneNumber: newContactPhone,
                    relationship: newContactRelation,
                    isPrimary: contacts.length === 0,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage(res.data.message);
            setNewContactName('');
            setNewContactPhone('');
            setNewContactRelation('Emergency Contact');
            fetchContacts();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to add contact');
        }
    };

    const handleRemoveContact = async (id) => {
        try {
            const token = getToken();
            await axios.delete(`${import.meta.env.VITE_API_URL}/safety/contacts/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchContacts();
        } catch (err) {
            console.error('Error removing contact:', err);
        }
    };

    const handleSOS = async () => {
        if (!navigator.geolocation) {
            setSosMessage('Geolocation not supported');
            return;
        }
        setSosLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const token = getToken();
                    const body = {
                        location: { ltd: latitude, lng: longitude },
                    };
                    if (ride) {
                        body.rideId = ride._id;
                    }
                    const res = await axios.post(
                        `${import.meta.env.VITE_API_URL}/safety/sos`,
                        body,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setSosActive(true);
                    setActiveAlertId(res.data.alert?._id || null);
                    setSosMessage(res.data.message);
                    // Broadcast via socket
                    if (socket) {
                        socket.emit('sos-activated', {
                            alertId: res.data.alert._id,
                            location: { ltd: latitude, lng: longitude },
                            rideId: ride ? ride._id : null,
                        });
                    }
                } catch (err) {
                    setSosMessage(err.response?.data?.message || 'SOS activation failed');
                } finally {
                    setSosLoading(false);
                }
            },
            () => {
                setSosMessage('Location access denied — SOS needs location');
                setSosLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const resolveSOS = async () => {
        if (!activeAlertId) {
            setSosActive(false);
            setSosMessage('');
            return;
        }

        try {
            const token = getToken();
            await axios.patch(
                `${import.meta.env.VITE_API_URL}/safety/alerts/${activeAlertId}/resolve`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSosActive(false);
            setActiveAlertId(null);
            setSosMessage('SOS resolved. YENKO operations has been notified.');
        } catch (err) {
            setSosMessage(err.response?.data?.message || 'Could not resolve the SOS alert.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">🛡️ Safety</h1>
                        <p className="text-gray-600">Your safety is our priority</p>
                    </div>
                </div>

                {/* SOS Button — Prominent, always accessible */}
                <div className="mb-8">
                    <button
                        onClick={handleSOS}
                        disabled={sosLoading || sosActive}
                        className={`w-full py-6 rounded-3xl font-bold text-white flex items-center justify-center gap-3 shadow-xl transition-all transform active:scale-95 ${
                            sosActive
                                ? 'bg-red-100 text-red-700 border-2 border-red-400 animate-pulse'
                                : 'bg-red-600 hover:bg-red-700'
                        }`}
                    >
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-red-600">
                            {!sosActive ? '🚨' : '✅'}
                        </div>
                        <div>
                            {sosActive ? (
                                <div>
                                    <div className="text-lg">SOS Active</div>
                                    <div className="text-sm text-red-600">Emergency contacts notified</div>
                                </div>
                            ) : (
                                <div>
                                    <div className="text-lg">EMERGENCY SOS</div>
                                    <div className="text-sm text-red-500">Tap for immediate help</div>
                                </div>
                            )}
                        </div>
                    </button>
                    {sosLoading && (
                        <p className="text-center text-sm text-gray-500 mt-2">Activating SOS...</p>
                    )}
                    {sosMessage && (
                        <p className={`text-center text-sm font-medium mt-3 ${
                            sosActive ? 'text-green-600' : 'text-red-600'
                        }`}>
                            {sosMessage}
                        </p>
                    )}
                    {sosActive && (
                        <CustomButton
                            title="Resolve SOS"
                            bgVariant="outline"
                            onClick={resolveSOS}
                            className="mt-4"
                        />
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Emergency Contacts */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">📞 Emergency Contacts</h3>
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    contacts.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                                {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {contacts.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <div className="text-gray-300 text-2xl mb-2">📭</div>
                                <p>No emergency contacts yet</p>
                                <p className="text-xs text-gray-400 mt-2">Add contacts who will be notified during SOS</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {contacts.map((contact) => (
                                    <div
                                        key={contact._id}
                                        className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                {contact.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900">{contact.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    {contact.relationship} · {contact.phoneNumber}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveContact(contact._id)}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleAddContact} className="mt-6 space-y-3">
                            <InputField
                                label="Contact Name"
                                value={newContactName}
                                onChange={(e) => setNewContactName(e.target.value)}
                                placeholder="e.g. John Doe"
                            />
                            <InputField
                                label="Phone Number"
                                type="tel"
                                value={newContactPhone}
                                onChange={(e) => setNewContactPhone(e.target.value)}
                                placeholder="024XXXXXXXX"
                            />
                            <InputField
                                label="Relationship"
                                value={newContactRelation}
                                onChange={(e) => setNewContactRelation(e.target.value)}
                                placeholder="e.g. Brother, Spouse, Friend"
                            />
                            <CustomButton
                                title="Add Contact"
                                disabled={loading}
                            />
                        </form>
                    </div>

                    {/* Safety Info */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">🛡️ How SOS Works</h3>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-lg">1</div>
                                <div>
                                    <div className="font-semibold text-gray-900">Tap SOS Button</div>
                                    <div className="text-sm text-gray-600">Your location is captured instantly</div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-lg">2</div>
                                <div>
                                    <div className="font-semibold text-gray-900">Emergency Contacts Notified</div>
                                    <div className="text-sm text-gray-600">Your SOS contacts receive your location</div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-lg">3</div>
                                <div>
                                    <div className="font-semibold text-gray-900">Admin Alerted</div>
                                    <div className="text-sm text-gray-600">YENKO RIDE admin team is notified for response</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
                            <h4 className="font-bold text-amber-800 mb-2">⚡ Quick Tips</h4>
                            <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                                <li>Add at least one primary emergency contact</li>
                                <li>Keep location permissions enabled</li>
                                <li>SOS works even during an active ride</li>
                                <li>Admin team monitors all SOS alerts 24/7</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {message && (
                    <div className="mt-6 px-4 py-3 rounded bg-blue-100 text-blue-700 text-sm font-medium">
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SafetyPage;
