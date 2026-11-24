const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middlewares/auth.middlewares');

// All fleet-operations endpoints require an authenticated admin account.
router.use(authMiddleware.authAdmin);

router.get('/stats', adminController.getStats);
router.get('/rides/recent', adminController.getRecentRides);
router.get('/captains', adminController.getCaptains);
router.get('/captains/locations', adminController.getCaptainLocations);
router.get('/operations', adminController.getOperations);
router.get('/analytics/overview', adminController.getAnalyticsOverview);
router.get('/analytics/daily-rides', adminController.getDailyRides);
router.get('/analytics/revenue-by-vehicle', adminController.getRevenueByVehicle);

module.exports = router;
