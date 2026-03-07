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

const getFollowingPosts = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const posts = await Post.getFollowingPosts(currentUserId);

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

const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { caption, image_url } = req.body;

    if (!caption && caption !== '' && !image_url) {
      return res.status(400).json({
        success: false,
        message: "Caption or image is required"
      });
    }

    const updated = await Post.updatePost(postId, userId, caption, image_url);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Post not found or unauthorized"
      });
    }

    // Fetch updated post to return
    const updatedPost = await Post.getPostById(postId, userId);

    const io = req.app.get("io");
    io.emit("postUpdated", updatedPost);

    res.json({
      success: true,
      message: "โพสต์ถูกแก้ไขแล้ว",
      data: updatedPost
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    console.log(`[DEBUG] deletePost called with postId: ${postId}, userId: ${userId}`);

    const deleted = await Post.deletePost(postId, userId);
    console.log(`[DEBUG] deletePost result for ${postId}: ${deleted}`);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Post not found or unauthorized. PostId: " + postId + ", UserId: " + userId
      });
    }

    const io = req.app.get("io");
    if (io) io.emit("postDeleted", { postId });

    res.json({
      success: true,
      message: "โพสต์ถูกลบแล้ว"
    });
  } catch (error) {
    console.error('[ERROR] deletePost:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createPost,
  getPost,
  getPosts,
  getFollowingPosts,
  toggleLike,
  addComment,
  getComments,
  getPostsByUserId,
  uploadImage,
  updatePost,
  deletePost
};
