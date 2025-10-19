const express = require('express');
const router = express.Router();

const { updateDetails, getDetails } = require('../controllers/userDetailsController');

// Router to get all the details of the user.
router.get('/loggedInUser', getDetails );

// Router to edit the details of the user.
router.patch('/users', updateDetails);

module.exports = router;