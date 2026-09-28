const Listings = require('../models/listings');

async function addNewListings(req, res) {
    try {
        const user_id = req.user.id;
        const { title, description, category, price, owner } = req.body;

        const imagePaths = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

        const newListing = new Listings({
            relatedUser: user_id,
            title,
            description,
            category,
            price,
            owner: owner || "Anonymous",
            images: imagePaths
        });

        await newListing.save();

        return res.status(201).json({
            success: true,
            message: "Listing created successfully",
            listing: newListing
        });

    } catch (error) {
        console.error("Error creating listing:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

async function getListings(req, res) {
    try {
        const userID = req.user.id;

        const listing = await Listings.find({ relatedUser: userID }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Listings details retrieved!",
            listing
        });
    } catch (error) {
        console.error("Error fetching user listings:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

module.exports = {
    addNewListings,
    getListings
};