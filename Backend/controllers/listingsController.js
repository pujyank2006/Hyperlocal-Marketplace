const Listings = require('../models/listings');
const User = require('../models/user');
const Wishlist = require('../models/wishlist');
const { resolveCoordinates, calculateDistanceKm } = require('../utils/geoUtils');
const { checkAndNotifyMatches } = require('./savedSearchController');

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
        const coords = resolveCoordinates({
            latitude: user.latitude,
            longitude: user.longitude,
            pincode: user.pincode,
            city: user.city,
            area: user.area
        });

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
            images: imagePaths,
            status: 'Active',
            views: 0,
            contactClicks: 0,
            wishlistCount: 0,
            latitude: coords.lat,
            longitude: coords.lng
        });

        await newListing.save();

        // Trigger alert notifications for users with matching saved searches
        checkAndNotifyMatches(newListing, req.app.get('io')).catch(err => {
            console.error("Alert notification matching error:", err);
        });

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
        const { q, category, locationScope, pincode, city, includeSold, maxDistance } = req.query;

        let query = {};

        // By default, exclude sold items unless explicitly requested
        if (!includeSold || includeSold !== 'true') {
            query.status = { $ne: 'Sold' };
        }

        // Fetch user location if logged in
        let userPincode = pincode;
        let userCity = city;
        let currentUser = null;

        if (userID) {
            currentUser = await User.findById(userID);
            if (currentUser) {
                userPincode = userPincode || currentUser.pincode;
                userCity = userCity || currentUser.city;
            }
        }

        console.log(`[Feed] User Profile DB Fields: city="${userCity}", pincode="${userPincode}", raw latitude=${currentUser?.latitude}, raw longitude=${currentUser?.longitude}`);

        const userCoords = resolveCoordinates({
            latitude: currentUser?.latitude,
            longitude: currentUser?.longitude,
            pincode: userPincode,
            city: userCity,
            area: currentUser?.area,
            label: 'Current User'
        });
        console.log(`[Feed] Resolved User Coords for Distance Calc: (${userCoords.lat}, ${userCoords.lng})`);

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

        let listings = await Listings.find(query).sort({ createdAt: -1 });

        // Retrieve wishlisted listing IDs for current user for fast feed decoration
        let wishlistedSet = new Set();
        if (userID) {
            const userWishlists = await Wishlist.find({ user: userID }).select('listing');
            wishlistedSet = new Set(userWishlists.map(w => w.listing.toString()));
        }

        // Enrich listings with coordinates, distance, and wishlisted state
        const enrichedListings = listings.map(item => {
            const itemObj = item.toObject();
            const itemCoords = resolveCoordinates({
                latitude: itemObj.latitude,
                longitude: itemObj.longitude,
                pincode: itemObj.pincode,
                city: itemObj.city,
                area: itemObj.area,
                id: itemObj._id,
                label: `Item "${itemObj.title}"`
            });

            const distanceKm = calculateDistanceKm(
                userCoords.lat,
                userCoords.lng,
                itemCoords.lat,
                itemCoords.lng,
                'User',
                `Item "${itemObj.title}"`
            );

            console.log(`   🔎 [Feed Result] "${itemObj.title}" (PIN: ${itemObj.pincode}, City: ${itemObj.city}) -> DB coords: (${itemObj.latitude}, ${itemObj.longitude}) -> Resolved: (${itemCoords.lat}, ${itemCoords.lng}) => Distance: ${distanceKm} km`);

            return {
                ...itemObj,
                latitude: itemCoords.lat,
                longitude: itemCoords.lng,
                distanceKm,
                isWishlisted: wishlistedSet.has(itemObj._id.toString())
            };
        });
        console.log(`===========================================================================\n`);

        // Filter by maxDistance radius if provided
        let finalFeed = enrichedListings;
        if (maxDistance && !isNaN(maxDistance) && Number(maxDistance) > 0) {
            const limitKm = Number(maxDistance);
            finalFeed = enrichedListings.filter(item => item.distanceKm !== null && item.distanceKm <= limitKm);
        }

        return res.status(200).json({
            success: true,
            count: finalFeed.length,
            userLocation: {
                pincode: userPincode || "",
                city: userCity || "",
                latitude: userCoords.lat,
                longitude: userCoords.lng
            },
            listings: finalFeed
        });
    } catch (error) {
        console.error("Error fetching feed:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch marketplace feed" });
    }
}

async function getListingDetails(req, res) {
    try {
        const { id } = req.params;
        
        // Increment view counter
        const listing = await Listings.findByIdAndUpdate(
            id,
            { $inc: { views: 1 } },
            { new: true }
        );

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

async function trackContactClick(req, res) {
    try {
        const { id } = req.params;
        const updated = await Listings.findByIdAndUpdate(
            id,
            { $inc: { contactClicks: 1 } },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ success: false, message: "Listing not found" });
        }
        return res.status(200).json({ success: true, contactClicks: updated.contactClicks });
    } catch (error) {
        console.error("Error tracking contact click:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

async function updateListingStatus(req, res) {
    try {
        const userID = req.user.id;
        const { id } = req.params;
        const { status } = req.body;

        if (!['Active', 'Reserved', 'Sold'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value. Must be Active, Reserved, or Sold" });
        }

        const listing = await Listings.findById(id);
        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing not found!" });
        }

        if (listing.relatedUser.toString() !== userID.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized to update status for this listing" });
        }

        listing.status = status;
        await listing.save();

        return res.status(200).json({
            success: true,
            message: `Listing status updated to ${status}!`,
            listing
        });
    } catch (error) {
        console.error("Error updating listing status:", error);
        return res.status(500).json({ success: false, message: "Failed to update listing status" });
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
    trackContactClick,
    updateListingStatus,
    updateListing,
    deleteListing
};