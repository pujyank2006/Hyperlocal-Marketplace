const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Controller function to update any user details
async function updateDetails(req, res){
    try {
        const token = req.cookies.token;
        if(!token){
            return res.status(400).json({ success: false, error: "Token not provided" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userID = decoded.id;

        const updatedUser = await User.findByIdAndUpdate(
            userID,
            req.body,
            { new: true }
        );

        if(!updatedUser){
            return res.status(401).json({ success: false, message: "Could not find user" })
        }
        res.status(201).json({ success: true, message: "Details updated successfully" })
    } catch(error) {
        res.status(500).json({ success: false, message: "Error occured while updating the user" })
    }
};

// Controller function to get the user details
async function getDetails(req, res){
    try {
        const token = req.cookies.token;
        if(!token){
            return res.status(400).json({ success: false, error: "Un-authorized user" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userID = decoded.id;

        const user = await User.findById(userID).select("-password");

        if(!user){
            return res.status(400).json({ success: false, error: "User details doesn't exist" });
        }
        
        return res.status(200).json({ success: true, message: "User details retrieved!", user });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};

module.exports = {
    updateDetails,
    getDetails
}