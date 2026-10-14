const Wishlist = require('../models/wishlist');
const Listings = require('../models/listings');
const User = require('../models/user');
const { resolveCoordinates, calculateDistanceKm } = require('../utils/geoUtils');

/**
 * Toggle a listing in the user's wishlist
 */
async function toggleWishlist(req, res) {
    try {
        const userID = req.user.id;
        const { listingId } = req.params;

        const listing = await Listings.findById(listingId);
        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing not found" });
        }

        const existing = await Wishlist.findOne({ user: userID, listing: listingId });

        if (existing) {
            await Wishlist.findByIdAndDelete(existing._id);
            const updated = await Listings.findByIdAndUpdate(
                listingId,
                { $inc: { wishlistCount: -1 } },
                { new: true }
            );
            return res.status(200).json({
                success: true,
                isWishlisted: false,
                wishlistCount: Math.max(0, updated ? updated.wishlistCount : 0),
                message: "Removed from wishlist"
            });
        } else {
            const newWishlist = new Wishlist({
                user: userID,
                listing: listingId
            });
            await newWishlist.save();

            const updated = await Listings.findByIdAndUpdate(
                listingId,
                { $inc: { wishlistCount: 1 } },
                { new: true }
            );
            return res.status(200).json({
                success: true,
                isWishlisted: true,
                wishlistCount: updated ? updated.wishlistCount : 1,
                message: "Saved to wishlist!"
            });
        }
    } catch (error) {
        console.error("Error toggling wishlist:", error);
        return res.status(500).json({ success: false, message: "Failed to update wishlist" });
    }
}

/**
 * Get all wishlisted listings for the current user
 */
async function getUserWishlist(req, res) {
    try {
        const userID = req.user.id;
        const currentUser = await User.findById(userID);

        const userCoords = resolveCoordinates({
            latitude: currentUser?.latitude,
            longitude: currentUser?.longitude,
            pincode: currentUser?.pincode,
            city: currentUser?.city,
            area: currentUser?.area
        });

        const wishlistEntries = await Wishlist.find({ user: userID })
            .populate('listing')
            .sort({ createdAt: -1 });

        // Filter out entries where listing may have been deleted
        const activeItems = wishlistEntries
            .filter(entry => entry.listing !== null && entry.listing !== undefined)
            .map(entry => {
                const itemObj = entry.listing.toObject();
                const itemCoords = resolveCoordinates({
                    latitude: itemObj.latitude,
                    longitude: itemObj.longitude,
                    pincode: itemObj.pincode,
                    city: itemObj.city,
                    area: itemObj.area,
                    id: itemObj._id
                });

                const distanceKm = calculateDistanceKm(
                    userCoords.lat,
                    userCoords.lng,
                    itemCoords.lat,
                    itemCoords.lng
                );

                return {
                    ...itemObj,
                    distanceKm,
                    wishlistedAt: entry.createdAt,
                    wishlistId: entry._id,
                    isWishlisted: true
                };
            });

        return res.status(200).json({
            success: true,
            count: activeItems.length,
            wishlist: activeItems
        });
    } catch (error) {
        console.error("Error fetching user wishlist:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch wishlist" });
    }
}

/**
 * Get an array of listing IDs wishlisted by current user for fast lookup
 */
async function getWishlistListingIds(req, res) {
    try {
        const userID = req.user.id;
        const entries = await Wishlist.find({ user: userID }).select('listing');
        const ids = entries.map(e => e.listing.toString());
        return res.status(200).json({
            success: true,
            ids
        });
    } catch (error) {
        console.error("Error fetching wishlist IDs:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch wishlist IDs" });
    }
}

module.exports = {
    toggleWishlist,
    getUserWishlist,
    getWishlistListingIds
};
