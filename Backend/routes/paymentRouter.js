const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
    createOrder,
    verifyPayment,
    getMyOrders,
    getOrderDetails
} = require('../controllers/paymentController');

// All payment routes require authentication
router.use(verifyToken);

router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);
router.get('/my-orders', getMyOrders);
router.get('/orders/:orderId', getOrderDetails);

module.exports = router;
