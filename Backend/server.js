const express = require('express');
const connectMongodb = require("./connectDb");
const app = express();

const PORT = 9000;


app.use(express.json());

// Connecting MongoDB
connectMongodb("");
app.listen(PORT, () => {
    console.log(`Server is running, at ${PORT}`);
});