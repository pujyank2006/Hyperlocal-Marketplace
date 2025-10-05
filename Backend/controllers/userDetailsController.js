const User = require('../models/user');
const jwt = require('jsonwebtoken');

// Controller function to add a new address.
async function addAddress(req, res){
    try {
        const token = req.headers.authorization.split(" ")[1];
        if(!token){
            return res.status(400).json({ error: "Token not provided" });
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
            return res.status(401).json({ message: 'Could not find user', success: false });
        }
        res.status(201).json( { message: "Address updated successfully", success: true });
    } catch (error) {
        console.log("The error is: ", error);
        res.status(500).json({ message: "Error occured while updating", success: false });
    }
};

async function updateDetails(req, res){
    try {
        const token = req.headers.authorization.split(" ")[1];
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
    addAddress,
    updateDetails
}