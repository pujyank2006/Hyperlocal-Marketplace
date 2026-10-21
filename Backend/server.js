require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

// Route imports
const authRoutes = require('./routes/authRouter');
const userDetailsRoutes = require('./routes/userDetailsRouter');
const listingsRoutes = require('./routes/listingsRouter');
const chatRoutes = require('./routes/chatRouter');
const wishlistRoutes = require('./routes/wishlistRouter');
const savedSearchRoutes = require('./routes/savedSearchRouter');
const notificationRoutes = require('./routes/notificationRouter');
const paymentRoutes = require('./routes/paymentRouter');
const reviewRoutes = require('./routes/reviewRouter');

const app = express();
const server = http.createServer(app);

// Enable CORS for frontend dev ports
const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

// Setup Socket.io
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});

io.on('connection', (socket) => {
    socket.on('join_room', (roomId) => {
        if (roomId) {
            socket.join(roomId);
        }
    });

    socket.on('leave_room', (roomId) => {
        if (roomId) {
            socket.leave(roomId);
        }
    });

    socket.on('disconnect', () => {
    });
});

app.set('io', io);

app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());

// Serve static uploaded files publicly
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

const PORT = process.env.PORT || 9000;

// Unified RESTful routes (/api/v1/...)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userDetailsRoutes);
app.use('/api/v1/listings', listingsRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/saved-searches', savedSearchRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/reviews', reviewRoutes);

// Legacy route aliases for backwards compatibility
app.use('/auth', authRoutes);
app.use('/api', userDetailsRoutes);
app.use('/api2', listingsRoutes);
app.use('/api3', listingsRoutes);

// Global Error Handler
app.use(errorHandler);

// Connecting MongoDB and launching HTTP + Socket server
connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Server with Socket.io running on http://localhost:${PORT}`);
    });
});
