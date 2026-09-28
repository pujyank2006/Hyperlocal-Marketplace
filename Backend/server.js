// dotenv file to store JWT_SECRET and MONGO_URL
require('dotenv').config();

// Acquiring required modules
const express = require('express');
const connectMongodb = require("./connectDb");
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

// Acquiring route files
const authRoutes = require('./routes/authRouter');
const userDetailsRoutes = require('./routes/userDetailsRouter');
const listingsRoutes = require('./routes/listingsRouter');

const app = express();

// Enable CORS for frontend dev ports (3000 and 3001)
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

// Legacy routes for backwards compatibility
app.use('/auth', authRoutes);
app.use('/api', userDetailsRoutes);
app.use('/api2', listingsRoutes);
app.use('/api3', listingsRoutes);

// MongoDB connection URL logic
const baseMongoUrl = process.env.MONGO_URL || "mongodb://localhost:27017";
const mongoUri = baseMongoUrl.includes("Hyperlocal-Marketplace")
    ? baseMongoUrl
    : `${baseMongoUrl.replace(/\/$/, '')}/Hyperlocal-Marketplace`;

// Connecting MongoDB and launching server
connectMongodb(mongoUri)
    .then(() => {
        console.log(`MongoDB connected`);

        app.listen(PORT, () => {
            console.log(`Server is running at http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to MongoDB", err);
    });