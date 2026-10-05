const Conversation = require('../models/conversation');
const Message = require('../models/message');
const Listings = require('../models/listings');
const User = require('../models/user');

// Start or get existing conversation for a listing
async function startConversation(req, res) {
  try {
    const userId = req.user.id;
    const { listingId, sellerId } = req.body;

    if (!listingId || !sellerId) {
      return res.status(400).json({ success: false, message: "listingId and sellerId are required" });
    }

    if (userId.toString() === sellerId.toString()) {
      return res.status(400).json({ success: false, message: "You cannot chat with yourself on your own listing" });
    }

    // Check existing conversation
    let conversation = await Conversation.findOne({
      listingId,
      participants: { $all: [userId, sellerId] }
    })
    .populate('participants', 'name email phone area city')
    .populate('listingId', 'title price images category owner');

    if (!conversation) {
      conversation = new Conversation({
        participants: [userId, sellerId],
        listingId,
        lastMessage: 'Conversation started',
        lastMessageTime: new Date()
      });
      await conversation.save();

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email phone area city')
        .populate('listingId', 'title price images category owner');
    }

    return res.status(200).json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error("Error in startConversation:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// Get all conversations for the authenticated user
async function getUserConversations(req, res) {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId
    })
    .populate('participants', 'name email phone area city')
    .populate('listingId', 'title price images category owner')
    .sort({ lastMessageTime: -1 });

    return res.status(200).json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error("Error in getUserConversations:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// Get messages for a specific conversation
async function getConversationMessages(req, res) {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    if (!conversation.participants.map(p => p.toString()).includes(userId.toString())) {
      return res.status(403).json({ success: false, message: "Unauthorized access to chat" });
    }

    // Mark messages sent to this user as read
    await Message.updateMany(
      { conversationId, receiver: userId, isRead: false },
      { $set: { isRead: true } }
    );

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error("Error in getConversationMessages:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// Send a message or price offer
async function sendMessage(req, res) {
  try {
    const senderId = req.user.id;
    const { conversationId, text, offerPrice } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    const receiverId = conversation.participants.find(p => p.toString() !== senderId.toString());
    if (!receiverId) {
      return res.status(400).json({ success: false, message: "Invalid conversation participants" });
    }

    let messageText = text || '';
    let offerVal = null;
    let offerStat = null;

    if (offerPrice && !isNaN(offerPrice) && Number(offerPrice) > 0) {
      offerVal = Number(offerPrice);
      offerStat = 'pending';
      if (!messageText) {
        messageText = `Offered ₹${offerVal}`;
      }
    }

    const newMessage = new Message({
      conversationId,
      sender: senderId,
      receiver: receiverId,
      text: messageText.trim(),
      offerPrice: offerVal,
      offerStatus: offerStat
    });

    await newMessage.save();

    // Update conversation metadata
    conversation.lastMessage = messageText.trim();
    conversation.lastMessageTime = new Date();
    await conversation.save();

    // Emit Socket.io event if io instance is available on req.app
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId.toString()).emit('receive_message', newMessage);
      io.to(`user_${receiverId.toString()}`).emit('new_message_notification', {
        conversationId,
        senderId,
        message: newMessage
      });
    }

    return res.status(201).json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    console.error("Error in sendMessage:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// Respond to a price offer (Accept / Reject)
async function respondToOffer(req, res) {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'accepted' or 'rejected'" });
    }

    const message = await Message.findById(messageId);
    if (!message || !message.offerPrice) {
      return res.status(404).json({ success: false, message: "Offer message not found" });
    }

    if (message.receiver.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Only the offer recipient can respond to this offer" });
    }

    message.offerStatus = status;
    await message.save();

    // Also send an automated response message in the conversation
    const statusText = status === 'accepted'
      ? `🎉 Offer of ₹${message.offerPrice} ACCEPTED!`
      : `❌ Offer of ₹${message.offerPrice} DECLINED.`;

    const responseMsg = new Message({
      conversationId: message.conversationId,
      sender: userId,
      receiver: message.sender,
      text: statusText
    });
    await responseMsg.save();

    await Conversation.findByIdAndUpdate(message.conversationId, {
      lastMessage: statusText,
      lastMessageTime: new Date()
    });

    const io = req.app.get('io');
    if (io) {
      io.to(message.conversationId.toString()).emit('offer_updated', {
        messageId,
        status,
        responseMsg
      });
    }

    return res.status(200).json({
      success: true,
      offerMessage: message,
      responseMessage: responseMsg
    });
  } catch (error) {
    console.error("Error in respondToOffer:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  startConversation,
  getUserConversations,
  getConversationMessages,
  sendMessage,
  respondToOffer
};
