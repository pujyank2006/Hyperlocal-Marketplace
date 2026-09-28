const User = require('../models/user');

// Controller function to update any user details
async function updateDetails(req, res) {
    try {
        const userID = req.user.id;

        // Prevent password mutation through plain update endpoint
        const updateData = { ...req.body };
        delete updateData.password;

        const updatedUser = await User.findByIdAndUpdate(
            userID,
            updateData,
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Details updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error("Update details error:", error);
        return res.status(500).json({ success: false, message: "Error occurred while updating the user details" });
    }
}

// Controller function to get user details
async function getDetails(req, res) {
    try {
        const userID = req.user.id;

        const user = await User.findById(userID).select("-password");

        if (!user) {
            return res.status(404).json({ success: false, error: "User details don't exist" });
        }

        return res.status(200).json({
            success: true,
            message: "User details retrieved!",
            user
        });
    } catch (error) {
        console.error("Get details error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

module.exports = {
    updateDetails,
    getDetails
};