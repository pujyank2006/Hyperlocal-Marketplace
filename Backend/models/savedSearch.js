const mongoose = require('mongoose');
const schema = mongoose.Schema;

const savedSearchSchema = new schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: false,
        trim: true
    },
    query: {
        type: String,
        default: "",
        trim: true
    },
    category: {
        type: String,
        default: "All",
        trim: true
    },
    locationScope: {
        type: String,
        default: "all",
        trim: true
    },
    pincode: {
        type: String,
        default: "",
        trim: true
    },
    city: {
        type: String,
        default: "",
        trim: true
    },
    maxPrice: {
        type: Number,
        default: null
    },
    alertEnabled: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const SavedSearch = mongoose.model('savedSearch', savedSearchSchema);
module.exports = SavedSearch;
