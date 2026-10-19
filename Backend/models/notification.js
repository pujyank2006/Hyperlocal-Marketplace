const mongoose = require('mongoose');
const schema = mongoose.Schema;

const notificationSchema = new schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['saved_search_match', 'price_drop', 'order_sale', 'order_placed', 'general'],
        default: 'saved_search_match'
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'listings',
        default: null
    },
    savedSearch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'savedSearch',
        default: null
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    }
}, { timestamps: true });

const Notification = mongoose.model('notification', notificationSchema);
module.exports = Notification;
