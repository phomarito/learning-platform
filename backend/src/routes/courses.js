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
        if (req.userRole === 'ADMIN' || req.userRole === 'TEACHER') { // <- ИСПРАВЛЕНО
            delete where.isPublished;
        }

        // Teacher sees only their courses
        if (req.userRole === 'TEACHER') { // <- ИСПРАВЛЕНО
            where.teacherId = req.userId; // <- ИСПРАВЛЕНО
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
                some: { userId: req.userId } // <- ИСПРАВЛЕНО
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
                        where: { userId: req.userId }, // <- ИСПРАВЛЕНО
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
                            userId: req.userId, // <- ИСПРАВЛЕНО
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
                    where: { userId: req.userId }, // <- ИСПРАВЛЕНО
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
                            userId: req.userId, // <- ИСПРАВЛЕНО
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
                teacherId: req.userId // <- ИСПРАВЛЕНО
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
        if (req.userRole !== 'ADMIN' && existingCourse.teacherId !== req.userId) { // <- ИСПРАВЛЕНО
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
        if (req.userRole !== 'ADMIN' && existingCourse.teacherId !== req.userId) { // <- ИСПРАВЛЕНО
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
                    userId: req.userId, // <- ИСПРАВЛЕНО
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
                userId: req.userId, // <- ИСПРАВЛЕНО
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

// --- Раздел для управления студентами курса ---
// Получить всех студентов курса
router.get('/:id/students', auth, async (req, res) => {
    try {
        const courseId = parseInt(req.params.id);
        const currentUserId = req.userId; // <- ИСПРАВЛЕНО
        const currentUserRole = req.userRole; // <- ИСПРАВЛЕНО

        const course = await prisma.course.findUnique({
            where: { id: courseId }
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Курс не найден'
            });
        }

        // Проверяем права
        if (currentUserRole !== 'ADMIN' && course.teacherId !== currentUserId) { // <- ИСПРАВЛЕНО
            return res.status(403).json({
                success: false,
                message: 'Нет прав на просмотр студентов этого курса'
            });
        }

        // Получаем студентов курса с их прогрессом
        const enrollments = await prisma.enrollment.findMany({
            where: { 
                courseId,
                user: {
                    role: 'STUDENT'
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        avatar: true,
                        createdAt: true
                    }
                }
            }
        });

        // Добавляем информацию о прогрессе
        const studentsWithProgress = await Promise.all(
            enrollments.map(async (enrollment) => {
                const progress = await prisma.progress.findMany({
                    where: {
                        userId: enrollment.userId,
                        lesson: {
                            courseId: courseId
                        }
                    },
                    select: {
                        completed: true,
                        timeSpent: true,
                        quizScore: true
                    }
                });

                const totalLessons = await prisma.lesson.count({
                    where: { courseId }
                });

                const completedLessons = progress.filter(p => p.completed).length;
                const totalTimeSpent = progress.reduce((sum, p) => sum + p.timeSpent, 0);

                return {
                    ...enrollment.user,
                    enrolledAt: enrollment.enrolledAt,
                    progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
                    completedLessons,
                    totalLessons,
                    totalTimeSpent,
                    avgQuizScore: progress.length > 0 
                        ? Math.round(progress.reduce((sum, p) => sum + (p.quizScore || 0), 0) / progress.length)
                        : 0
                };
            })
        );

        res.json({
            success: true,
            data: studentsWithProgress
        });

    } catch (error) {
        console.error('Error fetching course students:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при получении студентов курса'
        });
    }
});

