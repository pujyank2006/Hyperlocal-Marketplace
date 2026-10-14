const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
    toggleWishlist,
    getUserWishlist,
    getWishlistListingIds
} = require('../controllers/wishlistController');

router.use(verifyToken);

router.post('/toggle/:listingId', toggleWishlist);
router.get('/', getUserWishlist);
router.get('/ids', getWishlistListingIds);

module.exports = router;
