const express = require("express");
const router = express.Router();

const PostController = require("../controllers/postControllers");
const { authentication } = require("../middlewares/authMiddlewares");

router.post("/", authentication, PostController.createPost);
router.get("/", PostController.getPosts);

router.post("/:id/like", authentication, PostController.toggleLike);
router.post("/:id/comments", authentication, PostController.addComment);
router.get("/:id/comments", authentication, PostController.getComments);

module.exports = router;