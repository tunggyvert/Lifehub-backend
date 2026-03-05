const db = require('../configs/database');

const getUserById = async (userId) => {
  const [users] = await db.execute(
    `SELECT id, email, username, role, bio, profile_image, is_verified, created_at,
            followers, following
     FROM users
     WHERE id = ?`,
    [userId]
  );

  return users.length > 0 ? users[0] : null;
};

module.exports = {
  getUserById
};
