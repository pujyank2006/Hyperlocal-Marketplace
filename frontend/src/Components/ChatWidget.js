import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/api';
import { handleError, handleSuccess } from '../utils';
import styles from '../ComponentStyles/chatWidget.module.css';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:9000";

const isSameId = (a, b) => {
  if (!a || !b) return false;
  const idA = typeof a === 'object' ? a._id || a.id : a;
  const idB = typeof b === 'object' ? b._id || b.id : b;
  return String(idA) === String(idB);
};

function ChatWidget({ isOpen, onClose, initialConversationId = null, initialListingId = null, initialSellerId = null }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showOfferBox, setShowOfferBox] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Socket.io initialization & listener bindings
  useEffect(() => {
    if (!isOpen || !user) return;

    socketRef.current = io(SOCKET_SERVER_URL, {
      withCredentials: true,
    });

    socketRef.current.on('connect', () => {
      if (user?._id) {
        socketRef.current.emit('join_room', `user_${user._id}`);
      }
    });

    socketRef.current.on('receive_message', (newMsg) => {
      setMessages(prev => {
        if (prev.some(m => isSameId(m._id, newMsg._id))) return prev;
        return [...prev, newMsg];
      });

      // Update sidebar preview silently
      setConversations(prev =>
        prev.map(c =>
          isSameId(c._id, newMsg.conversationId)
            ? { ...c, lastMessage: newMsg.text || 'New message', lastMessageTime: new Date() }
            : c
        )
      );

      setTimeout(scrollToBottom, 50);
    });

    socketRef.current.on('offer_updated', ({ messageId, status, responseMsg }) => {
      setMessages(prev =>
        prev.map(m => (isSameId(m._id, messageId) ? { ...m, offerStatus: status } : m))
      );
      if (responseMsg) {
        setMessages(prev => {
          if (prev.some(m => isSameId(m._id, responseMsg._id))) return prev;
          return [...prev, responseMsg];
        });

        // Update sidebar preview silently
        setConversations(prev =>
          prev.map(c =>
            isSameId(c._id, responseMsg.conversationId)
              ? { ...c, lastMessage: responseMsg.text, lastMessageTime: new Date() }
              : c
          )
        );
      }
      setTimeout(scrollToBottom, 50);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [isOpen, user]);

  // Load active conversation messages
  const loadMessages = useCallback(async (convId) => {
    try {
      const data = await chatService.getMessages(convId);
      if (data.success) {
        setMessages(data.messages || []);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  }, []);

  // Fetch all conversations for current user silently without setting global loading state unless requested
  const fetchConversations = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setIsLoading(true);
      const data = await chatService.getConversations();
      if (data.success) {
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  // Auto initialize or select conversation when drawer opens
  useEffect(() => {
    if (!isOpen) return;

    if (initialListingId && initialSellerId) {
      chatService.startConversation(initialListingId, initialSellerId)
        .then(data => {
          if (data.success && data.conversation) {
            setActiveConv(data.conversation);
            loadMessages(data.conversation._id);
            if (socketRef.current) socketRef.current.emit('join_room', data.conversation._id);
            fetchConversations(false);
          }
        })
        .catch(err => {
          console.error("Error starting conversation:", err);
          handleError(err.message || "Could not start chat");
        });
    } else {
      setIsLoading(true);
      chatService.getConversations()
        .then(data => {
          if (data.success) {
            const convList = data.conversations || [];
            setConversations(convList);
            if (initialConversationId) {
              const found = convList.find(c => isSameId(c._id, initialConversationId));
              if (found) {
                setActiveConv(found);
                loadMessages(found._id);
                if (socketRef.current) socketRef.current.emit('join_room', found._id);
              }
            } else if (convList.length > 0) {
              setActiveConv(convList[0]);
              loadMessages(convList[0]._id);
              if (socketRef.current) socketRef.current.emit('join_room', convList[0]._id);
            }
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, initialListingId, initialSellerId, initialConversationId, loadMessages, fetchConversations]);

  const handleSelectConv = (conv) => {
    if (activeConv && socketRef.current) {
      socketRef.current.emit('leave_room', activeConv._id);
    }
    setActiveConv(conv);
    loadMessages(conv._id);
    if (socketRef.current) {
      socketRef.current.emit('join_room', conv._id);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!activeConv) return;
    if (!inputText.trim() && !offerPrice) return;

    try {
      const data = await chatService.sendMessage(
        activeConv._id,
        inputText.trim(),
        offerPrice ? Number(offerPrice) : null
      );

      if (data.success && data.message) {
        const newMsg = data.message;
        setMessages(prev => (prev.some(m => isSameId(m._id, newMsg._id)) ? prev : [...prev, newMsg]));
        setInputText('');
        setOfferPrice('');
        setShowOfferBox(false);
        setTimeout(scrollToBottom, 50);

        // Update sidebar preview silently without flickering
        setConversations(prev =>
          prev.map(c =>
            isSameId(c._id, activeConv._id)
              ? { ...c, lastMessage: newMsg.text || 'Price offer sent', lastMessageTime: new Date() }
              : c
          )
        );
        fetchConversations(false);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      handleError("Failed to send message");
    }
  };

  const handleOfferResponse = async (messageId, status) => {
    try {
      const data = await chatService.respondOffer(messageId, status);
      if (data.success) {
        handleSuccess(`Offer ${status}!`);
        setMessages(prev =>
          prev.map(m => (isSameId(m._id, messageId) ? { ...m, offerStatus: status } : m))
        );
        if (data.responseMessage) {
          const respMsg = data.responseMessage;
          setMessages(prev => (prev.some(m => isSameId(m._id, respMsg._id)) ? prev : [...prev, respMsg]));

          // Update sidebar preview silently without flickering
          setConversations(prev =>
            prev.map(c =>
              isSameId(c._id, activeConv._id)
                ? { ...c, lastMessage: respMsg.text, lastMessageTime: new Date() }
                : c
            )
          );
        }
        setTimeout(scrollToBottom, 50);
        fetchConversations(false);
      }
    } catch (err) {
      console.error("Error responding to offer:", err);
      handleError("Could not process offer response");
    }
  };

  if (!isOpen) return null;

  const getPartnerName = (conv) => {
    if (!conv || !conv.participants) return "Seller";
    const partner = conv.participants.find(p => !isSameId(p._id, user?._id));
    return partner ? partner.name : "User";
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.chatContainer} onClick={(e) => e.stopPropagation()}>
        
        {/* LEFT SIDEBAR */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>💬 Messages</h3>
          </div>

          <div className={styles.conversationsList}>
            {isLoading ? (
              <p style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Loading chats...</p>
            ) : conversations.length === 0 ? (
              <p style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                No active messages yet. Click <strong>Chat with Seller</strong> on any item to start!
              </p>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv._id}
                  className={`${styles.convItem} ${activeConv?._id === conv._id ? styles.convItemActive : ''}`}
                  onClick={() => handleSelectConv(conv)}
                >
                  <img
                    src={
                      conv.listingId?.images && conv.listingId.images.length > 0
                        ? `http://localhost:9000${conv.listingId.images[0]}`
                        : "https://via.placeholder.com/50?text=Item"
                    }
                    alt={conv.listingId?.title || "Item"}
                    className={styles.convItemImg}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/50?text=Item";
                    }}
                  />
                  <div className={styles.convItemMeta}>
                    <div className={styles.convTitle}>{conv.listingId?.title || "Item Listing"}</div>
                    <div className={styles.convPartner}>👤 {getPartnerName(conv)}</div>
                    <div className={styles.convLastMsg}>{conv.lastMessage || "No messages yet"}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT CHAT MAIN AREA */}
        {activeConv ? (
          <div className={styles.chatMain}>
            {/* Header */}
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderInfo}>
                <div className={styles.headerTitle}>
                  {activeConv.listingId?.title || "Listing Chat"} (₹{activeConv.listingId?.price})
                </div>
                <div className={styles.headerSubtitle}>
                  Chatting with <strong>{getPartnerName(activeConv)}</strong>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={onClose}>&times;</button>
            </div>

            {/* Messages Feed */}
            <div className={styles.messagesFeed}>
              {messages.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>💬 Start the conversation! Ask seller about availability, condition, or make an offer.</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isSelf = isSameId(msg.sender, user?._id);
                  const formattedTime = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={msg._id}
                      className={`${styles.msgRow} ${isSelf ? styles.msgRowSelf : styles.msgRowOther}`}
                    >
                      {msg.offerPrice ? (
                        <div className={styles.offerCard}>
                          <div className={styles.offerCardTitle}>🏷️ Price Offer</div>
                          <div className={styles.offerPriceTag}>₹{msg.offerPrice}</div>
                          <div>
                            {msg.offerStatus === 'pending' && <span className={styles.offerBadgePending}>⏳ Pending Response</span>}
                            {msg.offerStatus === 'accepted' && <span className={styles.offerBadgeAccepted}>✅ Offer Accepted</span>}
                            {msg.offerStatus === 'rejected' && <span className={styles.offerBadgeRejected}>❌ Offer Declined</span>}
                          </div>

                          {/* Render Accept / Reject buttons if receiver & pending */}
                          {!isSelf && msg.offerStatus === 'pending' && (
                            <div className={styles.offerActions}>
                              <button
                                className={styles.acceptBtn}
                                onClick={() => handleOfferResponse(msg._id, 'accepted')}
                              >
                                Accept ₹{msg.offerPrice}
                              </button>
                              <button
                                className={styles.rejectBtn}
                                onClick={() => handleOfferResponse(msg._id, 'rejected')}
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={`${styles.msgBubble} ${isSelf ? styles.bubbleSelf : styles.bubbleOther}`}>
                          {msg.text}
                        </div>
                      )}
                      <span className={styles.msgTime}>{formattedTime}</span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer Input Form */}
            <form className={styles.chatFooter} onSubmit={handleSend}>
              {showOfferBox && (
                <div className={styles.offerBox}>
                  <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#0369a1' }}>💰 Offer Amount (₹):</span>
                  <input
                    type="number"
                    className={styles.offerInput}
                    placeholder={`Listing: ₹${activeConv.listingId?.price || ''}`}
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    min="1"
                  />
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.1rem' }}
                    onClick={() => { setShowOfferBox(false); setOfferPrice(''); }}
                  >
                    &times;
                  </button>
                </div>
              )}

              <div className={styles.inputRow}>
                <button
                  type="button"
                  className={styles.offerToggleBtn}
                  onClick={() => setShowOfferBox(!showOfferBox)}
                >
                  🏷️ {showOfferBox ? "Cancel Offer" : "Make Offer"}
                </button>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="Type your message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button type="submit" className={styles.sendBtn}>Send</button>
              </div>
            </form>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>Select a conversation from the left sidebar or start a new chat from any listing.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatWidget;
