const express = require("express");
const router = express.Router();

const UserController = require("../controllers/userControllers");
const { authentication } = require("../middlewares/authMiddlewares");

// Get user profile with follow status
router.get("/:userId", authentication, UserController.getUserProfile);

// Follow/Unfollow user
router.post("/:userId/follow", authentication, UserController.followUser);
router.delete("/:userId/follow", authentication, UserController.unfollowUser);

module.exports = router;
