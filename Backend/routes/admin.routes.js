const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middlewares/auth.middlewares');

// Admin-only middleware placeholder: reuse authUser for now.
// In production, add a role check (req.user.role === 'admin').
router.get('/stats',
    authMiddleware.authUser,
    adminController.getStats
)

router.get('/rides/recent',
    authMiddleware.authUser,
    adminController.getRecentRides
)

router.get('/captains',
    authMiddleware.authUser,
    adminController.getCaptains
)

module.exports = router;
