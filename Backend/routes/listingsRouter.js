const express = require('express');
const router = express.Router();

const { addNewListings } = require('../controllers/listingsController');

router.post("/create-listing", addNewListings);

module.exports = router;