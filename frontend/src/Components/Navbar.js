import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/api';
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

    return () => {
      socket.disconnect();
    };
  }, [user]);

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
          />

          <button
            className={styles.accountBtn}
            onClick={() => {
              setIsChatOpen(true);
              setIsNotifOpen(false);
            }}
            title="Open Chat & Messages"
          >
            <div className={styles.avatarIcon}>💬</div>
            <span>Messages</span>
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