// Добавить студента на курс
router.post('/:id/students', auth, async (req, res) => {
    try {
        const courseId = parseInt(req.params.id);
        const { userId } = req.body;
        const currentUserId = req.userId; // <- ИСПРАВЛЕНО
        const currentUserRole = req.userRole; // <- ИСПРАВЛЕНО

        const course = await prisma.course.findUnique({
            where: { id: courseId }
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Курс не найден'
            });
        }

        // Проверяем права
        if (currentUserRole !== 'ADMIN' && course.teacherId !== currentUserId) { // <- ИСПРАВЛЕНО
            return res.status(403).json({
                success: false,
                message: 'Нет прав на добавление студентов в этот курс'
            });
        }

        // Проверяем существование пользователя
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Пользователь не найден'
            });
        }

        // Проверяем, что добавляем только студентов
        if (user.role !== 'STUDENT') {
            return res.status(400).json({
                success: false,
                message: 'Можно добавлять только студентов'
            });
        }

        // Проверяем, не записан ли уже
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId
                }
            }
        });

        if (existingEnrollment) {
            return res.status(400).json({
                success: false,
                message: 'Студент уже записан на этот курс'
            });
        }

        // Создаем запись о зачислении
        const enrollment = await prisma.enrollment.create({
            data: {
                userId,
                courseId,
                enrolledAt: new Date()
            }
        });

        res.json({
            success: true,
            message: 'Студент успешно добавлен на курс',
            data: enrollment
        });

    } catch (error) {
        console.error('Error adding student to course:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при добавлении студента на курс'
        });
    }
});

// Удалить студента из курса
router.delete('/:id/students/:studentId', auth, async (req, res) => {
    try {
        const courseId = parseInt(req.params.id);
        const studentId = parseInt(req.params.studentId);
        const currentUserId = req.userId; // <- ИСПРАВЛЕНО
        const currentUserRole = req.userRole; // <- ИСПРАВЛЕНО

        const course = await prisma.course.findUnique({
            where: { id: courseId }
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Курс не найден'
            });
        }

        // Проверяем права
        if (currentUserRole !== 'ADMIN' && course.teacherId !== currentUserId) { // <- ИСПРАВЛЕНО
            return res.status(403).json({
                success: false,
                message: 'Нет прав на удаление студентов из этого курса'
            });
        }

        // Проверяем существование зачисления
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: studentId,
                    courseId
                }
            }
        });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Студент не записан на этот курс'
            });
        }

        // Удаляем зачисление
        await prisma.enrollment.delete({
            where: {
                userId_courseId: {
                    userId: studentId,
                    courseId
                }
            }
        });

        // Удаляем прогресс студента по этому курсу
        await prisma.progress.deleteMany({
            where: {
                userId: studentId,
                lesson: {
                    courseId
                }
            }
        });

        res.json({
            success: true,
            message: 'Студент успешно удален из курса'
        });

    } catch (error) {
        console.error('Error removing student from course:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при удалении студента из курса'
        });
    }
});

/**
 * GET /api/courses/teacher/:teacherId
 * Get courses by teacher (for admin dashboard)
 */
