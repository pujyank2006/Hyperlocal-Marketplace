const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  text: {
    type: String,
    default: ''
  },
  offerPrice: {
    type: Number,
    default: null
  },
  offerStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', null],
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
