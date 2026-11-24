const DriverVerificationService = require('../services/driverVerification.service');
const NotificationService = require('../services/notification.service');
const { validationResult } = require('express-validator');
const { body } = require('express-validator');

/**
 * POST /api/driver-verification/submit
 * Driver submits verification documents
 */
module.exports.submitVerification = [
    body('documents').isArray({ min: 1 }).withMessage('At least one document required'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { documents } = req.body;
            const verification = await DriverVerificationService.submit(
                req.captain._id,
                documents
            );

            const captain = await require('../models/captain.model').findById(req.captain._id);

            // Captain confirmation goes to the captain notification stream.
            await NotificationService.create({
                captainId: req.captain._id,
                type: 'system',
                title: 'Verification submitted',
                body: 'Your documents are with YENKO Operations. We will review them shortly.',
                data: { verificationId: verification._id, status: 'pending' },
            });

            // Operations sees new submissions live in the command centre.
            const io = req.app.get('io');
            if (io) {
                io.to('admin').emit('verification-submitted', {
                    verificationId: verification._id,
                    captain: {
                        _id: req.captain._id,
                        fullname: captain?.fullname,
                        vehicle: captain?.vehicle,
                    },
                    documents: verification.documents?.length || 0,
                    submittedAt: verification.createdAt,
                });
            }

            return res.status(201).json({
                message: 'Verification submitted',
                verification,
            });
        } catch (err) {
            console.error('❌ Error submitting verification:', err);
            return res.status(400).json({ message: err.message });
        }
    },
];

/**
 * GET /api/driver-verification/me
 * Driver gets own verification status
 */
module.exports.getMyVerification = async (req, res) => {
    try {
        const verification = await DriverVerificationService.getMyVerification(req.captain._id);
        return res.status(200).json(verification);
    } catch (err) {
        console.error('❌ Error fetching verification:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * GET /api/driver-verification/pending
 * Admin gets pending verifications
 */
module.exports.getPendingVerifications = async (req, res) => {
    try {
        const verifications = await DriverVerificationService.getPendingVerifications();
        return res.status(200).json(verifications);
    } catch (err) {
        console.error('❌ Error fetching pending verifications:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * PATCH /api/driver-verification/:id/review
 * Admin approves/rejects a verification
 */
module.exports.reviewVerification = [
    body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
    body('reviewNote').optional().isString().isLength({ max: 300 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { status, reviewNote } = req.body;
            const verification = await DriverVerificationService.review(
                req.params.id,
                status,
                req.user?._id?.toString() || 'admin',
                reviewNote
            );

            // The Captain always learns the decision in their own account.
            await NotificationService.create({
                captainId: verification.captain,
                type: 'system',
                title: status === 'approved' ? 'You are verified' : 'Verification needs attention',
                body: status === 'approved'
                    ? 'Your YENKO Captain account is verified. You can now receive ride requests.'
                    : (reviewNote || 'Please check your documents and submit again.'),
                data: { verificationId: verification._id, status },
            });

            const io = req.app.get('io');
            if (io) {
                io.to('captain').emit('verification-reviewed', {
                    captainId: String(verification.captain),
                    status,
                    reviewNote,
                });
            }

            return res.status(200).json({
                message: `Verification ${status}`,
                verification,
            });
        } catch (err) {
            console.error('❌ Error reviewing verification:', err);
            return res.status(400).json({ message: err.message });
        }
    },
];
