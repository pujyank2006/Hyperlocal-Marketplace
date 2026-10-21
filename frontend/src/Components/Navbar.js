import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { notificationService, chatService } from '../services/api';
import { handleSuccess } from '../utils';
import styles from '../ComponentStyles/navbar.module.css';
import AccountOptions from './accountOptions';
import ChatWidget from './ChatWidget';
import NotificationDropdown from './NotificationDropdown';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:9000";

function Navbar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAccountOpen, setAccountOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Fetch unread count & setup socket
  useEffect(() => {
    const uid = user?._id || user?.id;
    if (!uid) return;

    notificationService.getUnreadCount()
      .then(data => {
        if (data && data.success) {
          setUnreadNotifs(data.unreadCount || 0);
        }
      })
      .catch(err => console.error("Unread notifs error:", err));

    chatService.getUnreadCount()
      .then(data => {
        if (data && data.success) {
          setUnreadMessages(data.unreadCount || 0);
        }
      })
      .catch(err => console.error("Unread messages error:", err));

    const socket = io(SOCKET_SERVER_URL, { withCredentials: true });

    const joinRoom = () => {
      socket.emit('join_room', `user_${uid.toString()}`);
    };

    if (socket.connected) {
      joinRoom();
    }
    socket.on('connect', joinRoom);

    socket.on('new_alert_notification', (data) => {
      setUnreadNotifs(prev => prev + 1);
      if (data && data.message) {
        handleSuccess(`🔔 ${data.title || 'New Item Alert'}: ${data.message}`);
      }
    });

    socket.on('notifications_read', (data) => {
      setUnreadNotifs(data.unreadCount !== undefined ? data.unreadCount : 0);
    });

    socket.on('new_message_notification', (data) => {
      setUnreadMessages(prev => prev + 1);
      const senderName = data.senderName || 'Someone';
      const msgText = data.text || data.message?.text || 'Sent you a message';
      handleSuccess(`💬 ${senderName}: ${msgText}`);
    });

    socket.on('messages_read', (data) => {
      setUnreadMessages(data.unreadCount !== undefined ? data.unreadCount : 0);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Sync state across components without full page reload
  useEffect(() => {
    const handleChatRead = (e) => {
      if (e.detail && e.detail.unreadCount !== undefined) {
        setUnreadMessages(e.detail.unreadCount);
      } else {
        chatService.getUnreadCount().then(data => {
          if (data?.success) setUnreadMessages(data.unreadCount || 0);
        });
      }
    };

    const handleNotifRead = (e) => {
      if (e.detail && e.detail.unreadCount !== undefined) {
        setUnreadNotifs(e.detail.unreadCount);
      } else {
        notificationService.getUnreadCount().then(data => {
          if (data?.success) setUnreadNotifs(data.unreadCount || 0);
        });
      }
    };

    window.addEventListener('chat_messages_read', handleChatRead);
    window.addEventListener('notifications_read', handleNotifRead);

    return () => {
      window.removeEventListener('chat_messages_read', handleChatRead);
      window.removeEventListener('notifications_read', handleNotifRead);
    };
  }, []);

  const handleNotificationClick = (notif) => {
    setUnreadNotifs(prev => Math.max(0, prev - 1));
    if (notif.listing) {
      navigate('/dashboard');
    }
  };

  return (
    <>
      <header className={styles.navbar}>
        <Link to="/" className={styles.brandLink}>
          <div className={styles.logoBadge}>🛍️</div>
          <span className={styles.brandTitle}>
            Hyperlocal <span className={styles.brandAccent}>Marketplace</span>
            <span className={styles.taglineBadge}>LOCAL</span>
          </span>
        </Link>

        <div className={styles.rightGroup}>
          <button
            className={styles.accountBtn}
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              setAccountOpen(false);
            }}
            title="Notifications & Alerts"
            style={{ position: 'relative' }}
          >
            <div className={styles.avatarIcon} style={{ background: unreadNotifs > 0 ? '#e11d48' : '#0284c7' }}>
              🔔
            </div>
            <span>Alerts</span>
            {unreadNotifs > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#e11d48',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: '800',
                borderRadius: '10px',
                padding: '1px 6px',
                border: '2px solid #0f172a'
              }}>
                {unreadNotifs}
              </span>
            )}
          </button>

          <NotificationDropdown
            open={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
            onNotificationClick={handleNotificationClick}
            onMarkAllRead={() => setUnreadNotifs(0)}
            onUnreadCountChange={(count) => setUnreadNotifs(count)}
          />

          <button
            className={styles.accountBtn}
            onClick={() => {
              setIsChatOpen(true);
              setIsNotifOpen(false);
            }}
            title="Open Chat & Messages"
            style={{ position: 'relative' }}
          >
            <div className={styles.avatarIcon} style={{ background: unreadMessages > 0 ? '#e11d48' : '#0284c7' }}>💬</div>
            <span>Messages</span>
            {unreadMessages > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#e11d48',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: '800',
                borderRadius: '10px',
                padding: '1px 6px',
                border: '2px solid #0f172a'
              }}>
                {unreadMessages}
              </span>
            )}
          </button>

          <button
            className={styles.accountBtn}
            onClick={() => {
              setAccountOpen(!isAccountOpen);
              setIsNotifOpen(false);
            }}
          >
            <div className={styles.avatarIcon}>👤</div>
            <span>Account</span>
          </button>

          <AccountOptions open={isAccountOpen} onClose={() => setAccountOpen(false)} />
        </div>
      </header>

      <ChatWidget
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </>
  );
}

export default Navbar;
