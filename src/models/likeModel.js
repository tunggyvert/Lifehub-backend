const db = require('../configs/database');
const Notification = require('./notiModel');

const toggleLike = async (userId, postId) => {
  const [existingLike] = await db.query(
    'SELECT id FROM likes WHERE user_id = ? AND post_id = ?',
    [userId, postId]
  );

  if (existingLike.length > 0) {
    await db.query('DELETE FROM likes WHERE id = ?', [existingLike[0].id]);
    return { liked: false, notifiedUserId: null };
    
  } else {

    await db.query('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [userId, postId]);
    const [posts] = await db.query('SELECT user_id FROM posts WHERE id = ?', [postId]);
    const postOwnerId = posts.length > 0 ? posts[0].user_id : null;

    if (postOwnerId != null && Number(postOwnerId) !== Number(userId)) {
      await Notification.createNotification({
        userId: postOwnerId,
        senderId: userId,
        type: 'like',
        referenceId: postId,
      });
      return { liked: true, notifiedUserId: Number(postOwnerId) };
    }

    return { liked: true, notifiedUserId: null };
  }
};

module.exports = { toggleLike };