const express = require("express");
const router = express.Router();

const PostController = require("../controllers/postControllers");
const { authentication } = require("../middlewares/authMiddlewares");

router.post("/", authentication, PostController.createPost);
router.get("/", authentication, PostController.getPosts);
router.get("/:id", authentication, PostController.getPost); // Add route to get single post
router.get("/user/:userId", authentication, PostController.getPostsByUserId); // Add route to get posts by user ID

router.post("/:id/like", authentication, PostController.toggleLike);
router.post("/:id/comments", authentication, PostController.addComment);
router.get("/:id/comments", authentication, PostController.getComments);

module.exports = router;