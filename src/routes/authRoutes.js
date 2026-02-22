const express = require('express');
const router = express.Router();

const authControllers = require('../controllers/authControllers');
const { authentication, authorize } = require("../middlewares/authMiddlewares");

router.post('/login', authControllers.Login);
router.post('/register', authControllers.Register);
router.post('/forgot-password', authControllers.forgetPassword);
router.post('/reset-password/:token', authControllers.resetPassword);
router.get('/me', authentication, authControllers.getMe);

module.exports = router;