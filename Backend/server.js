require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const app = require('./app');

const port = process.env.PORT || 3000;

// Validate required environment variables before starting the server.
const validateEnvironment = () => {
    const requiredVars = ['MONGODB_URL', 'JWT_SECRET'];

    console.log('Validating environment variables...');

    for (const varName of requiredVars) {
        if (!process.env[varName]) {
            console.error(`Missing required environment variable: ${varName}`);
            process.exit(1);
        }
        console.log(`${varName}: configured`);
    }

    console.log('Environment validation complete');
};

validateEnvironment();

const server = http.createServer(app);

// Initialize Socket.IO with environment-specific CORS.
// Socket.IO requires RegExp (not "*" strings) for wildcard origin matching.
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        process.env.FRONTEND_URL || 'https://yenkoroide.vercel.app',
        /^https:\/\/.*\.vercel\.app$/,
        /^https:\/\/.*\.onrender\.com$/,
    ]
    : [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://localhost:4000',
    ];

console.log('Socket.IO CORS allowed origins:', allowedOrigins.map((o) => String(o)));
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Frontend URL:', process.env.FRONTEND_URL);

const io = socketIo(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: false,
        allowedHeaders: ['Content-Type', 'Authorization'],
    },
    transports: ['polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e6,
});

// Make Socket.IO instance available to the app.
app.set('io', io);

/**
 * Identity for socket rooms always comes from a verified token. Client-supplied
 * userId/userType values are ignored — otherwise any visitor could join the
 * admin room and read safety alerts.
 */
const authenticateSocketToken = async (token) => {
    if (!token) return null;

    const blacklistTokenModel = require('./models/blacklistToken.model');
    if (await blacklistTokenModel.findOne({ token })) {
        throw new Error('Session expired');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [userModel, captainModel] = await Promise.all([
        require('./models/user.model'),
        require('./models/captain.model'),
    ]);

    const [user, captain] = await Promise.all([
        userModel.findById(decoded._id),
        captainModel.findById(decoded._id),
    ]);

    if (user) {
        return {
            id: String(user._id),
            role: user.role === 'admin' ? 'admin' : 'user',
            account: user,
        };
    }
    if (captain) {
        return { id: String(captain._id), role: 'captain', account: captain };
    }
    return null;
};

/** Only deliver targeted ride events to people who actually belong to it. */
const rideRecipients = async (rideId, identity) => {
    if (!rideId || !identity) return null;

    const ride = await require('./models/ride.model').findById(rideId).lean();
    if (!ride) return null;

    const rider = ride.user ? String(ride.user) : null;
    const captain = ride.captain ? String(ride.captain) : null;
    if (identity.id !== rider && identity.id !== captain) return null;

    return [rider, captain].filter(Boolean);
};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    const can = (...roles) => !!socket.identity && roles.includes(socket.identity.role);

    socket.on('join', async (data) => {
        try {
            const identity = await authenticateSocketToken(data?.token);
            if (!identity) {
                return socket.emit('join-error', { message: 'Please sign in again' });
            }

            socket.identity = identity;
            socket.userId = identity.id;
            socket.userType = identity.role === 'admin' ? 'admin' : identity.role;

            // Exact-ID rooms power targeted ride events. Legacy role rooms stay
            // for older screens; per-account rooms prevent cross-account leaks.
            socket.join(identity.id);
            socket.join(`${identity.role}:${identity.id}`);
            socket.join(socket.userType);
            if (identity.role === 'admin') socket.join('admin');

            if (identity.role === 'captain') {
                try {
                    const captainModel = require('./models/captain.model');
                    await captainModel.findByIdAndUpdate(identity.id, { socketId: socket.id });
                    console.log('Captain socketId updated in database:', socket.id);
                } catch (error) {
                    console.error('Error updating captain socketId:', error);
                }
            }

            const confirmation = {
                userType: socket.userType,
                userId: identity.id,
                role: identity.role,
                socketId: socket.id,
            };
            socket.emit('join-confirmed', confirmation);
            // Alias used by the captain home screen; keeps the old listener working.
            socket.emit('connection-confirmed', confirmation);

            if (identity.role === 'captain') {
                socket.emit('test-captain-connection', { message: 'Captain connection successful!' });
            }
        } catch (error) {
            socket.emit('join-error', { message: 'Could not verify your session' });
        }
    });

    /**
     * Ride-scoped rooms. Identity comes from the same verified token, so only
     * the Rider and Captain on a ride can hear its chat messages.
     */
    socket.on('ride:join', async (data) => {
        const reject = (message) => socket.emit('ride:join-error', { message });

        try {
            const identity = await authenticateSocketToken(data?.token);
            if (!identity) return reject('Please sign in again');
            if (identity.role === 'admin') return reject('Admin accounts cannot join ride chat');

            const ride = await require('./models/ride.model').findById(data?.rideId);
            if (!ride) return reject('Ride not found');

            const isRider = identity.role === 'user' && ride.user && String(ride.user) === identity.id;
            const isCaptain = identity.role === 'captain' && ride.captain && String(ride.captain) === identity.id;
            if (!isRider && !isCaptain) return reject('You are not part of this ride');

            socket.identity = socket.identity || identity;
            socket.join(identity.id);
            socket.join(`${identity.role}:${identity.id}`);
            socket.join(`ride:${data.rideId}`);
            socket.emit('ride:joined', { rideId: data.rideId, role: identity.role });
        } catch (error) {
            reject('Could not verify your session');
        }
    });

    socket.on('update-location-captain', (data) => {
        if (!can('captain')) return;
        socket.to('user').emit('captain-location-update', data);
    });

    socket.on('ride-request', (data) => {
        if (!can('user')) return;
        socket.to('captain').emit('new-ride-request', data);
    });

    socket.on('ride-accepted', async (data) => {
        if (!can('captain')) return;
        try {
            const recipients = await rideRecipients(data?.ride?._id || data?.rideId || data?._id, socket.identity);
            if (!recipients) return;
            recipients.forEach((id) => io.to(id).emit('ride-accepted', data));
        } catch (error) {
            console.error('Could not verify ride for acceptance event:', error.message);
        }
    });

    socket.on('ride-completed', async (data) => {
        if (!can('captain')) return;
        try {
            const recipients = await rideRecipients(data?.ride?._id || data?.rideId || data?._id, socket.identity);
            if (!recipients) return;
            recipients.forEach((id) => io.to(id).emit('ride-completed', data));
        } catch (error) {
            console.error('Could not verify ride for completion event:', error.message);
        }
    });

    socket.on('ride-declined', (data) => {
        if (!can('captain')) return;
        console.log('Ride declined by captain:', data);
        socket.to('user').emit('ride-declined', data);
    });

    socket.on('ride-paid', (data) => {
        // PaymentPage emits this after a successful REST payment.
        if (!can('user')) return;
        socket.to('user').emit('ride-paid', data);
        socket.to('captain').emit('ride-paid', data);
    });

    // Chat is delivered server-side to ride:<rideId> after persistence.
    // A client-emitted chat event is deliberately ignored to prevent spoofing.

    socket.on('sos-activated', (data) => {
        if (!can('user')) return;
        socket.to('admin').emit('sos-alert', data);
    });

    socket.on('sos-resolved', (data) => {
        if (!can('user')) return;
        socket.to('admin').emit('sos-resolved', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(port, () => {
    console.log(`YENKO RIDE server is running on port ${port}`);
    console.log('Socket.IO server is ready');
});
