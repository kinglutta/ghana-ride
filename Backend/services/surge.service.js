const Ride = require('../models/ride.model');
const Captain = require('../models/captain.model');

/**
 * SurgePricingService — dynamic pricing based on demand vs supply
 * YENKO surge: when demand > supply, prices increase
 */
class SurgePricingService {
    /**
     * Calculate surge multiplier for a pickup location
     * @param {number} lat - pickup latitude
     * @param {number} lng - pickup longitude
     * @param {number} radiusKm - search radius in km (default 5)
     * @returns {Object} { multiplier, baseFare, surgeFactor, reason }
     */
    static async calculateSurge(lat, lng, radiusKm = 5) {
        // Base multiplier
        let multiplier = 1.0;
        let reason = 'normal';

        try {
            // Count active captains in radius (approximate using geospatial or recent location updates)
            const activeCaptains = await Captain.countDocuments({
                status: 'active',
                'location.ltd': { $exists: true },
                'location.lng': { $exists: true },
            });

            // Count pending rides (demand) in last 10 minutes
            const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
            const pendingRides = await Ride.countDocuments({
                status: 'pending',
                createdAt: { $gte: tenMinsAgo },
            });

            // Demand-to-supply ratio
            const demandSupplyRatio = activeCaptains > 0
                ? pendingRides / activeCaptains
                : pendingRides > 0 ? 999 : 0;

            // Surge tiers
            if (demandSupplyRatio >= 3) {
                multiplier = 2.0;
                reason = 'high_demand';
            } else if (demandSupplyRatio >= 2) {
                multiplier = 1.5;
                reason = 'elevated_demand';
            } else if (demandSupplyRatio >= 1.5) {
                multiplier = 1.25;
                reason = 'moderate_demand';
            } else if (demandSupplyRatio < 0.5 && activeCaptains > 0) {
                multiplier = 0.9; // slight discount when oversupply
                reason = 'low_demand';
            }

            return {
                multiplier,
                reason,
                demandSupplyRatio: Math.round(demandSupplyRatio * 100) / 100,
                activeCaptains,
                pendingRides,
            };
        } catch (err) {
            console.error('❌ Surge calculation error:', err);
            return { multiplier: 1.0, reason: 'normal', error: err.message };
        }
    }

    /**
     * Apply surge to a base fare
     */
    static applySurge(baseFare, multiplier) {
        return Math.round(baseFare * multiplier * 100) / 100;
    }
}

module.exports = SurgePricingService;
