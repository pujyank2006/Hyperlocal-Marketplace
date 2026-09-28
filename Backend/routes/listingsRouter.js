const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { addNewListings, getListings } = require('../controllers/listingsController');

// Require authentication for listing routes
router.use(verifyToken);

router.post("/create-listing", upload.array('images', 10), addNewListings);
router.post("/", upload.array('images', 10), addNewListings);

router.get("/get-listing", getListings);
router.get("/", getListings);

module.exports = router;