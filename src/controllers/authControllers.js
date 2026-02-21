const db = require('../configs/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { generateToken } = require('../utils/jwt');

const Login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await db.execute(
            "SELECT id, email, username, password, role FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = generateToken({
            id: user.id,
            role: user.role
        });

        res.json({
            success: true,
            token
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const Register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const [existingUser] = await db.execute(
            "SELECT id FROM users WHERE email = ? OR username = ?",
            [email, username]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            "INSERT INTO users (email, username, password) VALUES (?, ?, ?)",
            [email, username, hashedPassword]
        );


        const token = generateToken({
            id: result.insertId,
            role: "user"
        });

        res.status(201).json({
            success: true,
            token
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const [users] = await db.execute(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );


        if (users.length === 0) {
            return res.json({ message: "If email exists, reset link will be sent" });
        }

        const user = users[0];

        const resetToken = crypto.randomBytes(32).toString("hex");

        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        const expireTime = new Date(Date.now() + 15 * 60 * 1000);

        await db.execute(
            "UPDATE users SET reset_token = ?, reset_token_expire = ? WHERE id = ?",
            [hashedToken, expireTime, user.id]
        );

        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            to: email,
            subject: "Password Reset",
            html: `
        <h3>Reset Your Password</h3>
        <p>This link is valid for 15 minutes:</p>
        <a href="${resetUrl}">${resetUrl}</a>
      `
        });

        res.json({ message: "If email exists, reset link will be sent" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const [users] = await db.execute(
            "SELECT id FROM users WHERE reset_token = ? AND reset_token_expire > NOW()",
            [hashedToken]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute(
            `UPDATE users 
       SET password = ?, reset_token = NULL, reset_token_expire = NULL 
       WHERE id = ?`,
            [hashedPassword, users[0].id]
        );

        res.json({ message: "Password reset successful" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong" });
    }
};

const getMe = async (req, res) => {
    try {
        const userId = req.user.id;

        const [users] = await db.execute(
            `SELECT id, email, username, role, bio, profile_image, is_verified, created_at
       FROM users
       WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const [[followers]] = await db.execute(
            "SELECT COUNT(*) as totalFollowers FROM followers WHERE following_id = ?",
            [userId]
        );

        const [[following]] = await db.execute(
            "SELECT COUNT(*) as totalFollowing FROM followers WHERE follower_id = ?",
            [userId]
        );

        res.json({
            success: true,
            data: {
                ...users[0],
                followers: followers.totalFollowers,
                following: following.totalFollowing
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Something went wrong" });
    }
};


module.exports = {
    Login,
    Register,
    forgetPassword,
    resetPassword,
    getMe
};