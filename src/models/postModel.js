const db = require("../configs/database");

const createPost = async (userId, caption, imageUrl) => {
  try {
    console.log('Creating post with:', { userId, caption, imageUrl });

    const [result] = await db.execute(
      "INSERT INTO posts (user_id, caption, image_url) VALUES (?, ?, ?)",
      [userId, caption, imageUrl]
    );

    console.log('Insert result:', result);
    return result.insertId;
  } catch (error) {
    console.error('Database error in createPost:', error);
    throw error;
  }
};

const getAllPosts = async (currentUserId) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        posts.*, 
        users.username, 
        users.profile_image,
        (SELECT COUNT(*) FROM likes WHERE post_id = posts.id) AS like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) AS comment_count,
        EXISTS(
          SELECT 1 FROM likes 
          WHERE post_id = posts.id AND user_id = ?
        ) AS is_liked
      FROM posts
      JOIN users ON posts.user_id = users.id
      WHERE posts.deleted_at IS NULL
      ORDER BY posts.created_at DESC
    `, [currentUserId || 0]);

    return rows.map(row => ({
      ...row,
      is_liked: !!row.is_liked
    }));
  } catch (error) {
    console.error('Database error in getAllPosts:', error);
    throw error;
  }
};

const getFollowingPosts = async (currentUserId) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        posts.*, 
        users.username, 
        users.profile_image,
        (SELECT COUNT(*) FROM likes WHERE post_id = posts.id) AS like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) AS comment_count,
        EXISTS(
          SELECT 1 FROM likes 
          WHERE post_id = posts.id AND user_id = ?
        ) AS is_liked
      FROM posts
      JOIN users ON posts.user_id = users.id
      JOIN followers ON followers.following_id = posts.user_id
      WHERE posts.deleted_at IS NULL
        AND followers.follower_id = ?
      ORDER BY posts.created_at DESC
    `, [currentUserId || 0, currentUserId || 0]);

    return rows.map(row => ({
      ...row,
      is_liked: !!row.is_liked
    }));
  } catch (error) {
    console.error('Database error in getFollowingPosts:', error);
    throw error;
  }
};

const getPostById = async (postId, currentUserId) => {
  try {
    const [rows] = await db.execute(
      `SELECT 
          posts.id,
          posts.user_id,
          posts.caption,
          posts.image_url,
          posts.created_at,
          posts.updated_at,
          posts.deleted_at,
          users.username,
          users.profile_image,
          COUNT(DISTINCT l.id) AS like_count,
          COUNT(DISTINCT c.id) AS comment_count,
          IF(l2.user_id IS NOT NULL, 1, 0) AS is_liked
       FROM posts
       JOIN users ON posts.user_id = users.id
       LEFT JOIN likes l ON l.post_id = posts.id
       LEFT JOIN comments c ON c.post_id = posts.id
       LEFT JOIN likes l2 
          ON l2.post_id = posts.id AND l2.user_id = ?
       WHERE posts.id = ?
       GROUP BY posts.id, posts.user_id, posts.caption, posts.image_url, 
                posts.created_at, posts.updated_at, posts.deleted_at,
                users.username, users.profile_image, l2.user_id`,
      [currentUserId || 0, postId]
    );

    return rows[0];
  } catch (error) {
    console.error('Database error in getPostById:', error);
    throw error;
  }
};

const updatePost = async (postId, userId, caption, imageUrl) => {
  try {
    const setClauses = [];
    const params = [];

    if (caption !== undefined) {
      setClauses.push("caption = ?");
      params.push(caption);
    }
    if (imageUrl !== undefined) {
      setClauses.push("image_url = ?");
      params.push(imageUrl);
    }
    setClauses.push("updated_at = NOW()");

    params.push(postId, userId);

    const [result] = await db.execute(
      `UPDATE posts SET ${setClauses.join(", ")} WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      params
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Database error in updatePost:', error);
    throw error;
  }
};

const deletePost = async (postId, userId) => {
  try {
    // Soft delete matching posts
    const [result] = await db.execute(
      "UPDATE posts SET deleted_at = NOW() WHERE id = ? AND user_id = ? AND deleted_at IS NULL",
      [postId, userId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Database error in deletePost:', error);
    throw error;
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getFollowingPosts,
  getPostById,
  updatePost,
  deletePost
};
