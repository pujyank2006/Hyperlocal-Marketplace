require('dotenv').config();

const express = require('express');
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

const app = express();

// Enable CORS for frontend dev ports
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
}));

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

// Legacy route aliases for backwards compatibility
app.use('/auth', authRoutes);
app.use('/api', userDetailsRoutes);
app.use('/api2', listingsRoutes);
app.use('/api3', listingsRoutes);

// Global Error Handler
app.use(errorHandler);

// Connecting MongoDB and launching server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
    });
});