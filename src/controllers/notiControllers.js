const Notification = require("../models/notiModel");

const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, page = 1 } = req.query;

    const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const offset = (safePage - 1) * safeLimit;

    console.log('[DEBUG] getMyNotifications', { 
      userId, 
      limit: req.query.limit, 
      page: req.query.page, 
      safeLimit, 
      safePage, 
      offset,
      limitType: typeof safeLimit,
      offsetType: typeof offset
    });

    const notifications = await Notification.getUserNotifications(
      userId,
      safeLimit,
      offset
    );

    res.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('[ERROR] getMyNotifications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Notification.getUnreadCount(userId);

    res.json({
      success: true,
      unread_count: count
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    await Notification.markAsRead(notificationId, userId);

    res.json({
      success: true,
      message: "Notification marked as read"
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.markAllAsRead(userId);

    res.json({
      success: true,
      message: "All notifications marked as read"
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
};