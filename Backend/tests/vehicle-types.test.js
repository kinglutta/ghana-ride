const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const rideService = require('../services/ride.service');
const mapService = require('../services/maps.service');
const SurgePricingService = require('../services/surge.service');
const Ride = require('../models/ride.model');

const LOCAL_TYPES = ['motor', 'okada', 'pragya'];

test('ride model accepts Motor, Okada and Pragya', () => {
    for (const vehicleType of LOCAL_TYPES) {
        const ride = new Ride({
            user: new mongoose.Types.ObjectId(),
            pickup: 'Adum, Kumasi',
            destination: 'Kejetia Market, Kumasi',
            vehicleType,
            fare: 20,
            otp: '123456',
        });

        assert.equal(ride.validateSync(), undefined, `${vehicleType} should be a valid ride type`);
        assert.equal(ride.vehicleType, vehicleType);
    }
});

test('local ride types have distinct, ordered Ghana-cedi fares', async () => {
    const originalDistance = mapService.getDistanceTime;
    const originalSurge = SurgePricingService.calculateSurge;

    // Keep the fare test deterministic and free — no external map calls.
    mapService.getDistanceTime = async () => ({
        distance: { value: 5000 },
        duration: { value: 600 },
    });
    SurgePricingService.calculateSurge = async () => ({ multiplier: 1, reason: 'normal demand' });

    try {
        const fares = {};
        for (const vehicleType of LOCAL_TYPES) {
            const fare = await rideService.getFare(
                'Adum, Kumasi',
                'Kejetia Market, Kumasi',
                vehicleType
            );

            assert.equal(fare.vehicleType, vehicleType);
            assert.equal(fare.currency, 'GHS');
            assert.ok(fare.finalFare > 0, `${vehicleType} should have a positive fare`);
            fares[vehicleType] = fare.finalFare;
        }

        assert.ok(fares.motor < fares.okada, 'Motor should be the lowest-cost ride');
        assert.ok(fares.okada < fares.pragya, 'Pragya should cost more than an Okada');
    } finally {
        mapService.getDistanceTime = originalDistance;
        SurgePricingService.calculateSurge = originalSurge;
    }
});
