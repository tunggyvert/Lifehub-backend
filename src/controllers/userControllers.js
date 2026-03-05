const User = require('../models/userModel');
const Follow = require('../models/followModel');

const getUserProfile = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user?.id || 0;

    // Get user profile
    const user = await User.getUserById(targetUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if current user is following this user
    let isFollowing = false;
    if (currentUserId !== 0 && currentUserId !== parseInt(targetUserId)) {
      isFollowing = await Follow.isFollowing(currentUserId, targetUserId);
    }

    // Remove sensitive information
    const { password, ...userProfile } = user;

    res.json({
      success: true,
      data: {
        ...userProfile,
        isFollowing
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const followUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const followerId = req.user.id;

    if (parseInt(targetUserId) === followerId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself'
      });
    }

    const result = await Follow.followUser(followerId, parseInt(targetUserId));

    // Emit real-time event
    const io = req.app.get("io");
    if (result && result.notifiedUserId) {
      io.emit('notificationCreated', { userId: result.notifiedUserId });
    }

    res.json({
      success: true,
      message: 'User followed successfully',
      followed: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const unfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const followerId = req.user.id;

    await Follow.unfollowUser(followerId, parseInt(targetUserId));

    res.json({
      success: true,
      message: 'User unfollowed successfully',
      followed: false
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getUserProfile,
  followUser,
  unfollowUser
};
