const express = require('express');
const router = express.Router();
const { upload, uploadImage } = require('../controllers/uploadControllers');
const { authentication } = require("../middlewares/authMiddlewares");

// POST /api/upload
router.post('/upload', authentication, upload.single('image'), uploadImage);

module.exports = router;