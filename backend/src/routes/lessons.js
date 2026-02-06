const express = require('express');
const prisma = require('../config/database');
const auth = require('../middleware/auth');
const { isTeacher } = require('../middleware/roleCheck');

const router = express.Router();

/**
 * GET /api/lessons/:id
 * Get lesson by ID with full content
 */
router.get('/:id', auth, async (req, res, next) => {
    try {
        const lessonId = parseInt(req.params.id);

        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        teacherId: true,
                        lessons: {
                            orderBy: { order: 'asc' },
                            select: { id: true, title: true, order: true }
                        }
                    }
                }
            }
        });

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Урок не найден'
            });
        }

        // Check if user is enrolled or is teacher/admin
        const isTeacherOrAdmin = req.userRole === 'ADMIN' || // ИСПРАВЛЕНО: req.userRole
            (req.userRole === 'TEACHER' && lesson.course.teacherId === req.userId); // ИСПРАВЛЕНО: req.userId

        if (!isTeacherOrAdmin) {
            const enrollment = await prisma.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId: req.userId, // ИСПРАВЛЕНО: req.userId
                        courseId: lesson.course.id
                    }
                }
            });

            if (!enrollment) {
                return res.status(403).json({
                    success: false,
                    message: 'Вы не записаны на этот курс'
                });
            }
        }

        // Get user's progress for this lesson
        const progress = await prisma.progress.findUnique({
            where: {
                userId_lessonId: {
                    userId: req.userId, // ИСПРАВЛЕНО: req.userId
                    lessonId
                }
            }
        });

        // Find previous and next lessons
        const allLessons = lesson.course.lessons;
        const currentIndex = allLessons.findIndex(l => l.id === lessonId);
        const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
        const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

        res.json({
            success: true,
            data: {
                ...lesson,
                completed: progress?.completed || false,
                timeSpent: progress?.timeSpent || 0,
                quizScore: progress?.quizScore,
                navigation: {
                    prev: prevLesson,
                    next: nextLesson,
                    current: currentIndex + 1,
                    total: allLessons.length
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/lessons
 * Create new lesson (Teacher)
 */
router.post('/', auth, isTeacher, async (req, res, next) => {
    try {
        const { courseId, title, type, content, videoUrl, quizData, order } = req.body;

        if (!courseId || !title || !type) {
            return res.status(400).json({
                success: false,
                message: 'courseId, title и type обязательны'
            });
        }

        const course = await prisma.course.findUnique({
            where: { id: parseInt(courseId) }
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Курс не найден'
            });
        }

        // Check ownership (unless admin)
        if (req.userRole !== 'ADMIN' && course.teacherId !== req.userId) { // ИСПРАВЛЕНО: req.userRole, req.userId
            return res.status(403).json({
                success: false,
                message: 'Нет прав на добавление уроков в этот курс'
            });
        }

        // Get max order if not provided
        let lessonOrder = order;
        if (!lessonOrder) {
            const maxOrderLesson = await prisma.lesson.findFirst({
                where: { courseId: parseInt(courseId) },
                orderBy: { order: 'desc' }
            });
            lessonOrder = (maxOrderLesson?.order || 0) + 1;
        }

        const lesson = await prisma.lesson.create({
            data: {
                courseId: parseInt(courseId),
                title,
                type,
                content,
                videoUrl,
                quizData,
                order: lessonOrder
            }
        });

        res.status(201).json({
            success: true,
            data: lesson,
            message: 'Урок создан'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/lessons/:id
 * Update lesson (Teacher)
 */
router.put('/:id', auth, isTeacher, async (req, res, next) => {
    try {
        const lessonId = parseInt(req.params.id);
        const { title, type, content, videoUrl, quizData, order } = req.body;

        const existingLesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                course: { select: { teacherId: true } }
            }
        });

        if (!existingLesson) {
            return res.status(404).json({
                success: false,
                message: 'Урок не найден'
            });
        }

        // Check ownership (unless admin)
        if (req.userRole !== 'ADMIN' && existingLesson.course.teacherId !== req.userId) { // ИСПРАВЛЕНО: req.userRole, req.userId
            return res.status(403).json({
                success: false,
                message: 'Нет прав на редактирование этого урока'
            });
        }

        const lesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                title,
                type,
                content,
                videoUrl,
                quizData,
                order
            }
        });

        res.json({
            success: true,
            data: lesson,
            message: 'Урок обновлён'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/lessons/:id
 * Delete lesson (Teacher)
 */
router.delete('/:id', auth, isTeacher, async (req, res, next) => {
    try {
        const lessonId = parseInt(req.params.id);

        const existingLesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                course: { select: { teacherId: true } }
            }
        });

        if (!existingLesson) {
            return res.status(404).json({
                success: false,
                message: 'Урок не найден'
            });
        }

        // Check ownership (unless admin)
        if (req.userRole !== 'ADMIN' && existingLesson.course.teacherId !== req.userId) { // ИСПРАВЛЕНО: req.userRole, req.userId
            return res.status(403).json({
                success: false,
                message: 'Нет прав на удаление этого урока'
            });
        }

        await prisma.lesson.delete({
            where: { id: lessonId }
        });

        res.json({
            success: true,
            message: 'Урок удалён'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/lessons/:id/reorder
 * Reorder lessons in course (Teacher)
 */
router.put('/:id/reorder', auth, isTeacher, async (req, res, next) => {
    try {
        const { lessonOrders } = req.body; // Array of { id, order }

        if (!Array.isArray(lessonOrders)) {
            return res.status(400).json({
                success: false,
                message: 'lessonOrders должен быть массивом'
            });
        }

        await prisma.$transaction(
            lessonOrders.map(({ id, order }) =>
                prisma.lesson.update({
                    where: { id },
                    data: { order }
                })
            )
        );

        res.json({
            success: true,
            message: 'Порядок уроков обновлён'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;