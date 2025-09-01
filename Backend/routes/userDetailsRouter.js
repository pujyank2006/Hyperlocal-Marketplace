const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const protect = require('../middlewares/protectMiddleware');
const { findOneAndUpdate } = require('../models/user');
const User = require('../models/user');


router.get('/loggedInUser', protect, (req, res) => {
    res.json(req.user);
});

router.put('/addDetails', async (req, res) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        if(!token){
            res.status(400).json({ error: "Token not provided" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userID = decoded.id;
        const { address } = req.body;

        const updateUser = await User.findByIdAndUpdate(
            userID,
            { address },
            { new: true }
        );

        if(!updateUser){
            res.status(401).json({ message: 'Could not find user', success: false });
        }
        res.status(201).json( { message: "Address updated successfully", success: true });
    } catch (error) {
        console.log("The error is: ", error);
        res.status(500).json({ message: "Error occured while updating", success: false });
    }
});

module.exports = router;