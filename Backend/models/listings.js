const mongoose = require('mongoose');
const schema = mongoose.Schema;

const listingsSchema = new schema ({
    relatedUser: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    category: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    owner: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: false
    },
    area: {
        type: String,
        required: false
    },
    pincode: {
        type: String,
        required: false
    },
    images: {
        type: [String],
        default: []
    }
}, { timestamps: true });

const listingsDetails = mongoose.model('listings', listingsSchema);
module.exports = listingsDetails;