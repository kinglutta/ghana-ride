const Dispute = require('../models/dispute.model');
const Ride = require('../models/ride.model');

/**
 * DisputeService — ride dispute management
 */
class DisputeService {
    /**
     * File a dispute against a ride
     */
    static async create({ rideId, filedBy, role, reason, description }) {
        const ride = await Ride.findById(rideId);
        if (!ride) {
            throw new Error('Ride not found');
        }

        // Prevent duplicate open disputes per ride/user
        const existing = await Dispute.findOne({
            ride: rideId,
            filedBy,
            status: 'open',
        });
        if (existing) {
            throw new Error('An open dispute already exists for this ride');
        }

        const dispute = await Dispute.create({
            ride: rideId,
            filedBy,
            role,
            reason,
            description,
            status: 'open',
        });

        return dispute;
    }

    /**
     * Get disputes filed by a user
     */
    static async getUserDisputes(userId) {
        return Dispute.find({ filedBy: userId, role: 'user' })
            .populate('ride', 'pickup destination fare status createdAt')
            .sort({ createdAt: -1 });
    }

    /**
     * Get disputes filed by a captain
     */
    static async getCaptainDisputes(captainId) {
        return Dispute.find({ filedBy: captainId, role: 'captain' })
            .populate('ride', 'pickup destination fare status createdAt')
            .sort({ createdAt: -1 });
    }

    /**
     * Get all disputes (admin dashboard)
     */
    static async getAllDisputes() {
        return Dispute.find({})
            .populate('ride', 'pickup destination fare status')
            .sort({ createdAt: -1 });
    }

    /**
     * Resolve a dispute (admin)
     */
    static async resolve(disputeId, { resolution, resolutionNote, resolvedBy }) {
        const dispute = await Dispute.findByIdAndUpdate(
            disputeId,
            {
                status: 'resolved',
                resolution,
                resolutionNote,
                resolvedAt: new Date(),
                resolvedBy,
            },
            { new: true }
        );

        if (!dispute) {
            throw new Error('Dispute not found');
        }

        // Apply resolution effects
        if (resolution === 'refund') {
            // Refund the ride fare back to user's wallet
            const wallet = await require('../models/payment.models').Wallet.findOne({ user: dispute.filedBy });
            if (wallet) {
                // credit wallet with ride fare - find ride
                const ride = await Ride.findById(dispute.ride);
                if (ride) {
                    wallet.balance = (wallet.balance || 0) + ride.fare;
                    await wallet.save();
                    const PaymentTransaction = require('../models/payment.models').PaymentTransaction;
                    await PaymentTransaction.create({
                        user: dispute.filedBy,
                        ride: dispute.ride,
                        type: 'refund',
                        amount: ride.fare,
                        currency: 'GHS',
                        status: 'completed',
                        provider: 'wallet',
                        description: `Dispute refund: ${ride.pickup} → ${ride.destination}`,
                    });
                }
            }
        }

        return dispute;
    }
}

module.exports = DisputeService;
