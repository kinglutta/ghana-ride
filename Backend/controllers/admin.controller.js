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
