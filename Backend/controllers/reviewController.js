const Review = require('../models/review');
const Order = require('../models/order');

const TRUSTED_REVIEW_ORDER = { paymentStatus: 'completed', orderStatus: 'delivered', escrowStatus: 'released' };

async function buildTrustSummary(userId) {
  const [reviews, completedOrders, recentReviews] = await Promise.all([
    Review.find({ reviewee: userId }).select('rating'),
    Order.countDocuments({ $or: [{ buyer: userId }, { seller: userId }], ...TRUSTED_REVIEW_ORDER }),
    Review.find({ reviewee: userId }).populate('reviewer', 'name').sort({ createdAt: -1 }).limit(10).lean()
  ]);
  const averageRating = reviews.length ? Number((reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length).toFixed(1)) : null;
  const badges = [];
  if (completedOrders > 0) badges.push({ id: 'completed-trader', label: 'Completed trader', description: 'A buyer or seller marked a marketplace handover complete; identity is not independently verified' });
  if (reviews.length >= 5 && averageRating >= 4.5) badges.push({ id: 'highly-rated', label: 'Highly rated', description: 'At least five reviews averaging 4.5 stars or higher' });
  if (completedOrders >= 10) badges.push({ id: 'community-regular', label: 'Community regular', description: 'Completed ten or more marketplace handovers' });
  return { averageRating, reviewCount: reviews.length, completedOrders, badges, reviews: recentReviews };
}

exports.buildTrustSummary = buildTrustSummary;

exports.createReview = async (req, res) => {
  try {
    const reviewerId = req.user.id;
    const { orderId, rating, text = '' } = req.body;
    if (!orderId || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ success: false, message: 'Provide an orderId and a whole-number rating from 1 to 5.' });
    }
    if (typeof text !== 'string' || text.trim().length > 1000) {
      return res.status(400).json({ success: false, message: 'Review text must be 1,000 characters or fewer.' });
    }

    const order = await Order.findOne({ orderId, ...TRUSTED_REVIEW_ORDER });
    if (!order) return res.status(409).json({ success: false, message: 'Reviews are available after a completed handover.' });

    let revieweeId;
    let role;
    if (order.buyer.toString() === reviewerId.toString()) {
      revieweeId = order.seller;
      role = 'buyer';
    } else if (order.seller.toString() === reviewerId.toString()) {
      revieweeId = order.buyer;
      role = 'seller';
    } else {
      return res.status(403).json({ success: false, message: 'Only the buyer or seller can review this order.' });
    }

    const review = await Review.create({ order: order._id, reviewer: reviewerId, reviewee: revieweeId, role, rating: Number(rating), text: text.trim() });
    return res.status(201).json({ success: true, review });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'You have already reviewed this order.' });
    console.error('Error creating review:', error);
    return res.status(500).json({ success: false, message: 'Could not save review.' });
  }
};

exports.getMyTrustSummary = async (req, res) => {
  try {
    const summary = await buildTrustSummary(req.user.id);
    return res.json({ success: true, summary });
  } catch (error) {
    console.error('Error loading trust summary:', error);
    return res.status(500).json({ success: false, message: 'Could not load trust summary.' });
  }
};

exports.getUserTrustSummary = async (req, res) => {
  try {
    if (!require('mongoose').isValidObjectId(req.params.userId)) return res.status(400).json({ success: false, message: 'Invalid user id.' });
    const summary = await buildTrustSummary(req.params.userId);
    return res.json({ success: true, summary });
  } catch (error) {
    console.error('Error loading user trust summary:', error);
    return res.status(500).json({ success: false, message: 'Could not load trust summary.' });
  }
};

exports.getOrderReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.buyer.toString() !== userId.toString() && order.seller.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'You are not part of this order.' });
    }
    const reviews = await Review.find({ order: order._id }).populate('reviewer', 'name').populate('reviewee', 'name').sort({ createdAt: 1 }).lean();
    return res.json({ success: true, reviews });
  } catch (error) {
    console.error('Error loading order reviews:', error);
    return res.status(500).json({ success: false, message: 'Could not load order reviews.' });
  }
};
