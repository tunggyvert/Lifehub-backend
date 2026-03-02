const Post = require("../models/postModel");
const Like = require("../models/likeModel"); 
const Comment = require("../models/commentModel");

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

    const commentId = await Comment.addComment(userId, postId, content);
    
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

module.exports = {
  createPost,
  getPosts,
  toggleLike,
  addComment,
  getComments,
  uploadImage  // ← เพิ่ม export
};
