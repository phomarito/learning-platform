const express = require('express');
const prisma = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/progress
 * Get current user's progress across all courses
 */
router.get('/', auth, async (req, res, next) => {
    try {
        const enrollments = await prisma.enrollment.findMany({
            where: { userId: req.user.id },
            include: {
                course: {
                    include: {
                        lessons: {
                            select: { id: true }
                        },
                        _count: {
                            select: { lessons: true }
                        }
                    }
                }
            }
        });

        const progressData = await Promise.all(
            enrollments.map(async (enrollment) => {
                const completedLessons = await prisma.progress.count({
                    where: {
                        userId: req.user.id,
                        completed: true,
                        lesson: { courseId: enrollment.courseId }
                    }
                });

                const totalTimeSpent = await prisma.progress.aggregate({
                    where: {
                        userId: req.user.id,
                        lesson: { courseId: enrollment.courseId }
                    },
                    _sum: { timeSpent: true }
                });

                const totalLessons = enrollment.course._count.lessons;
                const progress = totalLessons > 0
                    ? Math.round((completedLessons / totalLessons) * 100)
                    : 0;

                return {
                    courseId: enrollment.courseId,
                    courseTitle: enrollment.course.title,
                    enrolledAt: enrollment.enrolledAt,
                    progress,
                    completedLessons,
                    totalLessons,
                    timeSpent: totalTimeSpent._sum.timeSpent || 0,
                    isCompleted: progress === 100
                };
            })
        );

        // Calculate overall stats
        const stats = {
            totalCourses: progressData.length,
            completedCourses: progressData.filter(p => p.isCompleted).length,
            inProgressCourses: progressData.filter(p => p.progress > 0 && p.progress < 100).length,
            totalTimeSpent: progressData.reduce((sum, p) => sum + p.timeSpent, 0),
            averageProgress: progressData.length > 0
                ? Math.round(progressData.reduce((sum, p) => sum + p.progress, 0) / progressData.length)
                : 0
        };

        res.json({
            success: true,
            data: {
                courses: progressData,
                stats
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/progress/:lessonId
 * Update progress for a lesson
 */
router.put('/:lessonId', auth, async (req, res, next) => {
    try {
        const lessonId = parseInt(req.params.lessonId);
        const { completed, timeSpent, quizScore } = req.body;

        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { course: true }
        });

        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Урок не найден'
            });
        }

        // Check enrollment
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: req.user.id,
                    courseId: lesson.courseId
                }
            }
        });

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'Вы не записаны на этот курс'
            });
        }

        const progress = await prisma.progress.upsert({
            where: {
                userId_lessonId: {
                    userId: req.user.id,
                    lessonId
                }
            },
            create: {
                userId: req.user.id,
                lessonId,
                completed: completed || false,
                completedAt: completed ? new Date() : null,
                timeSpent: timeSpent || 0,
                quizScore
            },
            update: {
                completed: completed !== undefined ? completed : undefined,
                completedAt: completed ? new Date() : undefined,
                timeSpent: timeSpent !== undefined
                    ? { increment: timeSpent }
                    : undefined,
                quizScore: quizScore !== undefined ? quizScore : undefined
            }
        });

        // Check if course is complete
        const courseId = lesson.courseId;
        const totalLessons = await prisma.lesson.count({
            where: { courseId }
        });
        const completedLessons = await prisma.progress.count({
            where: {
                userId: req.user.id,
                completed: true,
                lesson: { courseId }
            }
        });

        let certificate = null;

        // Auto-generate certificate when course is complete
        if (totalLessons > 0 && completedLessons === totalLessons) {
            const existingCertificate = await prisma.certificate.findUnique({
                where: {
                    userId_courseId: {
                        userId: req.user.id,
                        courseId
                    }
                }
            });

            if (!existingCertificate) {
                certificate = await prisma.certificate.create({
                    data: {
                        userId: req.user.id,
                        courseId
                    }
                });
            } else {
                certificate = existingCertificate;
            }
        }

        res.json({
            success: true,
            data: {
                progress,
                courseProgress: {
                    completed: completedLessons,
                    total: totalLessons,
                    percentage: Math.round((completedLessons / totalLessons) * 100)
                },
                certificate
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/progress/portfolio
 * Get user's portfolio with certificates
 */
router.get('/portfolio', auth, async (req, res, next) => {
    try {
        const certificates = await prisma.certificate.findMany({
            where: { userId: req.user.id },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        duration: true,
                        teacher: {
                            select: { id: true, name: true }
                        }
                    }
                }
            },
            orderBy: { issuedAt: 'desc' }
        });

        // Get overall stats
        const stats = await prisma.progress.aggregate({
            where: { userId: req.user.id },
            _sum: { timeSpent: true },
            _count: { id: true }
        });

        const completedCourses = certificates.length;

        res.json({
            success: true,
            data: {
                certificates,
                stats: {
                    completedCourses,
                    totalLessonsCompleted: stats._count.id,
                    totalTimeSpent: stats._sum.timeSpent || 0
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
