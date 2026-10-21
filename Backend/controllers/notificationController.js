const Notification = require('../models/notification');

/**
 * Get all notifications for the authenticated user
 */
async function getNotifications(req, res) {
    try {
        const userID = req.user.id;

        const notifications = await Notification.find({ user: userID })
            .populate('listing', 'title price images status category')
            .populate('savedSearch', 'title category query')
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({ user: userID, isRead: false });

        return res.status(200).json({
            success: true,
            count: notifications.length,
            unreadCount,
            notifications
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch notifications" });
    }
}

/**
 * Mark a specific notification as read
 */
async function markAsRead(req, res) {
    try {
        const userID = req.user.id;
        const { id } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, user: userID },
            { $set: { isRead: true } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        const unreadCount = await Notification.countDocuments({ user: userID, isRead: false });

        const io = req.app.get('io');
        if (io) {
            io.to(`user_${userID.toString()}`).emit('notifications_read', { unreadCount });
        }

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            unreadCount,
            notification
        });
    } catch (error) {
        console.error("Error marking notification read:", error);
        return res.status(500).json({ success: false, message: "Failed to update notification" });
    }
}

/**
 * Mark all notifications as read for current user
 */
async function markAllAsRead(req, res) {
    try {
        const userID = req.user.id;

        await Notification.updateMany(
            { user: userID, isRead: false },
            { $set: { isRead: true } }
        );

        const io = req.app.get('io');
        if (io) {
            io.to(`user_${userID.toString()}`).emit('notifications_read', { unreadCount: 0 });
        }

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
            unreadCount: 0
        });
    } catch (error) {
        console.error("Error marking all read:", error);
        return res.status(500).json({ success: false, message: "Failed to update notifications" });
    }
}

/**
 * Get quick count of unread notifications
 */
async function getUnreadCount(req, res) {
    try {
        const userID = req.user.id;
        const unreadCount = await Notification.countDocuments({ user: userID, isRead: false });

        return res.status(200).json({
            success: true,
            unreadCount
        });
    } catch (error) {
        console.error("Error fetching unread count:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch count" });
    }
}

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount
};
