const User = require('../models/user');
const jwt = require('jsonwebtoken');

async function updateDetails(req, res){
    try {
        const token = req.cookies.token;
        if(!token){
            return res.status(400).json({ error: "Token not provided" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userID = decoded.id;

        const updatedUser = await User.findByIdAndUpdate(
            userID,
            req.body,
            { new: true }
        );

        if(!updatedUser){
            return res.status(401).json({ message: "Could not find user" })
        }
        res.status(201).json({ message: "Details updated successfully" })
    } catch(error) {
        res.status(500).json({ message: "Error occured while updating the user", success: false })
    }
};

module.exports = {
    updateDetails
}