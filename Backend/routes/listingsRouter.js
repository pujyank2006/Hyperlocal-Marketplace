const express = require('express');
const router = express.Router();

const upload = require('../middlewares/uploadMiddleware');
const { addNewListings, getListings } = require('../controllers/listingsController');

router.post("/create-listing", upload.array('images', 10), addNewListings);
router.post("/", upload.array('images', 10), addNewListings);

router.get("/get-listing", getListings);
router.get("/", getListings);

module.exports = router;