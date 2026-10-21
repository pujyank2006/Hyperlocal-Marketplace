const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema({
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  reviewer: { type: Schema.Types.ObjectId, ref: 'user', required: true, index: true },
  reviewee: { type: Schema.Types.ObjectId, ref: 'user', required: true, index: true },
  role: { type: String, enum: ['buyer', 'seller'], required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  text: { type: String, trim: true, maxlength: 1000, default: '' }
}, { timestamps: true });

reviewSchema.index({ order: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
