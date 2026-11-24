const rideModel = require('../models/ride.model');
const captainModel = require('../models/captain.model');
const userModel = require('../models/user.model');

/**
 * GET /admin/stats
 * Fleet-wide stats for the admin dashboard.
 */
module.exports.getStats = async (req, res) => {
    try {
        const totalRides = await rideModel.countDocuments();
        const completedRides = await rideModel.countDocuments({ status: 'completed' });
        const activeCaptains = await captainModel.countDocuments({ status: 'active' });

        const earningsResult = await rideModel.aggregate([
            { $match: { status: 'completed', paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$fare' } } },
        ]);
        const totalEarnings = earningsResult.length > 0 ? earningsResult[0].total : 0;

        return res.status(200).json({
            totalRides,
            completedRides,
            activeCaptains,
            totalEarnings,
        });
    } catch (err) {
        console.error('❌ Error fetching admin stats:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * GET /admin/rides/recent
 * Recent rides for the admin dashboard.
 */
module.exports.getRecentRides = async (req, res) => {
    try {
        const rides = await rideModel.find()
            .populate('user', 'fullname email')
            .populate('captain', 'fullname vehicle rating')
            .sort({ createdAt: -1 })
            .limit(20);

        return res.status(200).json(rides);
    } catch (err) {
        console.error('❌ Error fetching recent rides:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * GET /admin/captains
 * All captains for fleet management.
 */
module.exports.getCaptains = async (req, res) => {
    try {
        const captains = await captainModel.find()
            .select('-password')
            .sort({ rating: -1, totalRides: -1 });

        return res.status(200).json(captains);
    } catch (err) {
        console.error('❌ Error fetching captains:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * GET /admin/analytics/overview
 * Fleet-wide analytics overview: users, captains, rides, revenue, averages.
 */
module.exports.getAnalyticsOverview = async (req, res) => {
    try {
        const totalUsers = await userModel.countDocuments();
        const totalCaptains = await captainModel.countDocuments();
        const activeCaptains = await captainModel.countDocuments({ status: 'active' });
        const totalRides = await rideModel.countDocuments();
        const completedRides = await rideModel.countDocuments({ status: 'completed' });
        const cancelledRides = await rideModel.countDocuments({ status: 'cancelled' });

        const revenueAgg = await rideModel.aggregate([
            { $match: { status: 'completed', paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$fare' }, count: { $sum: 1 } } },
        ]);
        const revenueData = revenueAgg[0] || { total: 0, count: 0 };

        const avgFareAgg = await rideModel.aggregate([
            { $match: { status: 'completed', paymentStatus: 'paid' } },
            { $group: { _id: null, avg: { $avg: '$fare' } } },
        ]);
        const avgFare = avgFareAgg.length > 0 ? avgFareAgg[0].avg : 0;

        // Platform revenue share estimate: drivers keep 80%, platform 20% (demo)
        const platformRevenue = Math.round(revenueData.total * 0.2 * 100) / 100;

        return res.status(200).json({
            totalUsers,
            totalCaptains,
            activeCaptains,
            totalRides,
            completedRides,
            cancelledRides,
            totalRevenue: revenueData.total,
            paidRideCount: revenueData.count,
            avgFare,
            platformRevenue,
        });
    } catch (err) {
        console.error('❌ Error fetching analytics overview:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * GET /admin/analytics/daily-rides?days=14
 * Daily ride counts + revenue for the last N days.
 */
module.exports.getDailyRides = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 14;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const daily = await rideModel.aggregate([
            { $match: { createdAt: { $gte: since } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    rides: { $sum: 1 },
                    revenue: { $sum: '$fare' },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        return res.status(200).json(daily);
    } catch (err) {
        console.error('❌ Error fetching daily rides:', err);
        return res.status(500).json({ message: err.message });
    }
};

/**
 * GET /admin/analytics/revenue-by-vehicle
 * Revenue and ride counts grouped by vehicle type.
 */
module.exports.getRevenueByVehicle = async (req, res) => {
    try {
        const byVehicle = await rideModel.aggregate([
            { $match: { status: 'completed', paymentStatus: 'paid' } },
            {
                $group: {
                    _id: '$vehicleType',
                    rides: { $sum: 1 },
                    revenue: { $sum: '$fare' },
                },
            },
            { $sort: { revenue: -1 } },
        ]);

        return res.status(200).json(byVehicle);
    } catch (err) {
        console.error('❌ Error fetching revenue by vehicle:', err);
        return res.status(500).json({ message: err.message });
    }
};
