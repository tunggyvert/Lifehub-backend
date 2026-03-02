const db = require('../configs/database');

const toggleLike = async (userId, postId) => {
  const [existingLike] = await db.query(
    'SELECT id FROM likes WHERE user_id = ? AND post_id = ?',
    [userId, postId]
  );

  if (existingLike.length > 0) {
    await db.query('DELETE FROM likes WHERE id = ?', [existingLike[0].id]);
    return { liked: false };
    
  } else {

    await db.query('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [userId, postId]);
    return { liked: true };
  }
};

module.exports = { toggleLike };