const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
    saveSearch,
    getSavedSearches,
    deleteSavedSearch
} = require('../controllers/savedSearchController');

router.use(verifyToken);

router.post('/', saveSearch);
router.get('/', getSavedSearches);
router.delete('/:id', deleteSavedSearch);

module.exports = router;
