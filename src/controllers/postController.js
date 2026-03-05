const Post = require('../models/postModel');
const db = require('../configs/database');

// Get posts by user ID
const getPostsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const [posts] = await db.query(`
      SELECT id, user_id, caption, image_url, username, profile_image, 
             created_at, like_count, comment_count
      FROM posts 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [parseInt(userId)]);

    res.status(200).json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Error getting posts by user ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getPostsByUserId
};
