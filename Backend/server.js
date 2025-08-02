// Server of Hyperlocal Marketplace
// dotenv file to store JWT_SECRET
require('dotenv').config();

// Acquring the requied modules/files
const express = require('express');
const connectMongodb = require("./connectDb");
const authRoutes = require('./routes/authRouter');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());
const PORT = process.env.PORT || 8080;

//Authentication Route
app.use('/auth', authRoutes);

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