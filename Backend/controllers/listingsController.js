const Listings = require('../models/listings');
const jwt = require('jsonwebtoken');

async function addNewListings (req, res) {
    try {
        const token = req.cookies.token;
        if(!token) {
            res.status(400).json({ success: false, error: "Token not provided!" });
        }
        const decoded_id = jwt.verify(token, process.env.JWT_SECRET);
        const user_id = decoded_id.id;

        const { title, description, category, price, owner } = req.body;

        const imagePaths = req.files.map(file => file.path);

        const newListing = new Listings({
            relatedUser: user_id,
            title,
            description,
            category,
            price,
            owner,
            images: imagePaths
        });

        await newListing.save();

        res.status(200).json({
            success: true,
            message: "Listing created successfully"
        });

    } catch (error) {
        console.error("Error creating listing:", error);
        res.status(500).json({ success: false, message: "Internal server error!!" });
    }
};

async function getListings (req, res) {
    try {
        const token = req.cookies.token;
        if(!token){
            return res.status(400).json({ success: false, error: "Un-authorized user" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userID = decoded.id;

        const listing = await Listings.find({ "relatedUser": userID });

        if(!listing){
            return res.status(400).json({ success: false, error: "Listings details doesn't exist" });
        }
        
        return res.status(200).json({ success: true, message: "Listings details retrieved!", listing });
    } catch (error) {
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

module.exports = {
    addNewListings,
    getListings
}