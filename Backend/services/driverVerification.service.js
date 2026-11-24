const DriverVerification = require('../models/driverVerification.model');
const Captain = require('../models/captain.model');

/**
 * DriverVerificationService — driver document verification workflow
 */
class DriverVerificationService {
    /**
     * Driver submits (or resubmits) verification documents
     */
    static async submit(captainId, documents) {
        let verification = await DriverVerification.findOne({ captain: captainId });

        if (!verification) {
            verification = await DriverVerification.create({
                captain: captainId,
                status: 'pending',
                documents,
            });
        } else {
            verification.documents = documents;
            verification.status = 'pending';
            verification.reviewNote = undefined;
            verification.reviewedAt = undefined;
            await verification.save();
        }

        // Notify admins of new verification submission
        // (in-app notification created in controller)

        return verification;
    }

    /**
     * Get verification status for a captain
     */
    static async getMyVerification(captainId) {
        return DriverVerification.findOne({ captain: captainId });
    }

    /**
     * Get all pending verifications (admin)
     */
    static async getPendingVerifications() {
        return DriverVerification.find({ status: 'pending' })
            .populate('captain', 'fullname email phoneNumber vehicle rating')
            .sort({ createdAt: -1 });
    }

    /**
     * Review a verification (admin approve/reject)
     */
    static async review(verificationId, status, reviewedBy, reviewNote) {
        const verification = await DriverVerification.findByIdAndUpdate(
            verificationId,
            { status, reviewNote, reviewedAt: new Date(), reviewedBy },
            { new: true }
        );

        if (!verification) {
            throw new Error('Verification not found');
        }

        const captain = await Captain.findById(verification.captain);

        if (status === 'approved') {
            if (captain) {
                captain.isVerified = true;
                captain.status = 'active';
                await captain.save();
            }
        } else if (status === 'rejected') {
            if (captain) {
                captain.isVerified = false;
                captain.status = 'inactive';
                await captain.save();
            }
        }

        return verification;
    }
}

module.exports = DriverVerificationService;
