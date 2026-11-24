const SOSAlert = require('../models/payment.models').SOSAlert;
const EmergencyContact = require('../models/payment.models').EmergencyContact;
const Ride = require('../models/ride.model');
const User = require('../models/user.model');
const { validationResult } = require('express-validator');
const { body } = require('express-validator');

/**
 * POST /api/safety/contacts
 * Add emergency contact
 */
module.exports.addEmergencyContact = [
    body('name').notEmpty().withMessage('Name required'),
    body('phoneNumber').isMobilePhone('any').withMessage('Valid phone number required'),
    body('relationship').optional().isString(),
    body('isPrimary').optional().isBoolean(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { name, phoneNumber, relationship, isPrimary } = req.body;

            // If setting as primary, unset others
            if (isPrimary) {
                await EmergencyContact.updateMany(
                    { user: req.user._id },
                    { isPrimary: false }
                );
            }

            const contact = await EmergencyContact.create({
                user: req.user._id,
                name,
                phoneNumber,
                relationship: relationship || 'Emergency Contact',
                isPrimary: isPrimary || false,
            });

            return res.status(201).json({
                message: 'Emergency contact added',
                contact,
            });
        } catch (err) {
            console.error('❌ Error adding emergency contact:', err);
            return res.status(500).json({ message: err.message });
        }
    },
];

/**
 * GET /api/safety/contacts
 * List emergency contacts
 */
module.exports.getEmergencyContacts = async (req, res) => {
    try {
        const contacts = await EmergencyContact.find({ user: req.user._id }).sort({ isPrimary: -1, createdAt: -1 });
        return res.status(200).json(contacts);
    } catch (err) {
        console.error('❌ Error fetching contacts:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * DELETE /api/safety/contacts/:id
 * Remove emergency contact
 */
module.exports.removeEmergencyContact = async (req, res) => {
    try {
        const contact = await EmergencyContact.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id,
        });
        if (!contact) {
            return res.status(404).json({ message: 'Contact not found' });
        }
        return res.status(200).json({ message: 'Contact removed' });
    } catch (err) {
        console.error('❌ Error removing contact:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * POST /api/safety/sos
 * Activate SOS alert — broadcast to emergency contacts + admin
 */
module.exports.activateSOS = [
    body('location.ltd').isNumeric().withMessage('Latitude required'),
    body('location.lng').isNumeric().withMessage('Longitude required'),
    body('rideId').optional().isMongoId().withMessage('Invalid ride id'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { location, rideId } = req.body;

            const sosAlert = await SOSAlert.create({
                user: req.user._id,
                ride: rideId || null,
                location,
                status: 'active',
            });

            // Get user info for the alert
            const user = await User.findById(req.user._id).select('fullname email phoneNumber');

            // Get emergency contacts
            const contacts = await EmergencyContact.find({ user: req.user._id });

            // Broadcast via Socket.IO
            const io = req.app.get('io');
            if (io) {
                // Alert admin room
                io.to('admin').emit('sos-alert', {
                    alertId: sosAlert._id,
                    user: {
                        _id: req.user._id,
                        fullname: user.fullname,
                        email: user.email,
                    },
                    location,
                    timestamp: sosAlert.createdAt,
                    rideId,
                });

                // Alert emergency contacts (they'd need to be connected users)
                contacts.forEach(contact => {
                    io.to(`contact_${contact.phoneNumber}`).emit('sos-alert', {
                        alertId: sosAlert._id,
                        user: {
                            _id: req.user._id,
                            fullname: user.fullname,
                            phoneNumber: user.phoneNumber,
                        },
                        location,
                        message: `🚨 SOS from ${user.fullname.firstname} ${user.fullname.lastname} — Emergency!`,
                    });
                });
            }

            return res.status(201).json({
                message: 'SOS activated — emergency contacts and admin notified',
                alert: sosAlert,
                contactsNotified: contacts.length,
            });
        } catch (err) {
            console.error('❌ Error activating SOS:', err);
            return res.status(500).json({ message: err.message });
        }
    },
];

/**
 * GET /api/safety/alerts
 * List SOS alerts (admin)
 */
module.exports.getSOSAlerts = async (req, res) => {
    try {
        const alerts = await SOSAlert.find()
            .populate('user', 'fullname email phoneNumber')
            .populate('ride', 'pickup destination status')
            .sort({ createdAt: -1 })
            .limit(50);
        return res.status(200).json(alerts);
    } catch (err) {
        console.error('❌ Error fetching SOS alerts:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * PATCH /api/safety/alerts/:id/resolve
 * Resolve SOS alert (admin)
 */
module.exports.resolveSOSAlert = async (req, res) => {
    try {
        const alert = await SOSAlert.findByIdAndUpdate(
            req.params.id,
            { status: 'resolved', resolvedAt: new Date(), resolvedBy: req.user._id },
            { new: true }
        );
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }
        return res.status(200).json({ message: 'SOS alert resolved', alert });
    } catch (err) {
        console.error('❌ Error resolving alert:', err);
        return res.status(500).json({ message: err.message });
    }
};
