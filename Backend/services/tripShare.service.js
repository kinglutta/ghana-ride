const crypto = require('crypto');
const TripShare = require('../models/tripShare.model');
const Ride = require('../models/ride.model');
const Captain = require('../models/captain.model');

const MAX_MINUTES = 120;

/** TripShareService — secure, expiring ride links for Riders and Captains. */
class TripShareService {
    static async create({ rideId, creatorId, creatorModel, label = 'trip', minutes }) {
        const ride = await Ride.findById(rideId);
        if (!ride) throw new Error('Ride not found');

        const id = String(creatorId);
        const isRider = ride.user && String(ride.user) === id;
        const isCaptain = ride.captain && String(ride.captain) === id;

        if (!isRider && !isCaptain) {
            throw new Error('You are not part of this ride');
        }
        if ((isRider && creatorModel !== 'user') || (isCaptain && creatorModel !== 'captain')) {
            throw new Error('Account type does not match this ride');
        }
        if (isCaptain && !ride.captain) {
            throw new Error('Your ride companion is not assigned yet');
        }

        const duration = Math.min(MAX_MINUTES, Math.max(5, Number(minutes) || 30));

        // One live link per creator per ride keeps sharing predictable.
        await TripShare.updateMany(
            { ride: rideId, createdBy: creatorId, revokedAt: null },
            { revokedAt: new Date() }
        );

        return TripShare.create({
            ride: rideId,
            token: crypto.randomBytes(18).toString('hex'),
            createdBy: creatorId,
            creatorModel,
            label: label === 'sos' ? 'sos' : 'trip',
            expiresAt: new Date(Date.now() + duration * 60 * 1000),
        });
    }

    /** Public, privacy-filtered snapshot of a live ride. */
    static async resolve(token) {
        const share = await TripShare.findOne({ token }).populate('ride');
        if (!share || share.revokedAt || share.expiresAt <= new Date()) {
            throw new Error('This YENKO link has expired or been revoked');
        }

        const ride = share.ride;
        if (!ride) throw new Error('Ride not found');

        const captain = ride.captain
            ? await Captain.findById(ride.captain).select('fullname rating vehicle location status')
            : null;

        return {
            label: share.label,
            expiresAt: share.expiresAt,
            generatedAt: new Date(),
            ride: {
                status: ride.status,
                pickup: ride.pickup,
                destination: ride.destination,
                fare: ride.fare,
                distance: ride.distance,
                duration: ride.duration,
                vehicleType: ride.vehicleType,
                startedAt: ride.startedAt,
                createdAt: ride.createdAt,
            },
            captain: captain ? {
                firstname: captain.fullname?.firstname || 'YENKO',
                rating: captain.rating,
                vehicle: captain.vehicle,
                location: captain.location,
                isOnline: captain.status === 'active',
            } : null,
        };
    }

    static async revoke(token, creatorId) {
        const share = await TripShare.findOne({ token });
        if (!share || String(share.createdBy) !== String(creatorId)) {
            throw new Error('You cannot revoke this link');
        }
        if (share.revokedAt) return share;

        share.revokedAt = new Date();
        await share.save();
        return share;
    }
}

module.exports = TripShareService;
