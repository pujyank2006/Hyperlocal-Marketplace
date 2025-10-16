// dotenv file to store JWT_SECRET
require('dotenv').config();

// Acquring the requied modules
const express = require('express');
const connectMongodb = require("./connectDb");
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');

// Acquring the requied files
const authRoutes = require('./routes/authRouter');
const userDetailsRoutes = require('./routes/userDetailsRouter');
const listingsRoutes = require('./routes/listingsRouter');

const app = express();
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}));


const PORT = process.env.PORT || 8080;

//Authentication Route
app.use('/auth', authRoutes);

//User Details Route
app.use('/api', userDetailsRoutes);

// Listing Route
const storage = multer.diskStorage({
    destination: function (req, file, cb) {

        const subFolder = req.body.owner || 'default';
        const folderPath = path.join('uploads', subFolder);

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        cb(null, folderPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.filename + '-' + uniqueSuffix);
    }
});

const upload = multer({ storage });

app.use('/api2', upload.array('images', 10), listingsRoutes);

// Connecting MongoDB
connectMongodb("mongodb://localhost:27017/Hyperlocal-Marketplace")
    .then(() => {
        console.log("MongoDB connected");

        // Starting a server
        app.listen(PORT, () => {
            console.log(`Server is running, at ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect to MongoDB", err);
    });