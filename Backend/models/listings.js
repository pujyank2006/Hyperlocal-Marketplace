const mongoose = require('mongoose');
const schema = mongoose.Schema;

const listingsSchema = new schema ({ 
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
        type: String,
        required: false
    },
    owner: {
        type: String,
        required: true
    },
    images: {
        type: [String],
        default: []
    }
}, { timestamps: true });

const listingsDetails = mongoose.model('listings', listingsSchema);
module.exports = listingsDetails;