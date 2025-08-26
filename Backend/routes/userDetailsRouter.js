const express = require('express');
const router = express.Router();

const protect = require('../middlewares/protectMiddleware');

router.get('/loggedInUser', protect, (req, res) => {
    res.json(req.user);
});

module.exports = router;