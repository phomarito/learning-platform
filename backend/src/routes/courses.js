const express = require('express');
const prisma = require('../config/database');
const auth = require('../middleware/auth');
const { isTeacher, isAdmin } = require('../middleware/roleCheck');

const router = express.Router();

/**
 * GET /api/courses
 * Get all courses (with optional filters)
 */
router.get('/', auth, async (req, res, next) => {
    try {
        const { category, search, enrolled, page = 1, limit = 20 } = req.query;

        const where = {
            isPublished: true
        };

        // Admin and Teacher can see unpublished courses
        if (req.user.role === 'ADMIN' || req.user.role === 'TEACHER') {
            delete where.isPublished;
        }

        // Teacher sees only their courses
        if (req.user.role === 'TEACHER') {
            where.teacherId = req.user.id;
        }

        if (category) {
            where.category = category;
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Filter by enrolled courses for current user
        if (enrolled === 'true') {
            where.enrollments = {
                some: { userId: req.user.id }
            };
        }

        const [courses, total] = await Promise.all([
            prisma.course.findMany({
                where,
                include: {
                    teacher: {
                        select: { id: true, name: true }
                    },
                    _count: {
                        select: { lessons: true, enrollments: true }
                    },
                    enrollments: {
                        where: { userId: req.user.id },
                        select: { id: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: parseInt(limit)
            }),
            prisma.course.count({ where })
        ]);

        // Calculate progress for each course
        const coursesWithProgress = await Promise.all(
            courses.map(async (course) => {
                const totalLessons = course._count.lessons;
                let progress = 0;

                if (totalLessons > 0 && course.enrollments.length > 0) {
                    const completedLessons = await prisma.progress.count({
                        where: {
                            userId: req.user.id,
                            completed: true,
                            lesson: { courseId: course.id }
                        }
                    });
                    progress = Math.round((completedLessons / totalLessons) * 100);
                }

                return {
                    ...course,
                    isEnrolled: course.enrollments.length > 0,
                    progress,
                    enrollments: undefined // Remove enrollments array from response
                };
            })
        );

        res.json({
            success: true,
            data: coursesWithProgress,
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
 * GET /api/courses/:id
 * Get course by ID with lessons
 */
router.get('/:id', auth, async (req, res, next) => {
    try {
        const courseId = parseInt(req.params.id);

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                teacher: {
                    select: { id: true, name: true, avatar: true }
                },
                lessons: {
                    orderBy: { order: 'asc' },
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        order: true
                    }
                },
                enrollments: {
                    where: { userId: req.user.id },
                    select: { id: true }
                },
                _count: {
                    select: { enrollments: true }
                }
            }
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Курс не найден'
            });
        }

        // Get progress for each lesson
        const lessonsWithProgress = await Promise.all(
            course.lessons.map(async (lesson) => {
                const progress = await prisma.progress.findUnique({
                    where: {
                        userId_lessonId: {
                            userId: req.user.id,
                            lessonId: lesson.id
                        }
                    }
                });
                return {
                    ...lesson,
                    completed: progress?.completed || false
                };
            })
        );

        const completedCount = lessonsWithProgress.filter(l => l.completed).length;
        const totalProgress = course.lessons.length > 0
            ? Math.round((completedCount / course.lessons.length) * 100)
            : 0;

        res.json({
            success: true,
            data: {
                ...course,
                lessons: lessonsWithProgress,
                isEnrolled: course.enrollments.length > 0,
                progress: totalProgress,
                enrollments: undefined
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/courses
 * Create new course (Teacher/Admin)
 */
router.post('/', auth, isTeacher, async (req, res, next) => {
    try {
        const { title, description, category, duration, icon, coverImage } = req.body;

        if (!title || !category) {
            return res.status(400).json({
                success: false,
                message: 'Название и категория обязательны'
            });
        }

        const course = await prisma.course.create({
            data: {
                title,
                description,
                category,
                duration: duration || '30 мин',
                icon,
                coverImage,
                teacherId: req.user.id
            },
            include: {
                teacher: {
                    select: { id: true, name: true }
                }
            }
        });

        res.status(201).json({
            success: true,
            data: course,
            message: 'Курс успешно создан'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/courses/:id
 * Update course (Teacher/Admin)
 */
router.put('/:id', auth, isTeacher, async (req, res, next) => {
    try {
        const courseId = parseInt(req.params.id);
        const { title, description, category, duration, icon, coverImage, isPublished } = req.body;

        const existingCourse = await prisma.course.findUnique({
            where: { id: courseId }
        });

        if (!existingCourse) {
            return res.status(404).json({
                success: false,
                message: 'Курс не найден'
            });
        }

        // Check ownership (unless admin)
        if (req.user.role !== 'ADMIN' && existingCourse.teacherId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Нет прав на редактирование этого курса'
            });
        }

        const course = await prisma.course.update({
            where: { id: courseId },
            data: {
                title,
                description,
                category,
                duration,
                icon,
                coverImage,
                isPublished
            },
            include: {
                teacher: {
                    select: { id: true, name: true }
                }
            }
        });

        res.json({
            success: true,
            data: course,
            message: 'Курс обновлён'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/courses/:id
 * Delete course (Teacher/Admin)
 */
router.delete('/:id', auth, isTeacher, async (req, res, next) => {
    try {
        const courseId = parseInt(req.params.id);

        const existingCourse = await prisma.course.findUnique({
            where: { id: courseId }
        });

        if (!existingCourse) {
            return res.status(404).json({
                success: false,
                message: 'Курс не найден'
            });
        }

        // Check ownership (unless admin)
        if (req.user.role !== 'ADMIN' && existingCourse.teacherId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Нет прав на удаление этого курса'
            });
        }

        await prisma.course.delete({
            where: { id: courseId }
        });

        res.json({
            success: true,
            message: 'Курс удалён'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/courses/:id/enroll
 * Enroll current user in course
 */
router.post('/:id/enroll', auth, async (req, res, next) => {
    try {
        const courseId = parseInt(req.params.id);

        const course = await prisma.course.findUnique({
            where: { id: courseId }
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Курс не найден'
            });
        }

        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: req.user.id,
                    courseId
                }
            }
        });

        if (existingEnrollment) {
            return res.status(409).json({
                success: false,
                message: 'Вы уже записаны на этот курс'
            });
        }

        const enrollment = await prisma.enrollment.create({
            data: {
                userId: req.user.id,
                courseId
            }
        });

        res.status(201).json({
            success: true,
            data: enrollment,
            message: 'Вы записаны на курс'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/courses/:id/students
 * Assign student to course (Teacher/Admin)
 */
router.post('/:id/students', auth, isTeacher, async (req, res, next) => {
    try {
        const courseId = parseInt(req.params.id);
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'ID студента обязателен'
            });
        }

        const course = await prisma.course.findUnique({
            where: { id: courseId }
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Курс не найден'
            });
        }

        // Check ownership (unless admin)
        if (req.user.role !== 'ADMIN' && course.teacherId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Нет прав на управление этим курсом'
            });
        }

        const enrollment = await prisma.enrollment.upsert({
            where: {
                userId_courseId: {
                    userId: parseInt(userId),
                    courseId
                }
            },
            create: {
                userId: parseInt(userId),
                courseId
            },
            update: {}
        });

        res.status(201).json({
            success: true,
            data: enrollment,
            message: 'Студент записан на курс'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
