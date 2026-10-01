const Listings = require('../models/listings');
const User = require('../models/user');

async function addNewListings(req, res) {
    try {
        const userID = req.user.id;
        const { title, description, category, price } = req.body;

        if (!title || !category || !price) {
            return res.status(400).json({
                success: false,
                message: "Title, category, and price are required!"
            });
        }

        // Fetch user location details
        const user = await User.findById(userID);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found!" });
        }

        const imagePaths = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

        const newListing = new Listings({
            relatedUser: userID,
            title: title.trim(),
            description: description ? description.trim() : "",
            category: category.trim(),
            price: Number(price),
            owner: user.name || "Anonymous",
            city: user.city || "",
            area: user.area || "",
            pincode: user.pincode || "",
            images: imagePaths
        });

        await newListing.save();

        return res.status(201).json({
            success: true,
            message: "Listing created successfully!",
            listing: newListing
        });

    } catch (error) {
        console.error("Error creating listing:", error);
        return res.status(500).json({ success: false, message: "Failed to create listing" });
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

async function getMarketplaceFeed(req, res) {
    try {
        const userID = req.user ? req.user.id : null;
        const { q, category, locationScope, pincode, city } = req.query;

        let query = {};

        // Fetch user location if logged in
        let userPincode = pincode;
        let userCity = city;

        if (userID && (!userPincode || !userCity)) {
            const currentUser = await User.findById(userID);
            if (currentUser) {
                userPincode = userPincode || currentUser.pincode;
                userCity = userCity || currentUser.city;
            }
        }

        // Location Scope Filter: 'pincode', 'city', or 'all'
        if (locationScope === 'pincode' && userPincode) {
            query.pincode = userPincode;
        } else if (locationScope === 'city' && userCity) {
            query.city = new RegExp(`^${userCity}$`, 'i');
        } else if (locationScope === 'custom_pincode' && pincode) {
            query.pincode = pincode;
        }

        // Category Filter
        if (category && category !== 'All') {
            query.category = new RegExp(`^${category.trim()}$`, 'i');
        }

        // Text Search (title & description & category & area)
        if (q && q.trim() !== '') {
            const searchRegex = new RegExp(q.trim(), 'i');
            query.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { category: searchRegex },
                { area: searchRegex }
            ];
        }

        const listings = await Listings.find(query).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: listings.length,
            userLocation: {
                pincode: userPincode || "",
                city: userCity || ""
            },
            listings
        });
    } catch (error) {
        console.error("Error fetching feed:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch marketplace feed" });
    }
}

async function getListingDetails(req, res) {
    try {
        const { id } = req.params;
        const listing = await Listings.findById(id);

        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing not found!" });
        }

        // Fetch seller details from User model
        let sellerInfo = null;
        if (listing.relatedUser) {
            const seller = await User.findById(listing.relatedUser).select("name email phone state city area pincode");
            if (seller) {
                sellerInfo = {
                    name: seller.name,
                    phone: seller.phone,
                    email: seller.email,
                    city: seller.city,
                    area: seller.area,
                    pincode: seller.pincode
                };
            }
        }

        return res.status(200).json({
            success: true,
            listing,
            seller: sellerInfo || {
                name: listing.owner,
                city: listing.city,
                area: listing.area,
                pincode: listing.pincode
            }
        });
    } catch (error) {
        console.error("Error fetching listing details:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch listing details" });
    }
}

async function updateListing(req, res) {
    try {
        const userID = req.user.id;
        const { id } = req.params;
        const { title, description, category, price, existingImages } = req.body;

        const listing = await Listings.findById(id);
        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing not found!" });
        }

        if (listing.relatedUser !== userID) {
            return res.status(403).json({ success: false, message: "Unauthorized to edit this listing!" });
        }

        let updatedImages = [];
        if (existingImages) {
            updatedImages = Array.isArray(existingImages) ? existingImages : [existingImages];
        }

        if (req.files && req.files.length > 0) {
            const newImagePaths = req.files.map(file => `/uploads/${file.filename}`);
            updatedImages = [...updatedImages, ...newImagePaths];
        }

        if (title) listing.title = title.trim();
        if (description !== undefined) listing.description = description.trim();
        if (category) listing.category = category.trim();
        if (price) listing.price = Number(price);
        listing.images = updatedImages;

        await listing.save();

        return res.status(200).json({
            success: true,
            message: "Listing updated successfully!",
            listing
        });
    } catch (error) {
        console.error("Error updating listing:", error);
        return res.status(500).json({ success: false, message: "Failed to update listing" });
    }
}

async function deleteListing(req, res) {
    try {
        const userID = req.user.id;
        const { id } = req.params;

        const listing = await Listings.findById(id);
        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing not found!" });
        }

        if (listing.relatedUser !== userID) {
            return res.status(403).json({ success: false, message: "Unauthorized to delete this listing!" });
        }

        await Listings.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Listing deleted successfully!"
        });
    } catch (error) {
        console.error("Error deleting listing:", error);
        return res.status(500).json({ success: false, message: "Failed to delete listing" });
    }
}

module.exports = {
    addNewListings,
    getListings,
    getMarketplaceFeed,
    getListingDetails,
    updateListing,
    deleteListing
};