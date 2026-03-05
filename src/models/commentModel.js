const db = require('../configs/database');
const Notification = require('./notiModel');

const addComment = async (userId, postId, content) => {
  const [result] = await db.query(
    'INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)',
    [userId, postId, content]
  );

  const [posts] = await db.query('SELECT user_id FROM posts WHERE id = ?', [postId]);
  const postOwnerId = posts.length > 0 ? posts[0].user_id : null;

  if (postOwnerId != null && Number(postOwnerId) !== Number(userId)) {
    await Notification.createNotification({
      userId: postOwnerId,
      senderId: userId,
      type: 'comment',
      referenceId: postId,
    });
    return { commentId: result.insertId, notifiedUserId: Number(postOwnerId) };
  }

  return { commentId: result.insertId, notifiedUserId: null };
};

const getCommentsByPostId = async (postId) => {
  const [rows] = await db.query(`
    SELECT c.id, c.content, c.created_at, u.id AS user_id, u.username, u.profile_image 
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at DESC
  `, [postId]);
  return rows;
};

module.exports = { addComment, getCommentsByPostId };