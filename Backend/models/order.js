const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    orderId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    buyer: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    seller: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    listing: {
        type: Schema.Types.ObjectId,
        ref: 'listings',
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    paymentGateway: {
        type: String,
        enum: ['Razorpay', 'Sandbox'],
        default: 'Sandbox'
    },
    gatewayOrderId: {
        type: String,
        default: ''
    },
    paymentId: {
        type: String,
        default: ''
    },
    signature: {
        type: String,
        default: ''
    },
    paymentStatus: {
        type: String,
        enum: ['created', 'completed', 'failed', 'refunded'],
        default: 'created',
        index: true
    },
    orderStatus: {
        type: String,
        enum: ['placed', 'delivered', 'cancelled'],
        default: 'placed'
    },
    deliveryType: {
        type: String,
        enum: ['local_pickup', 'direct_handover'],
        default: 'local_pickup'
    },
    // Permanent snapshot for historical invoice generation
    metadata: {
        listingTitle: { type: String, default: '' },
        listingCategory: { type: String, default: '' },
        listingImage: { type: String, default: '' },
        listingPrice: { type: Number, default: 0 },
        sellerName: { type: String, default: '' },
        sellerCity: { type: String, default: '' },
        sellerArea: { type: String, default: '' },
        sellerPincode: { type: String, default: '' },
        sellerPhone: { type: String, default: '' },
        buyerName: { type: String, default: '' },
        buyerCity: { type: String, default: '' },
        buyerArea: { type: String, default: '' },
        buyerPincode: { type: String, default: '' },
        buyerPhone: { type: String, default: '' }
    }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
