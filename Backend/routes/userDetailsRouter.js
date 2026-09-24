const express = require('express');
const router = express.Router();

const { updateDetails, getDetails } = require('../controllers/userDetailsController');

// Router to get all the details of the user.
router.get('/loggedInUser', getDetails);
router.get('/me', getDetails);
router.get('/', getDetails);

// Router to edit the details of the user.
router.patch('/users', updateDetails);
router.patch('/me', updateDetails);
router.patch('/', updateDetails);

module.exports = router;