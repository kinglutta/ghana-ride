const ScheduledRide = require('../models/scheduledRide.model');
const Ride = require('../models/ride.model');
const Captain = require('../models/captain.model');
const SurgePricingService = require('./surge.service');
const NotificationService = require('./notification.service');

/**
 * ScheduledRideService — manage rides booked for future dates
 */
class ScheduledRideService {
    /**
     * Create a scheduled ride
     */
    static async create({ userId, pickup, destination, vehicleType, fare, scheduledAt, lat, lng }) {
        const scheduledRide = await ScheduledRide.create({
            user: userId,
            pickup,
            destination,
            vehicleType,
            fare,
            scheduledAt: new Date(scheduledAt),
            status: 'scheduled',
        });

        // Create notification for user
        await NotificationService.create({
            userId,
            type: 'scheduled_ride',
            title: 'Ride Scheduled',
            body: `Your ride from ${pickup} to ${destination} is scheduled for ${new Date(scheduledAt).toLocaleString()}`,
            data: { scheduledRideId: scheduledRide._id },
        });

        return scheduledRide;
    }

    /**
     * Get user's scheduled rides
     */
    static async getUserScheduledRides(userId) {
        return ScheduledRide.find({ user: userId })
            .populate('captain', 'fullname vehicle rating')
            .sort({ scheduledAt: 1 });
    }

    /**
     * Get upcoming scheduled rides that need captain matching
     * (rides scheduled within the next 30 minutes that are still 'scheduled')
     */
    static async getUpcomingForMatching() {
        const now = new Date();
        const thirtyMinsFromNow = new Date(now.getTime() + 30 * 60 * 1000);

        return ScheduledRide.find({
            status: 'scheduled',
            scheduledAt: { $gte: now, $lte: thirtyMinsFromNow },
        }).populate('user', 'fullname email phoneNumber');
    }

    /**
     * Cancel a scheduled ride
     */
    static async cancel(scheduledRideId, userId, reason = '') {
        const scheduledRide = await ScheduledRide.findOneAndUpdate(
            { _id: scheduledRideId, user: userId, status: 'scheduled' },
            {
                status: 'cancelled',
                cancelledAt: new Date(),
                cancellationReason: reason,
            },
            { new: true }
        );

        if (!scheduledRide) {
            throw new Error('Scheduled ride not found or cannot be cancelled');
        }

        await NotificationService.create({
            userId,
            type: 'scheduled_ride',
            title: 'Ride Cancelled',
            body: `Your scheduled ride from ${scheduledRide.pickup} has been cancelled`,
            data: { scheduledRideId },
        });

        return scheduledRide;
    }

    /**
     * Match a captain to a scheduled ride (when captain accepts)
     */
    static async assignCaptain(scheduledRideId, captainId) {
        const scheduledRide = await ScheduledRide.findByIdAndUpdate(
            scheduledRideId,
            { captain: captainId, status: 'confirmed' },
            { new: true }
        );

        if (!scheduledRide) {
            throw new Error('Scheduled ride not found');
        }

        // Notify user
        await NotificationService.create({
            userId: scheduledRide.user,
            type: 'scheduled_ride',
            title: 'Driver Assigned',
            body: `A driver has been assigned to your scheduled ride`,
            data: { scheduledRideId },
        });

        return scheduledRide;
    }

    /**
     * Convert scheduled ride to active ride when it's time
     */
    static async activate(scheduledRideId) {
        const scheduledRide = await ScheduledRide.findByIdAndUpdate(
            scheduledRideId,
            { status: 'ongoing' },
            { new: true }
        );

        // Create a corresponding ride record
        const ride = await Ride.create({
            user: scheduledRide.user,
            captain: scheduledRide.captain,
            pickup: scheduledRide.pickup,
            destination: scheduledRide.destination,
            vehicleType: scheduledRide.vehicleType,
            fare: scheduledRide.fare,
            status: 'ongoing',
            otp: Math.floor(100000 + Math.random() * 900000).toString(),
        });

        await NotificationService.create({
            userId: scheduledRide.user,
            type: 'ride_started',
            title: 'Your Ride Has Started',
            body: `Your driver is on the way to pick you up`,
            data: { rideId: ride._id },
        });

        return { scheduledRide, ride };
    }
}

module.exports = ScheduledRideService;
