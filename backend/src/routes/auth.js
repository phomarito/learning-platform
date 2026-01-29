const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email и пароль обязательны'
            });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Неверный email или пароль'
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Неверный email или пароль'
            });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    avatar: user.avatar
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', auth, async (req, res) => {
    res.json({
        success: true,
        data: req.user
    });
});

/**
 * PUT /api/auth/password
 * Change current user password
 */
router.put('/password', auth, async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Текущий и новый пароль обязательны'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Пароль должен быть не менее 6 символов'
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        const isValidPassword = await bcrypt.compare(currentPassword, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Неверный текущий пароль'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword }
        });

        res.json({
            success: true,
            message: 'Пароль успешно изменён'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
