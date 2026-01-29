const express = require('express');
const prisma = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/chat/history
 * Get chat history for current user
 */
router.get('/history', auth, async (req, res, next) => {
    try {
        const { limit = 50 } = req.query;

        const messages = await prisma.chatMessage.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'asc' },
            take: parseInt(limit)
        });

        res.json({
            success: true,
            data: messages
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/chat
 * Send message to AI (placeholder - DeepSeek integration later)
 */
router.post('/', auth, async (req, res, next) => {
    try {
        const { message, context } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Сообщение обязательно'
            });
        }

        // Save user message
        const userMessage = await prisma.chatMessage.create({
            data: {
                userId: req.user.id,
                content: message,
                isAI: false,
                context
            }
        });

        // TODO: DeepSeek API integration will be added later
        // For now, return a placeholder response
        const aiResponseText = generatePlaceholderResponse(message, context);

        // Save AI response
        const aiMessage = await prisma.chatMessage.create({
            data: {
                userId: req.user.id,
                content: aiResponseText,
                isAI: true,
                context
            }
        });

        res.json({
            success: true,
            data: {
                userMessage,
                aiMessage
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/chat/recommendations
 * Get AI recommendations based on progress
 */
router.post('/recommendations', auth, async (req, res, next) => {
    try {
        // Get user's progress data
        const progress = await prisma.progress.findMany({
            where: { userId: req.user.id },
            include: {
                lesson: {
                    include: {
                        course: {
                            select: { id: true, title: true, category: true }
                        }
                    }
                }
            }
        });

        const enrollments = await prisma.enrollment.findMany({
            where: { userId: req.user.id },
            include: {
                course: {
                    select: { id: true, title: true, category: true }
                }
            }
        });

        // TODO: DeepSeek API integration for real recommendations
        // For now, generate basic recommendations
        const recommendations = generatePlaceholderRecommendations(progress, enrollments);

        res.json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/chat/resume
 * Generate AI resume based on certificates
 */
router.post('/resume', auth, async (req, res, next) => {
    try {
        const certificates = await prisma.certificate.findMany({
            where: { userId: req.user.id },
            include: {
                course: {
                    select: { title: true, category: true, duration: true }
                }
            }
        });

        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        // TODO: DeepSeek API integration for real resume generation
        const resume = generatePlaceholderResume(user, certificates);

        res.json({
            success: true,
            data: resume
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/chat/:id
 * Delete a chat message
 */
router.delete('/:id', auth, async (req, res, next) => {
    try {
        const messageId = parseInt(req.params.id);

        const message = await prisma.chatMessage.findUnique({
            where: { id: messageId }
        });

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Сообщение не найдено'
            });
        }

        if (message.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Нельзя удалить чужое сообщение'
            });
        }

        await prisma.chatMessage.delete({
            where: { id: messageId }
        });

        res.json({
            success: true,
            message: 'Сообщение удалено'
        });
    } catch (error) {
        next(error);
    }
});

// ==================== PLACEHOLDER FUNCTIONS ====================
// These will be replaced with DeepSeek API calls later

function generatePlaceholderResponse(message, context) {
    const responses = [
        'Отличный вопрос! Давайте разберёмся вместе.',
        'Это интересная тема для изучения.',
        'Рад помочь с этим вопросом!',
        'Продолжайте в том же духе, вы делаете отличные успехи!'
    ];

    if (message.toLowerCase().includes('помощь') || message.toLowerCase().includes('help')) {
        return 'Я могу помочь вам с материалами урока, дать рекомендации по обучению и проанализировать ваш прогресс. Что вас интересует?';
    }

    return responses[Math.floor(Math.random() * responses.length)];
}

function generatePlaceholderRecommendations(progress, enrollments) {
    const completedCategories = [...new Set(
        progress
            .filter(p => p.completed)
            .map(p => p.lesson.course.category)
    )];

    return {
        strengths: completedCategories.length > 0
            ? completedCategories
            : ['Начните изучение курсов, чтобы определить сильные стороны'],
        recommendations: [
            'Продолжайте изучение начатых курсов',
            'Уделяйте хотя бы 15 минут в день обучению',
            'Попробуйте курсы из смежных областей'
        ],
        nextSteps: enrollments
            .filter(e => {
                const courseProgress = progress.filter(p =>
                    p.lesson.course.id === e.course.id && !p.completed
                );
                return courseProgress.length > 0;
            })
            .slice(0, 3)
            .map(e => ({
                courseId: e.course.id,
                courseTitle: e.course.title,
                action: 'Продолжить обучение'
            }))
    };
}

function generatePlaceholderResume(user, certificates) {
    const skills = [...new Set(certificates.map(c => c.course.category))];
    const totalHours = certificates.reduce((sum, c) => {
        const hours = parseInt(c.course.duration) || 1;
        return sum + hours;
    }, 0);

    return {
        name: user.name,
        summary: `Прошёл ${certificates.length} курсов общей продолжительностью ${totalHours} часов`,
        skills,
        certificates: certificates.map(c => ({
            title: c.course.title,
            category: c.course.category,
            issuedAt: c.issuedAt,
            code: c.uniqueCode
        })),
        strengths: skills.length > 0
            ? `Основные компетенции: ${skills.join(', ')}`
            : 'Пройдите курсы для формирования профиля компетенций'
    };
}

module.exports = router;
