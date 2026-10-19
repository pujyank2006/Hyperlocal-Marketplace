const crypto = require('crypto');
const Order = require('../models/order');
const Listings = require('../models/listings');
const User = require('../models/user');
const Notification = require('../models/notification');

let Razorpay = null;
try {
    Razorpay = require('razorpay');
} catch (e) {
    // Razorpay module optional, fallback to sandbox
}

/**
 * Helper to get Razorpay instance if keys exist
 */
function getRazorpayInstance() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (Razorpay && keyId && keySecret && !keyId.includes('YOUR_')) {
        return new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
    return null;
}

/**
 * POST /api/v1/payments/create-order
 * Initializes an order for a listing
 */
exports.createOrder = async (req, res) => {
    try {
        const buyerId = req.user.id;
        const { listingId, deliveryType } = req.body;

        if (!listingId) {
            return res.status(400).json({ success: false, message: 'listingId is required' });
        }

        const listing = await Listings.findById(listingId);
        if (!listing) {
            return res.status(404).json({ success: false, message: 'Listing not found' });
        }

        if (listing.status === 'Sold') {
            return res.status(400).json({ success: false, message: 'This item has already been sold.' });
        }

        if (listing.relatedUser.toString() === buyerId.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot purchase your own listing.' });
        }

        const buyer = await User.findById(buyerId);
        const seller = await User.findById(listing.relatedUser);

        // Generate human-readable unique order reference
        const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
        const orderId = `ORD-${Date.now().toString().slice(-6)}-${rand}`;

        let gatewayOrderId = '';
        let gateway = 'Sandbox';
        const rzp = getRazorpayInstance();

        if (rzp) {
            try {
                const rzpOrder = await rzp.orders.create({
                    amount: Math.round(listing.price * 100), // amount in smallest currency unit (paise)
                    currency: 'INR',
                    receipt: orderId
                });
                gatewayOrderId = rzpOrder.id;
                gateway = 'Razorpay';
            } catch (rzpErr) {
                console.warn('Razorpay order creation fallback to Sandbox:', rzpErr.message);
                gatewayOrderId = `sandbox_order_${Date.now()}_${rand}`;
                gateway = 'Sandbox';
            }
        } else {
            gatewayOrderId = `sandbox_order_${Date.now()}_${rand}`;
            gateway = 'Sandbox';
        }

        const newOrder = new Order({
            orderId,
            buyer: buyerId,
            seller: listing.relatedUser,
            listing: listing._id,
            amount: listing.price,
            currency: 'INR',
            paymentGateway: gateway,
            gatewayOrderId,
            deliveryType: deliveryType || 'local_pickup',
            paymentStatus: 'created',
            orderStatus: 'placed',
            metadata: {
                listingTitle: listing.title || 'Marketplace Item',
                listingCategory: listing.category || 'General',
                listingImage: listing.images && listing.images.length > 0 ? listing.images[0] : '',
                listingPrice: listing.price || 0,
                sellerName: seller ? seller.name : (listing.owner || 'Seller'),
                sellerCity: seller ? seller.city : (listing.city || ''),
                sellerArea: seller ? seller.area : (listing.area || ''),
                sellerPincode: seller ? seller.pincode : (listing.pincode || ''),
                sellerPhone: seller ? seller.phone : '',
                buyerName: buyer ? buyer.name : 'Buyer',
                buyerCity: buyer ? buyer.city : '',
                buyerArea: buyer ? buyer.area : '',
                buyerPincode: buyer ? buyer.pincode : '',
                buyerPhone: buyer ? buyer.phone : ''
            }
        });

        await newOrder.save();

        return res.status(201).json({
            success: true,
            order: newOrder,
            gateway,
            keyId: process.env.RAZORPAY_KEY_ID || null,
            isSandbox: gateway === 'Sandbox'
        });

    } catch (error) {
        console.error('Error creating order:', error);
        return res.status(500).json({ success: false, message: 'Server error creating order' });
    }
};

