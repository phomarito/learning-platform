const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // ==================== CREATE USERS ====================
    
    // Admin user (already exists)
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@lms.com' },
        update: {},
        create: {
            email: 'admin@lms.com',
            password: adminPassword,
            name: 'Администратор',
            role: 'ADMIN',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
        }
    });
    console.log('✅ Admin user created:', admin.email);

    // ==================== TEACHERS ====================
    const teachers = [
        {
            email: 'teacher@lms.com',
            password: 'teacher123',
            name: 'Иван Петров',
            role: 'TEACHER',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher1'
        },
        {
            email: 'anna.koval@lms.com',
            password: 'anna123',
            name: 'Анна Коваль',
            role: 'TEACHER',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher2'
        },
        {
            email: 'sergey.sidorov@lms.com',
            password: 'sergey123',
            name: 'Сергей Сидоров',
            role: 'TEACHER',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher3'
        }
    ];

    const createdTeachers = [];
    for (const teacher of teachers) {
        const hashedPassword = await bcrypt.hash(teacher.password, 10);
        const createdTeacher = await prisma.user.upsert({
            where: { email: teacher.email },
            update: {},
            create: {
                email: teacher.email,
                password: hashedPassword,
                name: teacher.name,
                role: teacher.role,
                avatar: teacher.avatar
            }
        });
        createdTeachers.push(createdTeacher);
        console.log(`✅ Teacher created: ${teacher.email}`);
    }

    // ==================== STUDENTS ====================
    const students = [
        {
            email: 'student@lms.com',
            password: 'student123',
            name: 'Алексей Смирнов',
            role: 'STUDENT',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student1'
        },
        {
            email: 'maria.ivanova@lms.com',
            password: 'maria123',
            name: 'Мария Иванова',
            role: 'STUDENT',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student2'
        },
        {
            email: 'dmitry.kuznetsov@lms.com',
            password: 'dmitry123',
            name: 'Дмитрий Кузнецов',
            role: 'STUDENT',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student3'
        }
    ];

    const createdStudents = [];
    for (const student of students) {
        const hashedPassword = await bcrypt.hash(student.password, 10);
        const createdStudent = await prisma.user.upsert({
            where: { email: student.email },
            update: {},
            create: {
                email: student.email,
                password: hashedPassword,
                name: student.name,
                role: student.role,
                avatar: student.avatar
            }
        });
        createdStudents.push(createdStudent);
        console.log(`✅ Student created: ${student.email}`);
    }

    // ==================== COURSES (Programming & Oil Industry) ====================
    const courses = [
        // Programming courses
        {
            title: 'JavaScript для начинающих',
            description: 'Освойте основы JavaScript с нуля. Научитесь создавать интерактивные веб-сайты.',
            category: 'Программирование',
            duration: '12 часов',
            icon: 'code',
            coverImage: 'https://avatars.mds.yandex.net/i?id=0690ebceffb93e5d9c695a1d1c5a3b1c_l-5160619-images-thumbs&n=13',
            isPublished: true,
            teacherId: createdTeachers[0].id
        },
        {
            title: 'React.js - Современная разработка',
            description: 'Полный курс по React.js с хуками, контекстом и Redux Toolkit.',
            category: 'Программирование',
            duration: '20 часов',
            icon: 'react',
            coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w-800',
            isPublished: true,
            teacherId: createdTeachers[0].id
        },
        {
            title: 'Python для анализа данных',
            description: 'Используйте Python, Pandas и NumPy для анализа данных и визуализации.',
            category: 'Программирование',
            duration: '15 часов',
            icon: 'pie-chart',
            coverImage: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w-800',
            isPublished: true,
            teacherId: createdTeachers[1].id
        },
        // Oil industry courses
        {
            title: 'Основы нефтегазовой геологии',
            description: 'Введение в геологию нефти и газа, методы поиска и разведки месторождений.',
            category: 'Нефтяная отрасль',
            duration: '10 часов',
            icon: 'layers',
            coverImage: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w-800',
            isPublished: true,
            teacherId: createdTeachers[2].id
        },
        {
            title: 'Бурение нефтяных скважин',
            description: 'Технологии бурения, оборудование и безопасность при работе на скважинах.',
            category: 'Нефтяная отрасль',
            duration: '14 часов',
            icon: 'drill',
            coverImage: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w-800',
            isPublished: true,
            teacherId: createdTeachers[2].id
        },
        {
            title: 'Переработка нефти и газа',
            description: 'Технологические процессы переработки углеводородов на НПЗ.',
            category: 'Нефтяная отрасль',
            duration: '12 часов',
            icon: 'droplets',
            coverImage: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w-800',
            isPublished: true,
            teacherId: createdTeachers[2].id
        },
        {
            title: 'Node.js и Express.js',
            description: 'Создание серверных приложений на Node.js с фреймворком Express.js.',
            category: 'Программирование',
            duration: '18 часов',
            icon: 'server',
            coverImage: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w-800',
            isPublished: true,
            teacherId: createdTeachers[1].id
        },
        {
            title: 'Базы данных SQL',
            description: 'Проектирование баз данных, сложные запросы и оптимизация.',
            category: 'Программирование',
            duration: '16 часов',
            icon: 'database',
            coverImage: 'https://wedatau.org/wp-content/uploads/2021/12/sql_graphic.jpg',
            isPublished: true,
            teacherId: createdTeachers[0].id
        },
        {
            title: 'Транспорт нефти и газа',
            description: 'Системы трубопроводного транспорта, хранение и логистика.',
            category: 'Нефтяная отрасль',
            duration: '8 часов',
            icon: 'pipe',
            coverImage: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800',
            isPublished: true,
            teacherId: createdTeachers[2].id
        },
        {
            title: 'Экология в нефтяной отрасли',
            description: 'Экологические стандарты, очистные сооружения и защита окружающей среды.',
            category: 'Нефтяная отрасль',
            duration: '9 часов',
            icon: 'leaf',
            coverImage: 'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=800',
            isPublished: true,
            teacherId: createdTeachers[2].id
        }
    ];

    const createdCourses = [];
    for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        const createdCourse = await prisma.course.upsert({
            where: { id: i + 1 },
            update: {},
            create: course
        });
        createdCourses.push(createdCourse);
        console.log(`✅ Course created: ${course.title}`);
    }

    // ==================== LESSONS ====================
    // Create lessons for first programming course
    const lessons = [
        // JavaScript course lessons
        {
            title: 'Введение в JavaScript',
            type: 'VIDEO',
            content: '<h1>Введение в JavaScript</h1><p>JavaScript - язык программирования для создания интерактивных веб-страниц.</p>',
            videoUrl: 'https://www.youtube.com/watch?v=example_js_intro',
            order: 1,
            courseId: createdCourses[0].id
        },
        {
            title: 'Переменные и типы данных',
            type: 'TEXT',
            content: '<h1>Переменные и типы данных</h1><p>Изучим let, const, var и основные типы данных в JS.</p>',
            order: 2,
            courseId: createdCourses[0].id
        },
        {
            title: 'Функции в JavaScript',
            type: 'VIDEO',
            videoUrl: 'https://www.youtube.com/watch?v=example_js_functions',
            order: 3,
            courseId: createdCourses[0].id
        },
        {
            title: 'Тест по основам JavaScript',
            type: 'QUIZ',
            quizData: {
                questions: [
                    {
                        id: 1,
                        text: 'Как объявить константу в JavaScript?',
                        options: [
                            'var x = 5;',
                            'let x = 5;',
                            'const x = 5;',
                            'constant x = 5;'
                        ],
                        correctIndex: 2
                    },
                    {
                        id: 2,
                        text: 'Какой тип данных не существует в JavaScript?',
                        options: [
                            'string',
                            'number',
                            'character',
                            'boolean'
                        ],
                        correctIndex: 2
                    }
                ]
            },
            order: 4,
            courseId: createdCourses[0].id
        },
        // Oil geology course lessons
        {
            title: 'Введение в нефтегазовую геологию',
            type: 'VIDEO',
            content: '<h1>Введение в нефтегазовую геологию</h1><p>Основные понятия и история развития отрасли.</p>',
            videoUrl: 'https://www.youtube.com/watch?v=example_oil_intro',
            order: 1,
            courseId: createdCourses[3].id
        },
        {
            title: 'Происхождение нефти и газа',
            type: 'TEXT',
            content: '<h1>Происхождение нефти и газа</h1><p>Органическая теория происхождения углеводородов.</p>',
            order: 2,
            courseId: createdCourses[3].id
        },
        {
            title: 'Методы поиска месторождений',
            type: 'VIDEO',
            videoUrl: 'https://www.youtube.com/watch?v=example_oil_search',
            order: 3,
            courseId: createdCourses[3].id
        },
        {
            title: 'Тест по нефтегазовой геологии',
            type: 'QUIZ',
            quizData: {
                questions: [
                    {
                        id: 1,
                        text: 'Как называется порода-коллектор?',
                        options: [
                            'Глинистая порода',
                            'Песчаник или известняк',
                            'Базальт',
                            'Гранит'
                        ],
                        correctIndex: 1
                    },
                    {
                        id: 2,
                        text: 'Что такое антиклиналь?',
                        options: [
                            'Разлом в земной коре',
                            'Складка горных пород выпуклостью вверх',
                            'Вулканическое образование',
                            'Морское течение'
                        ],
                        correctIndex: 1
                    }
                ]
            },
            order: 4,
            courseId: createdCourses[3].id
        }
    ];

    for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        await prisma.lesson.upsert({
            where: { id: i + 1 },
            update: {},
            create: lesson
        });
    }
    console.log('✅ Lessons created');

    // ==================== ENROLLMENTS ====================
    // Enroll students in courses
    const enrollments = [
        { userId: createdStudents[0].id, courseId: createdCourses[0].id },
        { userId: createdStudents[0].id, courseId: createdCourses[1].id },
        { userId: createdStudents[0].id, courseId: createdCourses[3].id },
        { userId: createdStudents[1].id, courseId: createdCourses[0].id },
        { userId: createdStudents[1].id, courseId: createdCourses[2].id },
        { userId: createdStudents[1].id, courseId: createdCourses[4].id },
        { userId: createdStudents[2].id, courseId: createdCourses[1].id },
        { userId: createdStudents[2].id, courseId: createdCourses[3].id },
        { userId: createdStudents[2].id, courseId: createdCourses[5].id }
    ];

    for (const enrollment of enrollments) {
        await prisma.enrollment.upsert({
            where: {
                userId_courseId: {
                    userId: enrollment.userId,
                    courseId: enrollment.courseId
                }
            },
            update: {},
            create: enrollment
        });
    }
    console.log('✅ Enrollments created');

    // ==================== PROGRESS ====================
    // Create progress for some lessons
    const progressData = [
        { userId: createdStudents[0].id, lessonId: 1, completed: true, completedAt: new Date(), timeSpent: 1800 },
        { userId: createdStudents[0].id, lessonId: 2, completed: true, completedAt: new Date(), timeSpent: 2400 },
        { userId: createdStudents[1].id, lessonId: 1, completed: true, completedAt: new Date(), timeSpent: 2000 },
        { userId: createdStudents[1].id, lessonId: 5, completed: true, completedAt: new Date(), timeSpent: 3000 },
        { userId: createdStudents[2].id, lessonId: 5, completed: true, completedAt: new Date(), timeSpent: 2500 }
    ];

    for (const progress of progressData) {
        await prisma.progress.upsert({
            where: {
                userId_lessonId: {
                    userId: progress.userId,
                    lessonId: progress.lessonId
                }
            },
            update: {},
            create: progress
        });
    }
    console.log('✅ Progress records created');

    // ==================== CERTIFICATES ====================
    // Create certificates for completed courses
    const certificates = [
        {
            userId: createdStudents[0].id,
            courseId: createdCourses[0].id,
            aiSummary: 'Отличное понимание основ JavaScript. Показал высокие результаты в практических заданиях.'
        },
        {
            userId: createdStudents[1].id,
            courseId: createdCourses[3].id,
            aiSummary: 'Глубокие знания в области нефтегазовой геологии. Успешно применял теорию на практике.'
        }
    ];

    for (const certificate of certificates) {
        await prisma.certificate.create({
            data: certificate
        });
    }
    console.log('✅ Certificates created');

    // ==================== CHAT SESSIONS ====================
    const chatSessions = [
        {
            id: 'session-001',
            title: 'Вопросы по JavaScript',
            context: 'course',
            userId: createdStudents[0].id,
            messages: {
                create: [
                    {
                        content: 'Как лучше всего изучать асинхронный код в JavaScript?',
                        type: 'text',
                        senderId: createdStudents[0].id.toString(),
                        userId: createdStudents[0].id
                    }
                ]
            }
        },
        {
            id: 'session-002',
            title: 'Обсуждение нефтегазовой геологии',
            context: 'course',
            userId: createdStudents[1].id,
            messages: {
                create: [
                    {
                        content: 'Какие методы поиска месторождений наиболее эффективны сегодня?',
                        type: 'text',
                        senderId: createdStudents[1].id.toString(),
                        userId: createdStudents[1].id
                    }
                ]
            }
        }
    ];

    for (const session of chatSessions) {
        await prisma.chatSession.create({
            data: session
        });
    }
    console.log('✅ Chat sessions created');

    console.log('');
    console.log('🎉 Database seeding completed!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   👤 Users: ${teachers.length + students.length + 1} total`);
    console.log(`   📚 Courses: ${createdCourses.length} courses`);
    console.log(`   📖 Lessons: ${lessons.length} lessons`);
    console.log(`   🎓 Enrollments: ${enrollments.length} enrollments`);
    console.log('');
    console.log('📧 Test accounts:');
    console.log('   Admin:    admin@lms.com / admin123');
    console.log('');
    console.log('   Teachers:');
    console.log('     teacher@lms.com / teacher123');
    console.log('     anna.koval@lms.com / anna123');
    console.log('     sergey.sidorov@lms.com / sergey123');
    console.log('');
    console.log('   Students:');
    console.log('     student@lms.com / student123');
    console.log('     maria.ivanova@lms.com / maria123');
    console.log('     dmitry.kuznetsov@lms.com / dmitry123');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });