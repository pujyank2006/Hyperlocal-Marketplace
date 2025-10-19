const express = require('express');
const router = express.Router();

const { addNewListings, getListings } = require('../controllers/listingsController');

router.post("/create-listing", addNewListings);

router.get("/get-listing", getListings);

module.exports = router;