/**
 * POST /api/v1/payments/verify-payment
 * Confirms payment signature or sandbox approval, sets item to 'Sold', notifies seller
 */
exports.verifyPayment = async (req, res) => {
    try {
        const buyerId = req.user.id;
        const { orderId, paymentId, gatewayOrderId, signature, isSandbox } = req.body;

        if (!orderId) {
            return res.status(400).json({ success: false, message: 'orderId is required' });
        }

        const order = await Order.findOne({ orderId });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.buyer.toString() !== buyerId.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized buyer for this order' });
        }

        if (order.paymentStatus === 'completed') {
            return res.status(200).json({
                success: true,
                message: 'Order already completed',
                order
            });
        }

        // Verify Razorpay signature if real gateway
        if (order.paymentGateway === 'Razorpay' && !isSandbox) {
            const secret = process.env.RAZORPAY_KEY_SECRET || '';
            const hmac = crypto.createHmac('sha256', secret);
            hmac.update(`${gatewayOrderId}|${paymentId}`);
            const generatedSignature = hmac.digest('hex');

            if (generatedSignature !== signature) {
                order.paymentStatus = 'failed';
                await order.save();
                return res.status(400).json({ success: false, message: 'Payment verification failed: Invalid signature' });
            }
        }

        // Mark order as completed
        order.paymentId = paymentId || `pay_sandbox_${Date.now()}`;
        order.signature = signature || 'sandbox_verified';
        order.paymentStatus = 'completed';
        order.orderStatus = 'placed';
        await order.save();

        // Mark listing as Sold
        await Listings.findByIdAndUpdate(order.listing, { status: 'Sold' });

        // Create persistent notification for seller
        const notification = new Notification({
            user: order.seller,
            type: 'order_sale',
            title: '🎉 Item Sold!',
            message: `Your listing "${order.metadata.listingTitle}" was purchased by ${order.metadata.buyerName} for ₹${order.amount}.`,
            listing: order.listing,
            isRead: false
        });
        await notification.save();

        // Real-time socket emission to seller
        const io = req.app.get('io');
        if (io) {
            const payload = {
                notificationId: notification._id,
                title: notification.title,
                message: notification.message,
                listingId: order.listing,
                orderId: order.orderId,
                amount: order.amount,
                createdAt: notification.createdAt
            };
            io.to(`user_${order.seller.toString()}`).emit('new_alert_notification', payload);
            io.to(`user_${order.seller.toString()}`).emit('new_sale_notification', payload);
        }

        return res.status(200).json({
            success: true,
            message: 'Payment verified and order placed successfully!',
            order
        });

    } catch (error) {
        console.error('Error verifying payment:', error);
        return res.status(500).json({ success: false, message: 'Server error verifying payment' });
    }
};

/**
 * GET /api/v1/payments/my-orders
 * Returns purchases (as buyer) and sales (as seller)
 */
exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        const [purchases, sales] = await Promise.all([
            Order.find({ buyer: userId }).sort({ createdAt: -1 }),
            Order.find({ seller: userId }).sort({ createdAt: -1 })
        ]);

        return res.status(200).json({
            success: true,
            purchases: purchases || [],
            sales: sales || []
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        return res.status(500).json({ success: false, message: 'Server error retrieving orders' });
    }
};

/**
 * GET /api/v1/payments/orders/:orderId
 * Returns order details for invoice generation
 */
exports.getOrderDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderId } = req.params;

        const order = await Order.findOne({
            $or: [{ orderId }, { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null }]
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Only buyer or seller can view the order invoice
        if (order.buyer.toString() !== userId.toString() && order.seller.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied for this invoice' });
        }

        return res.status(200).json({
            success: true,
            order
        });

    } catch (error) {
        console.error('Error fetching order details:', error);
        return res.status(500).json({ success: false, message: 'Server error retrieving order details' });
    }
};
