const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  startConversation,
  getUserConversations,
  getConversationMessages,
  sendMessage,
  respondToOffer,
  getUnreadMessagesCount
} = require('../controllers/chatController');

// All chat endpoints require authentication
router.use(verifyToken);

router.get('/unread-count', getUnreadMessagesCount);
router.post('/start', startConversation);
router.get('/conversations', getUserConversations);
router.get('/messages/:conversationId', getConversationMessages);
router.post('/message', sendMessage);
router.patch('/offer/:messageId', respondToOffer);

module.exports = router;
