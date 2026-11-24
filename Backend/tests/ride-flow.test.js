/**
 * YENKO ride-flow guarantees: one winner per offer, OTP secrecy, ride-scoped
 * state transitions and a single fare matrix for all vehicle choices.
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongo;
let rideService;
let mapService;
let surgeService;
let Ride;
let Captain;

const captain = (suffix, overrides = {}) => ({
    fullname: { firstname: 'Yenko', lastname: suffix },
    email: `flow.${suffix}.${Date.now()}@example.com`,
    password: 'Password123',
    vehicle: {
        color: 'Black',
        plate: `YR-${suffix.toUpperCase()}`,
        capacity: 1,
        vehicleType: 'okada',
    },
    isVerified: true,
    ...overrides,
});

describe('YENKO ride flow', () => {
    before(async () => {
        mongo = await MongoMemoryServer.create();
        process.env.MONGODB_URL = mongo.getUri('yenko_flow_test');
        process.env.JWT_SECRET = 'yenko-flow-test-secret';

        rideService = require('../services/ride.service');
        mapService = require('../services/maps.service');
        surgeService = require('../services/surge.service');
        Ride = require('../models/ride.model');
        Captain = require('../models/captain.model');
        // Ride documents populate `user`; register the model so Mongoose can
        // resolve the ref even though the account itself is not needed here.
        require('../models/user.model');

        await mongoose.connect(process.env.MONGODB_URL);

        // Deterministic, free fare calculation — no external map calls.
        mapService.getDistanceTime = async () => ({
            distance: { value: 5000 },
            duration: { value: 600 },
        });
        surgeService.calculateSurge = async () => ({ multiplier: 1, reason: 'normal demand' });
    });

    after(async () => {
        await mongoose.disconnect();
        if (mongo) await mongo.stop();
    });

    const newRide = () => rideService.createRide({
        user: new mongoose.Types.ObjectId(),
        pickup: 'Adum, Kumasi',
        destination: 'Kejetia Market, Kumasi',
        vehicleType: 'okada',
        paymentMethod: 'momo',
    });

    it('returns one fare matrix with a price for every vehicle type', async () => {
        const matrix = await rideService.getFareMatrix('Adum, Kumasi', 'Kejetia Market, Kumasi');

        assert.equal(matrix.currency, 'GHS');
        assert.ok(matrix.fares.car && matrix.fares.okada && matrix.fares.pragya);
        assert.equal(Object.keys(matrix.fares).length, Object.keys(rideService.VEHICLE_TYPES).length);
        assert.equal(matrix.fares.car.distanceKm, matrix.fares.okada.distanceKm);
        assert.ok(matrix.fares.motor.finalFare < matrix.fares.pragya.finalFare);
    });

    it('lets only one Captain claim a ride and never returns the OTP to them', async () => {
        const ride = await newRide();
        const first = await Captain.create(captain('first'));
        const second = await Captain.create(captain('second'));

        const claimed = await rideService.confirmRide({ rideId: ride._id, captain: first });
        assert.equal(String(claimed.captain._id), String(first._id));
        assert.equal(claimed.otp, undefined, 'OTP must not leak to Captains');

        const busy = await Captain.findById(first._id);
        assert.equal(busy.onRide, true);

        await assert.rejects(
            () => rideService.confirmRide({ rideId: ride._id, captain: second }),
            /already accepted/i
        );
    });

    it('requires the assigned Captain and correct OTP to start a ride', async () => {
        const ride = await newRide();
        const assigned = await Captain.create(captain('assigned'));
        const other = await Captain.create(captain('other'));
        await rideService.confirmRide({ rideId: ride._id, captain: assigned });

        await assert.rejects(
            () => rideService.startRide({ rideId: ride._id, otp: '123456', captain: other }),
            /not assigned/i
        );

        const secret = await Ride.findById(ride._id).select('+otp');
        const started = await rideService.startRide({ rideId: ride._id, otp: secret.otp, captain: assigned });
        assert.equal(started.status, 'ongoing');
        assert.equal(started.otp, undefined, 'OTP must not be returned after start');
    });

    it('credits earnings on completion and frees the Captain', async () => {
        const ride = await newRide();
        const assigned = await Captain.create(captain('complete'));
        await rideService.confirmRide({ rideId: ride._id, captain: assigned });
        const secret = await Ride.findById(ride._id).select('+otp');
        await rideService.startRide({ rideId: ride._id, otp: secret.otp, captain: assigned });
        await rideService.endRide({ rideId: ride._id, captain: assigned });

        const captainAfter = await Captain.findById(assigned._id);
        assert.equal(captainAfter.onRide, false);
        assert.equal(captainAfter.totalRides, 1);
        assert.equal(captainAfter.earnings, ride.fare);
    });

    it('allows a Rider to cancel a pending ride', async () => {
        const ride = await newRide();
        const cancelled = await rideService.cancelRide({
            rideId: ride._id,
            user: ride.user,
        });

        assert.equal(cancelled.status, 'cancelled');
    });
});
