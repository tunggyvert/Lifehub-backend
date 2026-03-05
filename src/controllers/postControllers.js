const Post = require("../models/postModel");
const Like = require("../models/likeModel");
const Comment = require("../models/commentModel");
const db = require("../configs/database");

const createPost = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('User ID:', req.user.id);

    const { caption, image_url } = req.body;

    console.log('Caption:', caption);
    console.log('Image URL:', image_url);

    if (!caption && !image_url) {
      return res.status(400).json({
        success: false,
        message: "กรุณาใส่ข้อมูลให้ครบ"
      });
    }

    const postId = await Post.createPost(
      req.user.id,
      caption,
      image_url
    );

    const newPost = await Post.getPostById(postId, req.user.id);

    const io = req.app.get("io");
    io.emit("newPost", newPost);

    res.status(201).json({
      success: true,
      message: "โพสต์สำเร็จ",
      postId
    });

  } catch (error) {
    console.error('Create post error:', error); // ← เพิ่ม debug
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user?.id || 0;

    const post = await Post.getPostById(postId, userId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getPosts = async (req, res) => {
  try {
    const currentUserId = req.user?.id || 0;
    const posts = await Post.getAllPosts(currentUserId);

    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const result = await Like.toggleLike(userId, postId);

    const updatedPost = await Post.getPostById(postId, userId);

    const io = req.app.get("io");
    io.emit("postUpdated", updatedPost);

    if (result && result.notifiedUserId) {
      io.emit('notificationCreated', { userId: result.notifiedUserId });
    }

    res.json({
      success: true,
      message: result.liked ? "Liked" : "Unliked",
      liked: result.liked
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: "กรุณาใส่ข้อความคอมเมนต์" });
    }

    const result = await Comment.addComment(userId, postId, content);
    const commentId = result.commentId;

    const io = req.app.get("io");
    if (result && result.notifiedUserId) {
      io.emit('notificationCreated', { userId: result.notifiedUserId });
    }

    res.status(201).json({
      success: true,
      message: "คอมเมนต์สำเร็จ",
      commentId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getComments = async (req, res) => {
  try {
    const postId = req.params.id;
    const comments = await Comment.getCommentsByPostId(postId);

    res.json({ success: true, data: comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ← เพิ่ม uploadImage function
const uploadImage = async (req, res) => {
  try {
    console.log('Upload request received');
    console.log('File:', req.file);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // สร้าง URL สำหรับเข้าถึงไฟล์
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    console.log('Generated image URL:', imageUrl);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get posts by user ID
const getPostsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const [posts] = await db.query(`
      SELECT 
        p.id, p.user_id, p.caption, p.image_url, p.created_at, p.updated_at,
        u.username, u.profile_image,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comment_count,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) AS is_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ? AND p.deleted_at IS NULL
      ORDER BY p.created_at DESC
    `, [currentUserId || 0, parseInt(userId)]);

    res.status(200).json({
      success: true,
      data: posts.map(row => ({
        ...row,
        is_liked: !!row.is_liked
      }))
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
  createPost,
  getPost,
  getPosts,
  toggleLike,
  addComment,
  getComments,
  getPostsByUserId,  // ← เพิ่ม export
  uploadImage  // ← เพิ่ม export
};
