const mongoose = require('mongoose');
const schema = mongoose.Schema;

const wishlistSchema = new schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index: true
    },
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'listings',
        required: true,
        index: true
    }
}, { timestamps: true });

// Ensure a user can only wishlist each listing once
wishlistSchema.index({ user: 1, listing: 1 }, { unique: true });

const Wishlist = mongoose.model('wishlist', wishlistSchema);
module.exports = Wishlist;
