const Notification = require("../models/notiModel");

const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, page = 1 } = req.query;

    const offset = (page - 1) * limit;

    const notifications = await Notification.getUserNotifications(
      userId,
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      success: true,
      data: notifications
    });

  } catch (error) {
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