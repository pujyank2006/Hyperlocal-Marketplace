const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { createReview, getMyTrustSummary, getOrderReviews, getUserTrustSummary } = require('../controllers/reviewController');

router.use(verifyToken);
router.get('/me', getMyTrustSummary);
router.get('/user/:userId', getUserTrustSummary);
router.get('/order/:orderId', getOrderReviews);
router.post('/', createReview);

module.exports = router;
