/**
 * YENKO RIDE — backend integration tests.
 *
 * Runs the real Express app against an in-memory MongoDB, so no external
 * services or paid APIs are involved. Uses Node's built-in test runner.
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongo;
let server;
let baseUrl;

// Shared state populated by the auth tests and reused by protected-route tests.
const state = {
    riderToken: '',
    riderEmail: `rider.${Date.now()}@example.com`,
    captainToken: '',
    captainEmail: `captain.${Date.now()}@example.com`,
    adminToken: '',
    adminEmail: `admin.${Date.now()}@example.com`,
};

before(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URL = mongo.getUri('yenko_test');
    process.env.JWT_SECRET = 'yenko-integration-test-secret';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.ADMIN_SIGNUP_CODES = 'yenko-admin-test-code, second-test-code';

    // app.js connects to the database when required, so env must be set first.
    const app = require('../app');
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    for (let i = 0; i < 100 && mongoose.connection.readyState !== 1; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.equal(mongoose.connection.readyState, 1, 'Mongoose failed to connect to the test database');
});

after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
});

/** Small fetch helper that always parses JSON when possible. */
async function api(path, { method = 'GET', token, body } = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    let data = text;
    try {
        data = JSON.parse(text);
    } catch {
        // Non-JSON responses are returned as text.
    }
    return { status: response.status, data };
}

