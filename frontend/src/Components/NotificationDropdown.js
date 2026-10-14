import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/api';
import styles from '../ComponentStyles/notificationDropdown.module.css';

function timeAgo(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  return `${diffDays}d ago`;
}

function NotificationDropdown({ open, onClose, onNotificationClick = () => {} }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications when opened
  useEffect(() => {
    if (!open || !user) return;

    let isMounted = true;
    setIsLoading(true);
    notificationService.getNotifications()
      .then(data => {
        if (isMounted && data.success) {
          setNotifications(data.notifications || []);
        }
      })
      .catch(err => console.error("Error fetching notifications:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [open, user]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  const handleMarkAllRead = async () => {
    try {
      const data = await notificationService.markAllAsRead();
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await notificationService.markAsRead(notif._id);
        setNotifications(prev =>
          prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n)
        );
      } catch (err) {
        console.error("Error marking notification read:", err);
      }
    }
    onNotificationClick(notif);
    onClose();
  };

  if (!open) return null;

  return (
    <div className={styles.dropdownWrapper} ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
      <div className={styles.dropdownHeader}>
        <div className={styles.headerTitle}>
          <span>🔔</span> Notifications & Alerts
        </div>
        {notifications.some(n => !n.isRead) && (
          <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      <ul className={styles.notificationList}>
        {isLoading ? (
          <div className={styles.emptyState}>Loading alerts...</div>
        ) : notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔕</div>
            <p>No new alerts yet.</p>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
              Save a search on Dashboard to receive alerts when matching items are listed!
            </p>
          </div>
        ) : (
          notifications.map(notif => (
            <li
              key={notif._id}
              className={`${styles.notificationItem} ${!notif.isRead ? styles.unread : ''}`}
              onClick={() => handleItemClick(notif)}
            >
              {!notif.isRead && <span className={styles.unreadDot} />}
              <div className={styles.itemTitle}>{notif.title}</div>
              <div className={styles.itemMessage}>{notif.message}</div>
              <div className={styles.itemTime}>{timeAgo(notif.createdAt)}</div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default NotificationDropdown;
