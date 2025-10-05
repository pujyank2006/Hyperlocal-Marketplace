const express = require('express');
const router = express.Router();

const protect = require('../middlewares/protectMiddleware');
const { addAddress, updateDetails } = require('../controllers/userDetailsController');

// Router to get all the details of the user.
router.get('/loggedInUser', protect, (req, res) => {
    res.json(req.user);
});

// Router to add the full address.
router.put('/addAddress', addAddress);

// Router to edit the details of the user.
router.patch('/users', updateDetails)

module.exports = router;