router.get('/teacher/:teacherId', auth, async (req, res, next) => {
    try {
        const teacherId = parseInt(req.params.teacherId);
        const { published = true } = req.query;

        const where = { teacherId };
        
        if (published === 'true') {
            where.isPublished = true;
        } else if (published === 'false') {
            where.isPublished = false;
        }

        const courses = await prisma.course.findMany({
            where,
            include: {
                teacher: {
                    select: { id: true, name: true, email: true }
                },
                _count: {
                    select: { lessons: true, enrollments: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: courses
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/courses/:id/students/:userId
 * Remove student from course (Teacher/Admin) - ВАЖНО: этот маршрут дублирует вышестоящий. Можно удалить один из них.
 */
router.delete('/:id/students/:userId', auth, isTeacher, async (req, res, next) => {
    try {
        const courseId = parseInt(req.params.id);
        const userId = parseInt(req.params.userId);

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
        if (req.userRole !== 'ADMIN' && course.teacherId !== req.userId) { // <- ИСПРАВЛЕНО
            return res.status(403).json({
                success: false,
                message: 'Нет прав на управление этим курсом'
            });
        }

        // Don't allow removing the teacher from their own course
        if (userId === course.teacherId) {
            return res.status(400).json({
                success: false,
                message: 'Нельзя удалить преподавателя из его собственного курса'
            });
        }

        await prisma.enrollment.delete({
            where: {
                userId_courseId: {
                    userId,
                    courseId
                }
            }
        });

        // Delete all progress records for this user in this course
        await prisma.progress.deleteMany({
            where: {
                userId,
                lesson: { courseId }
            }
        });

        res.json({
            success: true,
            message: 'Студент удалён из курса'
        });
    } catch (error) {
        next(error);
    }
});

// --- Массовая запись и поиск пользователей ---
// Записать пользователей на курс (массовая запись)
router.post('/:id/enrollments/batch', auth, async (req, res) => {
    try {
        const courseId = parseInt(req.params.id);
        const { userIds } = req.body;
        const currentUserId = req.userId; // <- ИСПРАВЛЕНО
        const currentUserRole = req.userRole; // <- ИСПРАВЛЕНО

        // Проверяем существование курса
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { teacher: true }
        });

        if (!course) {
            return res.status(404).json({ error: 'Курс не найден' });
        }

        // Проверка прав
        if (currentUserRole === 'ADMIN') {
            // Админ может записывать всех
        } else if (currentUserRole === 'TEACHER') {
            // Преподаватель может записывать только на свои курсы
            if (course.teacherId !== currentUserId) { // <- ИСПРАВЛЕНО
                return res.status(403).json({ error: 'Вы не можете записывать пользователей на этот курс' });
            }
            
            // Проверяем, что записываем только студентов
            const usersToEnroll = await prisma.user.findMany({
                where: { id: { in: userIds } }
            });
            
            const nonStudents = usersToEnroll.filter(user => user.role !== 'STUDENT');
            if (nonStudents.length > 0) {
                return res.status(403).json({ 
                    error: 'Преподаватель может записывать только студентов',
                    nonStudents: nonStudents.map(u => ({ id: u.id, name: u.name }))
                });
            }
        } else {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }

        // Проверяем, что пользователи существуют
        const existingUsers = await prisma.user.findMany({
            where: { id: { in: userIds } }
        });

        if (existingUsers.length !== userIds.length) {
            const foundIds = existingUsers.map(u => u.id);
            const missingIds = userIds.filter(id => !foundIds.includes(id));
            return res.status(404).json({ 
                error: 'Некоторые пользователи не найдены',
                missingIds 
            });
        }

        // Проверяем, не записаны ли уже пользователи
        const existingEnrollments = await prisma.enrollment.findMany({
            where: {
                courseId,
                userId: { in: userIds }
            }
        });

        const existingUserIds = existingEnrollments.map(e => e.userId);
        const newUserIds = userIds.filter(id => !existingUserIds.includes(id));

        if (newUserIds.length === 0) {
            return res.status(400).json({ 
                error: 'Все выбранные пользователи уже записаны на курс',
                existingUserIds 
            });
        }

        // Создаем записи о зачислении
        const enrollmentsData = newUserIds.map(userId => ({
            userId,
            courseId,
            enrolledAt: new Date()
        }));

        await prisma.enrollment.createMany({
            data: enrollmentsData,
            skipDuplicates: true
        });

        // Получаем обновленную информацию о курсе
        const updatedCourse = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                _count: {
                    select: { enrollments: true }
                }
            }
        });

        res.json({
            success: true,
            message: 'Пользователи успешно записаны на курс',
            data: {
                enrolledCount: newUserIds.length,
                alreadyEnrolledCount: existingUserIds.length,
                course: updatedCourse
            }
        });

    } catch (error) {
        console.error('Error batch enrolling users:', error);
        res.status(500).json({ 
            success: false,
            error: 'Ошибка при записи пользователей' 
        });
    }
});

// Получить пользователей для записи
router.get('/:id/enrollable-users', auth, async (req, res) => {
    try {
        const courseId = parseInt(req.params.id);
        const currentUserId = req.userId; // <- ИСПРАВЛЕНО
        const currentUserRole = req.userRole; // <- ИСПРАВЛЕНО
        const { role } = req.query;

        const course = await prisma.course.findUnique({
            where: { id: courseId }
        });

        if (!course) {
            return res.status(404).json({ 
                success: false,
                error: 'Курс не найден' 
            });
        }

        // Определяем, каких пользователей можно показывать
        let whereCondition = {};
        
        if (currentUserRole === 'ADMIN') {
            // Админ видит всех, кроме себя
            whereCondition.id = { not: currentUserId }; // <- ИСПРАВЛЕНО
            if (role && role !== 'all') {
                whereCondition.role = role.toUpperCase();
            }
        } else if (currentUserRole === 'TEACHER') {
            // Преподаватель видит только студентов
            whereCondition.role = 'STUDENT';
        } else {
            return res.status(403).json({ 
                success: false,
                error: 'Доступ запрещен' 
            });
        }

        // Получаем пользователей
        const users = await prisma.user.findMany({
            where: whereCondition,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                _count: {
                    select: {
                        enrollments: {
                            where: { courseId }
                        }
                    }
                }
            }
        });

        // Фильтруем уже записанных пользователей
        const enrollableUsers = users.filter(user => user._count.enrollments === 0)
            .map(user => {
                const { _count, ...userData } = user;
                return userData;
            });

        res.json({
            success: true,
            data: enrollableUsers,
            count: enrollableUsers.length
        });

    } catch (error) {
        console.error('Error fetching enrollable users:', error);
        res.status(500).json({ 
            success: false,
            error: 'Ошибка при получении пользователей' 
        });
    }
});

/**
 * GET /api/courses/:id/analytics
 * Get course analytics (Teacher/Admin)
 */
router.get('/:id/analytics', auth, isTeacher, async (req, res, next) => {
    try {
        const courseId = parseInt(req.params.id);

        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                teacher: {
                    select: { id: true, name: true }
                }
            }
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Курс не найден'
            });
        }

        // Check ownership (unless admin)
        if (req.userRole !== 'ADMIN' && course.teacherId !== req.userId) { // <- ИСПРАВЛЕНО
            return res.status(403).json({
                success: false,
                message: 'Нет прав на просмотр аналитики этого курса'
            });
        }

        const [
            totalStudents,
            activeStudents,
            totalLessons,
            completedLessonsCount,
            recentEnrollments,
            progressDistribution
        ] = await Promise.all([
            // Total students enrolled
            prisma.enrollment.count({ where: { courseId } }),
            
            // Active students (completed at least one lesson in last 7 days)
            prisma.enrollment.count({
                where: {
                    courseId,
                    user: {
                        progress: {
                            some: {
                                lesson: { courseId },
                                completedAt: {
                                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                                }
                            }
                        }
                    }
                }
            }),
            
            // Total lessons
            prisma.lesson.count({ where: { courseId } }),
            
            // Total completed lessons across all students
            prisma.progress.count({
                where: {
                    completed: true,
                    lesson: { courseId }
                }
            }),
            
            // Recent enrollments (last 30 days)
            prisma.enrollment.findMany({
                where: {
                    courseId,
                    enrolledAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                },
                include: {
                    user: {
                        select: { id: true, name: true, avatar: true }
                    }
                },
                orderBy: { enrolledAt: 'desc' },
                take: 5
            }),
            
            // Progress distribution
            prisma.$queryRaw`
                SELECT 
                    CASE 
                        WHEN progress_percentage = 0 THEN '0%'
                        WHEN progress_percentage <= 25 THEN '1-25%'
                        WHEN progress_percentage <= 50 THEN '26-50%'
                        WHEN progress_percentage <= 75 THEN '51-75%'
                        WHEN progress_percentage < 100 THEN '76-99%'
                        ELSE '100%'
                    END as range,
                    COUNT(*) as students
                FROM (
                    SELECT 
                        e.userId,
                        COALESCE(ROUND(COUNT(CASE WHEN p.completed THEN 1 END) * 100.0 / NULLIF(l.total_lessons, 0)), 0) as progress_percentage
                    FROM enrollments e
                    LEFT JOIN (
                        SELECT userId, lessonId, completed
                        FROM progress
                        WHERE lessonId IN (SELECT id FROM lessons WHERE courseId = ${courseId})
                    ) p ON e.userId = p.userId
                    LEFT JOIN (
                        SELECT courseId, COUNT(*) as total_lessons
                        FROM lessons
                        WHERE courseId = ${courseId}
                        GROUP BY courseId
                    ) l ON e.courseId = l.courseId
                    WHERE e.courseId = ${courseId}
                    GROUP BY e.userId, l.total_lessons
                ) progress_data
                GROUP BY range
                ORDER BY range
            `
        ]);

        const avgProgress = totalStudents > 0 && totalLessons > 0
            ? Math.round((completedLessonsCount / (totalStudents * totalLessons)) * 100)
            : 0;

        res.json({
            success: true,
            data: {
                course,
                stats: {
                    totalStudents,
                    activeStudents,
                    totalLessons,
                    completedLessonsCount,
                    avgProgress
                },
                recentEnrollments,
                progressDistribution
            }
        });
    } catch (error) {
        console.error('Analytics error:', error);
        next(error);
    }
});

module.exports = router;