const db = require('../configs/database');

const addComment = async (userId, postId, content) => {
  const [result] = await db.query(
    'INSERT INTO comments (user_id, post_id, content) VALUES (?, ?, ?)',
    [userId, postId, content]
  );
  return result.insertId;
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