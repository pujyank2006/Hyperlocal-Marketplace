const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { addNewListings, getListings, updateListing, deleteListing } = require('../controllers/listingsController');

// Require authentication for listing routes
router.use(verifyToken);

router.post("/create-listing", upload.array('images', 10), addNewListings);
router.post("/", upload.array('images', 10), addNewListings);

router.get("/get-listing", getListings);
router.get("/", getListings);

router.put("/:id", upload.array('images', 10), updateListing);
router.patch("/:id", upload.array('images', 10), updateListing);
router.delete("/:id", deleteListing);

module.exports = router;