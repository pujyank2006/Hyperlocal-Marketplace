const SavedSearch = require('../models/savedSearch');
const Notification = require('../models/notification');

/**
 * Save a new search configuration with alert subscription
 */
async function saveSearch(req, res) {
    try {
        const userID = req.user.id;
        const { title, query, category, locationScope, pincode, city, maxPrice } = req.body;

        // Auto-generate title if not specified
        let generatedTitle = title?.trim();
        if (!generatedTitle) {
            const parts = [];
            if (query && query.trim()) parts.push(`"${query.trim()}"`);
            if (category && category !== 'All') parts.push(category);
            if (pincode && pincode.trim()) parts.push(`Pincode ${pincode.trim()}`);
            else if (city && city.trim()) parts.push(city.trim());
            generatedTitle = parts.length > 0 ? parts.join(" • ") : "All Local Items";
        }

        const newSavedSearch = new SavedSearch({
            user: userID,
            title: generatedTitle,
            query: query ? query.trim() : "",
            category: category ? category.trim() : "All",
            locationScope: locationScope || "all",
            pincode: pincode ? pincode.trim() : "",
            city: city ? city.trim() : "",
            maxPrice: maxPrice && !isNaN(maxPrice) ? Number(maxPrice) : null,
            alertEnabled: true
        });

        await newSavedSearch.save();

        return res.status(201).json({
            success: true,
            message: "Search alert saved successfully!",
            savedSearch: newSavedSearch
        });
    } catch (error) {
        console.error("Error saving search:", error);
        return res.status(500).json({ success: false, message: "Failed to save search alert" });
    }
}

/**
 * Get all saved searches for the current user
 */
async function getSavedSearches(req, res) {
    try {
        const userID = req.user.id;
        const savedSearches = await SavedSearch.find({ user: userID }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: savedSearches.length,
            savedSearches
        });
    } catch (error) {
        console.error("Error fetching saved searches:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch saved searches" });
    }
}

/**
 * Delete a saved search
 */
async function deleteSavedSearch(req, res) {
    try {
        const userID = req.user.id;
        const { id } = req.params;

        const deleted = await SavedSearch.findOneAndDelete({ _id: id, user: userID });
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Saved search not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Saved search alert deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting saved search:", error);
        return res.status(500).json({ success: false, message: "Failed to delete saved search" });
    }
}

/**
 * Background matching helper: checks active saved searches against a new listing and emits alerts
 */
async function checkAndNotifyMatches(newListing, io) {
    try {
        if (!newListing) return;

        const activeSearches = await SavedSearch.find({
            alertEnabled: true
        });

        // Filter out the creator's own saved searches safely
        const candidateSearches = activeSearches.filter(
            search => search.user && search.user.toString() !== (newListing.relatedUser || '').toString()
        );

        for (const search of candidateSearches) {
            let isMatch = true;

            // 1. Category check
            if (search.category && search.category !== 'All') {
                const searchCat = search.category.trim().toLowerCase();
                const listingCat = (newListing.category || '').trim().toLowerCase();
                if (searchCat !== listingCat) {
                    isMatch = false;
                }
            }

            // 2. Location / Pincode check
            if (isMatch && search.locationScope === 'pincode' && search.pincode) {
                if (search.pincode.trim() !== (newListing.pincode || '').trim()) {
                    isMatch = false;
                }
            } else if (isMatch && search.locationScope === 'city' && search.city) {
                if (search.city.trim().toLowerCase() !== (newListing.city || '').trim().toLowerCase()) {
                    isMatch = false;
                }
            }

            // 3. Keyword / Query check: checks title, description, and category
            if (isMatch && search.query && search.query.trim()) {
                const queryStr = search.query.trim().toLowerCase();
                const combinedText = `${newListing.title || ''} ${newListing.description || ''} ${newListing.category || ''}`.toLowerCase();
                
                let keywordMatch = combinedText.includes(queryStr);
                if (!keywordMatch) {
                    const words = queryStr.split(/\s+/).filter(w => w.length > 1);
                    if (words.length > 0 && words.some(w => combinedText.includes(w))) {
                        keywordMatch = true;
                    }
                }
                if (!keywordMatch) {
                    isMatch = false;
                }
            }

            // 4. Max Price check
            if (isMatch && search.maxPrice && Number(search.maxPrice) > 0) {
                if (Number(newListing.price) > Number(search.maxPrice)) {
                    isMatch = false;
                }
            }

            // If all active filters matched, create notification!
            if (isMatch) {
                const notification = new Notification({
                    user: search.user,
                    type: 'saved_search_match',
                    title: '🎯 New Item Alert!',
                    message: `A new listing "${newListing.title}" (₹${newListing.price}) in ${newListing.category} was posted in ${newListing.area || newListing.city || 'your area'}.`,
                    listing: newListing._id,
                    savedSearch: search._id,
                    isRead: false
                });

                await notification.save();

                // Real-time socket emission if user is online
                if (io) {
                    const payload = {
                        notificationId: notification._id,
                        title: notification.title,
                        message: notification.message,
                        listingId: newListing._id,
                        createdAt: notification.createdAt
                    };
                    console.log(`📡 Emitting new_alert_notification to room user_${search.user.toString()}:`, payload);
                    io.to(`user_${search.user.toString()}`).emit('new_alert_notification', payload);
                } else {
                    console.warn("⚠️ Socket.io instance not found on server for alert emission");
                }
            }
        }
    } catch (err) {
        console.error("Error matching saved searches for new listing:", err);
    }
}

module.exports = {
    saveSearch,
    getSavedSearches,
    deleteSavedSearch,
    checkAndNotifyMatches
};
