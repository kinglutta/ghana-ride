require('dotenv').config();
const http = require('http');
const socketIo = require('socket.io');
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
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
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

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join', async (data) => {
        const { userType, userId } = data;
        console.log(`${userType} joined:`, socket.id, 'userId:', userId);
        socket.join(userType);
        socket.userId = userId;
        socket.userType = userType;

        if (userType === 'captain') {
            try {
                const captainModel = require('./models/captain.model');
                await captainModel.findByIdAndUpdate(userId, { socketId: socket.id });
                console.log('Captain socketId updated in database:', socket.id);
            } catch (error) {
                console.error('Error updating captain socketId:', error);
            }
        }

        socket.emit('join-confirmed', { userType, userId, socketId: socket.id });

        if (userType === 'captain') {
            socket.emit('test-captain-connection', { message: 'Captain connection successful!' });
        }
    });

    socket.on('update-location-captain', (data) => {
        socket.to('user').emit('captain-location-update', data);
    });

    socket.on('ride-request', (data) => {
        socket.to('captain').emit('new-ride-request', data);
    });

    socket.on('ride-accepted', (data) => {
        io.to(data.userId).emit('ride-accepted', data);
    });

    socket.on('ride-completed', (data) => {
        io.to(data.userId).emit('ride-completed', data);
        io.to(data.captainId).emit('ride-completed', data);
    });

    socket.on('ride-declined', (data) => {
        console.log('Ride declined by captain:', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(port, () => {
    console.log(`YENKO RIDE server is running on port ${port}`);
    console.log('Socket.IO server is ready');
});