describe('YENKO RIDE API', () => {
    it('serves a branded health check', async () => {
        const root = await api('/');
        assert.equal(root.status, 200);
        assert.equal(root.data.status, 'healthy');
        assert.match(root.data.message, /YENKO/);

        const health = await api('/health');
        assert.equal(health.status, 200);
        assert.equal(health.data.status, 'healthy');
        assert.ok(typeof health.data.uptime === 'number');
    });

    it('allows browser PATCH requests through CORS', async () => {
        // Regression: admin queue actions and SOS resolution use axios.patch.
        const response = await fetch(`${baseUrl}/safety/alerts/unknown/resolve`, {
            method: 'OPTIONS',
            headers: {
                Origin: 'http://localhost:5173',
                'Access-Control-Request-Method': 'PATCH',
                'Access-Control-Request-Headers': 'content-type,authorization',
            },
        });
        const allowed = response.headers.get('access-control-allow-methods') || '';
        assert.match(allowed, /PATCH/);
    });

    it('validates rider registration input', async () => {
        const res = await api('/users/register', {
            method: 'POST',
            body: { email: 'not-an-email', fullname: { firstname: 'A' }, password: '123' },
        });
        assert.equal(res.status, 400);
        assert.ok(Array.isArray(res.data.errors));
    });

    it('registers and logs in a rider', async () => {
        const registered = await api('/users/register', {
            method: 'POST',
            body: {
                fullname: { firstname: 'Test', lastname: 'Rider' },
                email: state.riderEmail,
                password: 'password123',
            },
        });
        assert.equal(registered.status, 201, JSON.stringify(registered.data));
        assert.ok(registered.data.token);
        state.riderToken = registered.data.token;

        const loggedIn = await api('/users/login', {
            method: 'POST',
            body: { email: state.riderEmail, password: 'password123' },
        });
        assert.equal(loggedIn.status, 200);
        assert.ok(loggedIn.data.token);

        const rejected = await api('/users/login', {
            method: 'POST',
            body: { email: state.riderEmail, password: 'wrongpassword' },
        });
        assert.equal(rejected.status, 400);
        assert.match(rejected.data.message, /Invalid email or password/);
    });

    it('requires a valid invite code for admin onboarding', async () => {
        const userModel = require('../models/user.model');
        const baseBody = {
            fullname: { firstname: 'Yenko', lastname: 'Operations' },
            email: state.adminEmail,
            password: 'Admin12345',
            role: 'admin',
        };

        const denied = await api('/users/register', {
            method: 'POST',
            body: { ...baseBody, adminCode: 'not-the-code' },
        });
        assert.equal(denied.status, 403, JSON.stringify(denied.data));
        assert.match(denied.data.message, /admin access code/i);
        assert.equal(await userModel.exists({ email: state.adminEmail }), null);

        const granted = await api('/users/register', {
            method: 'POST',
            body: { ...baseBody, adminCode: 'yenko-admin-test-code' },
        });
        assert.equal(granted.status, 201, JSON.stringify(granted.data));
        assert.equal(granted.data.user.role, 'admin');
        state.adminToken = granted.data.token;

        const stats = await api('/admin/stats', { token: state.adminToken });
        assert.equal(stats.status, 200, JSON.stringify(stats.data));
    });

    it('never promotes a rider who omits the admin code', async () => {
        const res = await api('/users/register', {
            method: 'POST',
            body: {
                fullname: { firstname: 'Sneaky', lastname: 'Rider' },
                email: `rider.no.code.${Date.now()}@example.com`,
                password: 'password123',
                role: 'admin',
            },
        });
        assert.equal(res.status, 403, JSON.stringify(res.data));

        const normal = await api('/users/register', {
            method: 'POST',
            body: {
                fullname: { firstname: 'Plain', lastname: 'Rider' },
                email: `rider.normal.${Date.now()}@example.com`,
                password: 'password123',
            },
        });
        assert.equal(normal.status, 201, JSON.stringify(normal.data));
        assert.equal(normal.data.user.role, 'rider');
    });

    it('protects the rider profile route', async () => {
        const anonymous = await api('/users/profile');
        assert.equal(anonymous.status, 401);

        const profile = await api('/users/profile', { token: state.riderToken });
        assert.equal(profile.status, 200);
        assert.equal(profile.data.user?.email || profile.data.email, state.riderEmail);
    });

    it('registers and authenticates a captain', async () => {
        const registered = await api('/captains/register', {
            method: 'POST',
            body: {
                fullname: { firstname: 'Yenko', lastname: 'Captain' },
                email: state.captainEmail,
                password: 'Test12345',
                vehicle: { color: 'Black', plate: 'GH-YEN-001', capacity: 4, vehicleType: 'car' },
            },
        });
        assert.equal(registered.status, 201, JSON.stringify(registered.data));
        assert.ok(registered.data.token);
        state.captainToken = registered.data.token;

        const profile = await api('/captains/profile', { token: state.captainToken });
        assert.equal(profile.status, 200);
    });

    it('returns a captain earnings summary without crashing', async () => {
        // Regression: getEarningsSummary used Ride without importing the model.
        const res = await api('/payout/earnings', { token: state.captainToken });
        assert.equal(res.status, 200, JSON.stringify(res.data));
        assert.equal(typeof res.data.completedRides, 'number');
        assert.equal(typeof res.data.totalEarnings, 'number');
    });

    it('returns a numeric notifications unread count', async () => {
        // Regression: this endpoint previously crashed with
        // "Notification.countDocuments is not a function".
        const res = await api('/notifications/unread-count', { token: state.riderToken });
        assert.equal(res.status, 200, JSON.stringify(res.data));
        assert.equal(typeof res.data.unreadCount, 'number');
        assert.equal(res.data.unreadCount, 0);
    });

    it('lists notifications and registers a push token', async () => {
        const list = await api('/notifications', { token: state.riderToken });
        assert.equal(list.status, 200);
        assert.ok(Array.isArray(list.data));

        const invalid = await api('/notifications/register-push-token', {
            method: 'POST',
            token: state.riderToken,
            body: {},
        });
        assert.equal(invalid.status, 400);

        const valid = await api('/notifications/register-push-token', {
            method: 'POST',
            token: state.riderToken,
            body: { token: 'web-push-token-test', deviceType: 'web' },
        });
        assert.equal(valid.status, 200);
    });

    it('validates and creates a ride dispute', async () => {
        const invalid = await api('/disputes/create', {
            method: 'POST',
            token: state.riderToken,
            body: { rideId: 'not-an-id', reason: 'not_a_reason' },
        });
        assert.equal(invalid.status, 400);

        // The dispute service requires a real ride to exist.
        const userModel = require('../models/user.model');
        const Ride = require('../models/ride.model');
        const rider = await userModel.findOne({ email: state.riderEmail });
        const ride = await Ride.create({
            user: rider._id,
            pickup: 'Adum, Kumasi',
            destination: 'Kejetia Market, Kumasi',
            fare: 25,
            otp: '1234',
        });

        const valid = await api('/disputes/create', {
            method: 'POST',
            token: state.riderToken,
            body: {
                rideId: ride._id.toString(),
                reason: 'driver_no_show',
                description: 'Captain did not arrive at the pickup point.',
            },
        });
        assert.equal(valid.status, 201, JSON.stringify(valid.data));

        const mine = await api('/disputes/my', { token: state.riderToken });
        assert.equal(mine.status, 200);
        assert.ok(Array.isArray(mine.data));
    });

    it('keeps ride chat private to its two participants', async () => {
        const userModel = require('../models/user.model');
        const captainModel = require('../models/captain.model');
        const Ride = require('../models/ride.model');
        const rider = await userModel.findOne({ email: state.riderEmail });
        const captain = await captainModel.findOne({ email: state.captainEmail });
        const ride = await Ride.create({
            user: rider._id,
            captain: captain._id,
            pickup: 'Adum, Kumasi',
            destination: 'Kejetia Market, Kumasi',
            fare: 10,
            otp: '1111',
            status: 'ongoing',
        });

        const sent = await api('/chat/send', {
            method: 'POST',
            token: state.riderToken,
            body: { rideId: ride._id.toString(), message: 'Hello captain' },
        });
        assert.equal(sent.status, 201, JSON.stringify(sent.data));
        assert.equal(String(sent.data.chatMessage.recipient), String(captain._id));

        const captainHistory = await api(`/chat/history/${ride._id}`, { token: state.captainToken });
        assert.equal(captainHistory.status, 200, JSON.stringify(captainHistory.data));
        assert.equal(captainHistory.data.length, 1);

        const reply = await api('/chat/send', {
            method: 'POST',
            token: state.captainToken,
            body: { rideId: ride._id.toString(), message: 'On my way' },
        });
        assert.equal(reply.status, 201, JSON.stringify(reply.data));
        assert.equal(String(reply.data.chatMessage.recipient), String(rider._id));

        const outsider = await api(`/chat/history/${ride._id}`);
        assert.equal(outsider.status, 401);

        state.chatRideId = ride._id.toString();
    });

    it('creates and revokes a privacy-safe live trip link', async () => {
        const created = await api('/trip/share', {
            method: 'POST',
            token: state.riderToken,
            body: { rideId: state.chatRideId, minutes: 10 },
        });
        assert.equal(created.status, 201, JSON.stringify(created.data));
        assert.match(created.data.url, /\/trip\//);

        const token = created.data.token;
        const publicView = await api(`/trip/${token}`);
        assert.equal(publicView.status, 200, JSON.stringify(publicView.data));
        assert.equal(publicView.data.ride.status, 'ongoing');
        assert.ok(publicView.data.captain.firstname);
        assert.equal(publicView.data.otp, undefined);
        assert.equal(publicView.data.user, undefined);

        const revoked = await api(`/trip/${token}`, { method: 'DELETE', token: state.riderToken });
        assert.equal(revoked.status, 200);
        const gone = await api(`/trip/${token}`);
        assert.equal(gone.status, 404);
    });

    it('only dispatches verified captains', async () => {
        const captainModel = require('../models/captain.model');
        const captain = await captainModel.findOne({ email: state.captainEmail });
        captain.isVerified = false;
        await captain.save();

        const pending = await api('/captains/update-location', {
            method: 'POST',
            token: state.captainToken,
            body: { location: { ltd: 5.6037, lng: -0.187 } },
        });
        assert.equal(pending.status, 200, JSON.stringify(pending.data));
        assert.equal(pending.data.status, 'inactive');
        assert.equal(pending.data.isVerified, false);

        captain.isVerified = true;
        await captain.save();

        const verified = await api('/captains/update-location', {
            method: 'POST',
            token: state.captainToken,
            body: { location: { ltd: 5.6037, lng: -0.187 } },
        });
        assert.equal(verified.status, 200);
        assert.equal(verified.data.status, 'active');
        assert.equal(verified.data.isVerified, true);
    });

    it('blocks non-admin riders from the fleet command centre', async () => {
        const stats = await api('/admin/stats', { token: state.riderToken });
        assert.equal(stats.status, 403);
        assert.match(stats.data.message, /Admin access required/);

        const operations = await api('/admin/operations', { token: state.riderToken });
        assert.equal(operations.status, 403);

        const reviews = await api('/driver-verification/pending', { token: state.riderToken });
        assert.equal(reviews.status, 403);
        const payouts = await api('/payout/all', { token: state.riderToken });
        assert.equal(payouts.status, 403);
        const alerts = await api('/safety/alerts', { token: state.riderToken });
        assert.equal(alerts.status, 403);
    });

    it('serves live operations and captain locations to an admin', async () => {
        const userModel = require('../models/user.model');
        await userModel.updateOne({ email: state.riderEmail }, { $set: { role: 'admin' } });

        const stats = await api('/admin/stats', { token: state.riderToken });
        assert.equal(stats.status, 200, JSON.stringify(stats.data));

        const operations = await api('/admin/operations', { token: state.riderToken });
        assert.equal(operations.status, 200, JSON.stringify(operations.data));
        assert.ok(operations.data.counts);
        assert.ok(operations.data.queues);
        assert.equal(typeof operations.data.counts.activeRides, 'number');

        const locations = await api('/admin/captains/locations', { token: state.riderToken });
        assert.equal(locations.status, 200);
        assert.ok(Array.isArray(locations.data));
    });

    it('lets operations reject a captain with a review note', async () => {
        const submitted = await api('/driver-verification/submit', {
            method: 'POST',
            token: state.captainToken,
            body: { documents: [{ type: 'license', url: 'data:image/png;base64,test' }] },
        });
        assert.equal(submitted.status, 201, JSON.stringify(submitted.data));

        // The rider account was promoted to admin by the previous test.
        const pending = await api('/driver-verification/pending', { token: state.riderToken });
        assert.equal(pending.status, 200);
        const item = pending.data.find(
            (entry) => String(entry.captain?._id) === String(submitted.data.verification.captain)
        );
        assert.ok(item, 'submitted verification should appear in the admin queue');

        const reviewed = await api(`/driver-verification/${item._id}/review`, {
            method: 'PATCH',
            token: state.riderToken,
            body: { status: 'rejected', reviewNote: 'Please upload a clearer licence.' },
        });
        assert.equal(reviewed.status, 200, JSON.stringify(reviewed.data));
        assert.equal(reviewed.data.verification.status, 'rejected');
        assert.equal(reviewed.data.verification.reviewNote, 'Please upload a clearer licence.');

        const mine = await api('/driver-verification/me', { token: state.captainToken });
        assert.equal(mine.status, 200);
        assert.equal(mine.data.status, 'rejected');
    });
});
