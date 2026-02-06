const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

const router = express.Router();

/**
 * GET /api/users
 * Get all users (Admin only)
 */
router.get('/', auth, isAdmin, async (req, res, next) => {
    try {
        const { role, search, page = 1, limit = 20 } = req.query;

        const where = {};

        if (role) {
            where.role = role;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    avatar: true,
                    createdAt: true,
                    _count: {
                        select: {
                            enrollments: true,
                            courses: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: parseInt(limit)
            }),
            prisma.user.count({ where })
        ]);

        res.json({
            success: true,
            data: users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/users/list
 * Get all users (for chat purposes - accessible to all authenticated users)
 */
router.get('/list', auth, async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            where: {
                id: {
                    not: req.userId // ИСПРАВЛЕНО: используем req.userId вместо req.user.id
                }
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/users/:id
 * Get user by ID (Admin only)
 */
router.get('/:id', auth, isAdmin, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(req.params.id) },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                createdAt: true,
                enrollments: {
                    include: {
                        course: {
                            select: { id: true, title: true, category: true }
                        }
                    }
                },
                progress: {
                    include: {
                        lesson: {
                            select: { id: true, title: true, courseId: true }
                        }
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/users
 * Create new user (Admin only - no self-registration)
 */
router.post('/', auth, isAdmin, async (req, res, next) => {
    try {
        const { email, password, name, role = 'STUDENT' } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email, пароль и имя обязательны'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Пароль должен быть не менее 6 символов'
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Пользователь с таким email уже существует'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                password: hashedPassword,
                name,
                role
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true
            }
        });

        res.status(201).json({
            success: true,
            data: user,
            message: 'Пользователь успешно создан'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/users/:id
 * Update user (Admin only)
 */
router.put('/:id', auth, isAdmin, async (req, res, next) => {
    try {
        const { name, role, password } = req.body;
        const userId = parseInt(req.params.id);

        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }

        const updateData = {};

        if (name) updateData.name = name;
        if (role) updateData.role = role;
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Пароль должен быть не менее 6 символов'
                });
            }
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                updatedAt: true
            }
        });

        res.json({
            success: true,
            data: user,
            message: 'Пользователь обновлён'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/users/:id
 * Delete user (Admin only)
 */
router.delete('/:id', auth, isAdmin, async (req, res, next) => {
    try {
        const userId = parseInt(req.params.id);

        // ИСПРАВЛЕНО: сравниваем с req.userId вместо req.user.id
        if (userId === req.userId) {
            return res.status(400).json({
                success: false,
                message: 'Невозможно удалить свой аккаунт'
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }

        await prisma.user.delete({
            where: { id: userId }
        });

        res.json({
            success: true,
            message: 'Пользователь удалён'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;