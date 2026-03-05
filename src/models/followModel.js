const db = require('../configs/database');

const followUser = async (followerId, followingId) => {
  // Prevent self-following
  if (followerId === followingId) {
    throw new Error('Cannot follow yourself');
  }

  // Check if already following
  const [existing] = await db.execute(
    'SELECT id FROM followers WHERE follower_id = ? AND following_id = ?',
    [followerId, followingId]
  );

  if (existing.length > 0) {
    throw new Error('Already following this user');
  }

  // Create follow relationship
  await db.execute(
    'INSERT INTO followers (follower_id, following_id) VALUES (?, ?)',
    [followerId, followingId]
  );

  // Update follower counts
  await updateFollowCounts(followerId);
  await updateFollowCounts(followingId);

  // Create notification
  const Notification = require('./notiModel');
  await Notification.createNotification({
    userId: followingId,
    senderId: followerId,
    type: 'follow',
    referenceId: followerId,
  });

  return { followed: true, notifiedUserId: followingId };
};

const unfollowUser = async (followerId, followingId) => {
  // Check if following
  const [existing] = await db.execute(
    'SELECT id FROM followers WHERE follower_id = ? AND following_id = ?',
    [followerId, followingId]
  );

  if (existing.length === 0) {
    throw new Error('Not following this user');
  }

  // Remove follow relationship
  await db.execute(
    'DELETE FROM followers WHERE follower_id = ? AND following_id = ?',
    [followerId, followingId]
  );

  // Update follower counts
  await updateFollowCounts(followerId);
  await updateFollowCounts(followingId);

  return { followed: false };
};

const isFollowing = async (followerId, followingId) => {
  const [result] = await db.execute(
    'SELECT COUNT(*) as count FROM followers WHERE follower_id = ? AND following_id = ?',
    [followerId, followingId]
  );
  
  return result[0].count > 0;
};

const updateFollowCounts = async (userId) => {
  // Update followers count
  const [followers] = await db.execute(
    'SELECT COUNT(*) as count FROM followers WHERE following_id = ?',
    [userId]
  );

  // Update following count  
  const [following] = await db.execute(
    'SELECT COUNT(*) as count FROM followers WHERE follower_id = ?',
    [userId]
  );

  // Update users table
  await db.execute(
    'UPDATE users SET followers = ?, following = ? WHERE id = ?',
    [followers[0].count, following[0].count, userId]
  );
};

module.exports = {
  followUser,
  unfollowUser,
  isFollowing,
  updateFollowCounts
};
