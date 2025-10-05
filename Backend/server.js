// dotenv file to store JWT_SECRET
require('dotenv').config();

// Acquring the requied modules
const express = require('express');
const connectMongodb = require("./connectDb");
const bodyParser = require('body-parser');
const cors = require('cors');

// Acquring the requied files
const authRoutes = require('./routes/authRouter');
const userDetailsRoutes = require('./routes/userDetailsRouter');

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 8080;

//Authentication Route
app.use('/auth', authRoutes);

//User Details retrieving route
app.use('/api', userDetailsRoutes);


// Connecting MongoDB
connectMongodb("mongodb://localhost:27017/Hyperlocal-Marketplace")
.then(() => {
    console.log("MongoDB connected");
    
    // Starting a server
    app.listen(PORT, () => {
        console.log(process.env.PORT);
        console.log(`Server is running, at ${PORT}`);
    });
})
.catch((err) => {
    console.error("Failed to connect to MongoDB", err);
});