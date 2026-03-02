const db = require("../configs/database");

const createNotification = async ({
  userId,
  senderId,
  type,
  referenceId
}) => {
  await db.execute(
    `INSERT INTO notifications 
     (user_id, sender_id, type, reference_id)
     VALUES (?, ?, ?, ?)`,
    [userId, senderId, type, referenceId]
  );
};

const getUserNotifications = async (userId, limit = 20, offset = 0) => {
  const [rows] = await db.execute(
    `SELECT 
        n.*, 
        u.username AS sender_username,
        u.profile_image AS sender_profile_image
     FROM notifications n
     JOIN users u ON n.sender_id = u.id
     WHERE n.user_id = ?
     ORDER BY n.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  return rows;
};

const getUnreadCount = async (userId) => {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS unread_count
     FROM notifications
     WHERE user_id = ? AND is_read = FALSE`,
    [userId]
  );

  return rows[0].unread_count;
};

const markAsRead = async (notificationId, userId) => {
  await db.execute(
    `UPDATE notifications 
     SET is_read = TRUE 
     WHERE id = ? AND user_id = ?`,
    [notificationId, userId]
  );
};

const markAllAsRead = async (userId) => {
  await db.execute(
    `UPDATE notifications 
     SET is_read = TRUE 
     WHERE user_id = ?`,
    [userId]
  );
};

module.exports = {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};