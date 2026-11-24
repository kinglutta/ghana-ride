const express = require('express');
const router = express.Router();
const safetyController = require('../controllers/safety.controller');
const authMiddleware = require('../middlewares/auth.middlewares');
const { body } = require('express-validator');

router.get(
    '/contacts',
    authMiddleware.authUser,
    safetyController.getEmergencyContacts
);

router.post(
    '/contacts',
    authMiddleware.authUser,
    safetyController.addEmergencyContact
);

router.delete(
    '/contacts/:id',
    authMiddleware.authUser,
    safetyController.removeEmergencyContact
);

router.post(
    '/sos',
    authMiddleware.authUser,
    safetyController.activateSOS
);

// Admin routes
router.get(
    '/alerts',
    authMiddleware.authAdmin,
    safetyController.getSOSAlerts
);

// The owner of an alert (or an admin) can resolve it.
router.patch(
    '/alerts/:id/resolve',
    authMiddleware.authUser,
    safetyController.resolveSOSAlert
);

module.exports = router;
