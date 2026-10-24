const crypto = require('crypto');
const Order = require('../models/order');
const Listings = require('../models/listings');
const User = require('../models/user');
const Notification = require('../models/notification');
const Review = require('../models/review');
const Message = require('../models/message');
const Conversation = require('../models/conversation');

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
    let reservedListingId = null;
    try {
        const buyerId = req.user.id;
        const { listingId, deliveryType, offerMessageId } = req.body;

        if (!listingId) {
            return res.status(400).json({ success: false, message: 'listingId is required' });
        }

        const listing = await Listings.findById(listingId);
        if (!listing) {
            return res.status(404).json({ success: false, message: 'Listing not found' });
        }

        if (listing.status === 'Sold' || listing.status === 'Reserved') {
            return res.status(409).json({ success: false, message: listing.status === 'Sold' ? 'This item has already been sold.' : 'This item is currently reserved.' });
        }

        if (listing.relatedUser.toString() === buyerId.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot purchase your own listing.' });
        }

        let agreedAmount = listing.price;
        let acceptedOffer = null;
        if (offerMessageId) {
            acceptedOffer = await Message.findById(offerMessageId);
            if (!acceptedOffer || !acceptedOffer.offerPrice || acceptedOffer.offerStatus !== 'accepted') {
                return res.status(409).json({ success: false, message: 'This offer is unavailable or has not been accepted.' });
            }
            const validOfferConversation = await Conversation.findOne({
                _id: acceptedOffer.conversationId,
                listingId: listing._id,
                participants: { $all: [buyerId, listing.relatedUser] }
            }).select('_id');
            if (!validOfferConversation || acceptedOffer.sender.toString() !== buyerId.toString() || acceptedOffer.receiver.toString() !== listing.relatedUser.toString()) {
                return res.status(403).json({ success: false, message: 'Only the buyer who made the accepted offer can pay it.' });
            }
            agreedAmount = Number(acceptedOffer.offerPrice);
            if (!Number.isFinite(agreedAmount) || agreedAmount <= 0) {
                return res.status(400).json({ success: false, message: 'The accepted offer has an invalid amount.' });
            }
            const priorCompletedOrder = await Order.findOne({ acceptedOfferMessage: acceptedOffer._id, paymentStatus: 'completed' }).select('_id');
            if (priorCompletedOrder) return res.status(409).json({ success: false, message: 'This accepted offer has already been paid.' });
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
                    amount: Math.round(agreedAmount * 100), // amount in smallest currency unit (paise)
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
            acceptedOfferMessage: acceptedOffer?._id || null,
            amount: agreedAmount,
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
                listingPrice: agreedAmount,
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

        // Atomically reserve the listing so two buyers cannot pay for the same item.
        const reservation = await Listings.findOneAndUpdate(
            { _id: listing._id, status: 'Active' },
            { $set: { status: 'Reserved' } },
            { new: true }
        );
        if (!reservation) return res.status(409).json({ success: false, message: 'This item is no longer available for checkout.' });
        reservedListingId = listing._id;
        await newOrder.save();

        return res.status(201).json({
            success: true,
            order: newOrder,
            gateway,
            keyId: process.env.RAZORPAY_KEY_ID || null,
            isSandbox: gateway === 'Sandbox'
        });

    } catch (error) {
        if (reservedListingId) await Listings.findByIdAndUpdate(reservedListingId, { status: 'Active' }).catch(() => {});
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

        if (order.paymentStatus !== 'created') {
            return res.status(409).json({ success: false, message: 'This payment attempt is no longer active. Start a new checkout.' });
        }

        // Verify Razorpay signature if real gateway
        if (order.paymentGateway === 'Sandbox') {
            if (!isSandbox) return res.status(400).json({ success: false, message: 'Sandbox order requires sandbox verification.' });
        } else {
            const secret = process.env.RAZORPAY_KEY_SECRET || '';
            if (!secret || !gatewayOrderId || gatewayOrderId !== order.gatewayOrderId || !paymentId || !signature) {
                return res.status(400).json({ success: false, message: 'Payment verification details are incomplete or do not match this order.' });
            }
            const hmac = crypto.createHmac('sha256', secret);
            hmac.update(`${gatewayOrderId}|${paymentId}`);
            const generatedSignature = hmac.digest('hex');

            if (generatedSignature !== signature) {
                return res.status(400).json({ success: false, message: 'Payment verification failed: Invalid signature' });
            }
        }

        // Mark order as completed
        order.paymentId = paymentId || `pay_sandbox_${Date.now()}`;
        order.signature = signature || 'sandbox_verified';
        order.paymentStatus = 'completed';
        order.orderStatus = 'placed';
        order.escrowStatus = 'held';
        order.escrowHeldAt = new Date();
        order.returnWindowEndsAt = new Date(Date.now() + order.returnWindowDays * 24 * 60 * 60 * 1000);
        await order.save();

        // Reserve while funds are held; seller finalizes only after the buyer confirms handover.
        await Listings.findByIdAndUpdate(order.listing, { status: 'Reserved' });
        const paidOffer = order.acceptedOfferMessage
            ? await Message.findByIdAndUpdate(order.acceptedOfferMessage, { $set: { offerStatus: 'paid' } }, { new: true })
            : null;

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
            if (paidOffer) io.to(paidOffer.conversationId.toString()).emit('offer_updated', { messageId: paidOffer._id, status: 'paid' });
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
 * POST /api/v1/payments/orders/:orderId/action
 * Buyer/seller order lifecycle actions. Escrow values are an application ledger
 * only; actual gateway capture, refunds and payouts require provider support.
 */
exports.orderAction = async (req, res) => {
    try {
        const userId = req.user.id;
        const { action, reason = '', details = '', evidence = [] } = req.body;
        const order = await Order.findOne({ orderId: req.params.orderId });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        const isBuyer = order.buyer.toString() === userId.toString();
        const isSeller = order.seller.toString() === userId.toString();
        if (!isBuyer && !isSeller) return res.status(403).json({ success: false, message: 'You are not a participant in this order.' });

        if (action === 'confirm-delivery') {
            if (!isBuyer) return res.status(403).json({ success: false, message: 'Only the buyer can confirm handover.' });
            if (order.paymentStatus !== 'completed' || order.escrowStatus !== 'held' || order.orderStatus !== 'placed') return res.status(409).json({ success: false, message: 'This order is not awaiting handover confirmation.' });
            order.orderStatus = 'delivered';
            order.escrowStatus = 'released';
            order.escrowReleasedAt = new Date();
            const listing = await Listings.findById(order.listing);
            if (listing) { listing.status = 'Sold'; await listing.save(); }
        } else if (action === 'request-return') {
            if (!isBuyer) return res.status(403).json({ success: false, message: 'Only the buyer can request a return.' });
            if (order.escrowStatus !== 'held' || order.orderStatus !== 'placed' || !order.returnWindowEndsAt || Date.now() > order.returnWindowEndsAt.getTime()) return res.status(409).json({ success: false, message: 'The return window is closed or this order is no longer eligible.' });
            if (typeof reason !== 'string' || reason.trim().length < 3) return res.status(400).json({ success: false, message: 'Please provide a return reason.' });
            order.orderStatus = 'return_requested';
            order.returnReason = reason.trim().slice(0, 1000);
            order.returnRequestedAt = new Date();
            order.returnResolution = 'pending';
        } else if (action === 'respond-return') {
            if (!isSeller) return res.status(403).json({ success: false, message: 'Only the seller can respond to a return.' });
            if (order.orderStatus !== 'return_requested' || order.returnResolution !== 'pending') return res.status(409).json({ success: false, message: 'There is no pending return request.' });
            if (!['accept', 'reject'].includes(req.body.decision)) return res.status(400).json({ success: false, message: 'Decision must be accept or reject.' });
            order.returnResolution = req.body.decision === 'accept' ? 'accepted' : 'rejected';
            if (req.body.decision === 'accept') {
                order.orderStatus = 'returned';
                order.escrowStatus = 'refund_pending';
            } else {
                order.orderStatus = 'placed';
            }
        } else if (action === 'open-claim') {
            if (!isBuyer) return res.status(403).json({ success: false, message: 'Only the buyer can open a damage or not-as-described claim.' });
            if (order.escrowStatus !== 'held' || order.orderStatus !== 'placed' || !['damage', 'not_as_described', 'not_received'].includes(req.body.claimReason)) return res.status(409).json({ success: false, message: 'Claims require an eligible order and a valid claim reason.' });
            if (typeof details !== 'string' || details.trim().length < 10) return res.status(400).json({ success: false, message: 'Please describe the issue in at least 10 characters.' });
            order.claimReason = req.body.claimReason;
            order.claimDetails = details.trim().slice(0, 2000);
            order.claimEvidence = Array.isArray(evidence) ? evidence.filter(x => typeof x === 'string').slice(0, 5) : [];
            order.claimStatus = 'open';
            order.claimOpenedAt = new Date();
            order.orderStatus = 'disputed';
            order.escrowStatus = 'disputed';
        } else if (action === 'resolve-claim') {
            if (!isSeller) return res.status(403).json({ success: false, message: 'Only the seller can respond to this claim.' });
            if (order.claimStatus !== 'open' || !['buyer', 'seller'].includes(req.body.decision)) return res.status(409).json({ success: false, message: 'There is no open claim or the decision is invalid.' });
            order.claimStatus = req.body.decision === 'buyer' ? 'resolved_buyer' : 'resolved_seller';
            order.escrowStatus = req.body.decision === 'buyer' ? 'refund_pending' : 'released';
            order.orderStatus = req.body.decision === 'buyer' ? 'returned' : 'delivered';
            if (req.body.decision === 'seller') order.escrowReleasedAt = new Date();
        } else if (action === 'report-payment-failure') {
            if (!isBuyer) return res.status(403).json({ success: false, message: 'Only the buyer can report this payment attempt.' });
            if (order.paymentGateway !== 'Sandbox') return res.status(409).json({ success: false, message: 'Gateway payment status must be confirmed by the payment provider before releasing this reservation.' });
            if (order.paymentStatus === 'completed') return res.status(409).json({ success: false, message: 'This payment is already completed.' });
            order.paymentStatus = 'failed';
            order.failureReason = String(reason || 'Payment cancelled or failed').slice(0, 500);
            order.escrowStatus = 'pending';
            await Listings.findOneAndUpdate({ _id: order.listing, status: 'Reserved' }, { $set: { status: 'Active' } });
        } else {
            return res.status(400).json({ success: false, message: 'Unsupported order action.' });
        }

        await order.save();
        return res.json({ success: true, order, message: 'Order updated.' });
    } catch (error) {
        console.error('Error updating order:', error);
        return res.status(500).json({ success: false, message: 'Server error updating order' });
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

        const allOrders = [...purchases, ...sales];
        const orderReviews = allOrders.length
            ? await Review.find({ order: { $in: allOrders.map((order) => order._id) } }).populate('reviewer', 'name').populate('reviewee', 'name').lean()
            : [];
        const reviewsByOrder = orderReviews.reduce((map, review) => {
            const key = review.order.toString();
            (map[key] ||= []).push(review);
            return map;
        }, {});
        const addReviews = (orders) => orders.map((order) => {
            const plain = order.toObject();
            plain.reviews = reviewsByOrder[order._id.toString()] || [];
            return plain;
        });

        return res.status(200).json({
            success: true,
            purchases: addReviews(purchases || []),
            sales: addReviews(sales || [])
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
