const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const faker = require('@faker-js/faker').fakerRU;

const prisma = new PrismaClient();

// Настройка Faker для русских имен
faker.locale = 'ru';

async function main() {
    console.log('🌱 Starting full database seed...');

    // ==================== CREATE USERS ====================
    
    // Admin user
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

    // ==================== CREATE TEACHERS (20 учителей) ====================
    console.log('👨‍🏫 Creating teachers...');
    const teachers = [];
    for (let i = 1; i <= 20; i++) {
        const teacher = {
            email: `teacher${i}@lms.com`,
            password: await bcrypt.hash(`teacher${i}`, 10),
            name: `${faker.person.lastName()} ${faker.person.firstName()}`,
            role: 'TEACHER',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=teacher${i}`
        };
        
        const createdTeacher = await prisma.user.upsert({
            where: { email: teacher.email },
            update: {},
            create: teacher
        });
        teachers.push(createdTeacher);
    }
    console.log(`✅ ${teachers.length} teachers created`);

    // ==================== CREATE STUDENTS (100 студентов) ====================
    console.log('👨‍🎓 Creating students...');
    const students = [];
    for (let i = 1; i <= 100; i++) {
        const student = {
            email: `student${i}@lms.com`,
            password: await bcrypt.hash(`student${i}`, 10),
            name: `${faker.person.lastName()} ${faker.person.firstName()}`,
            role: 'STUDENT',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=student${i}`
        };
        
        const createdStudent = await prisma.user.upsert({
            where: { email: student.email },
            update: {},
            create: student
        });
        students.push(createdStudent);
    }
    console.log(`✅ ${students.length} students created`);

    // ==================== CREATE COURSES (50 курсов) ====================
    console.log('📚 Creating courses...');
    
    const categories = [
        'Программирование',
        'Нефтяная отрасль',
        'Дизайн',
        'Маркетинг',
        'Менеджмент',
        'Финансы',
        'Иностранные языки',
        'Soft Skills',
        'Data Science',
        'DevOps'
    ];

    const programmingCourses = [
        'JavaScript для начинающих',
        'React.js - современная разработка',
        'Python и анализ данных',
        'Node.js и Express.js',
        'Базы данных SQL',
        'Введение в алгоритмы',
        'Мобильная разработка на Flutter',
        'Тестирование ПО',
        'Архитектура веб-приложений',
        'Машинное обучение на Python'
    ];

    const oilIndustryCourses = [
        'Основы нефтегазовой геологии',
        'Бурение нефтяных скважин',
        'Переработка нефти и газа',
        'Транспорт нефти и газа',
        'Экология в нефтяной отрасли',
        'Нефтегазовое оборудование',
        'Геологоразведка',
        'Экономика нефтегазовой отрасли',
        'Безопасность на нефтяных объектах',
        'Цифровизация в нефтегазовой отрасли'
    ];

    const designCourses = [
        'UI/UX дизайн',
        'Figma для начинающих',
        'Веб-дизайн',
        'Графический дизайн',
        '3D моделирование',
        'Motion дизайн',
        'Дизайн интерфейсов',
        'Бренд-дизайн',
        'Типографика',
        'Цвет в дизайне'
    ];

    const courses = [
        ...programmingCourses.map((title, index) => ({
            title,
            description: faker.lorem.paragraphs(2),
            category: 'Программирование',
            duration: `${Math.floor(Math.random() * 10) + 5} часов`,
            icon: ['code', 'server', 'database', 'cpu', 'git-branch'][index % 5],
            coverImage: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800',
            isPublished: Math.random() > 0.2,
            teacherId: teachers[Math.floor(Math.random() * teachers.length)].id
        })),
        ...oilIndustryCourses.map((title, index) => ({
            title,
            description: faker.lorem.paragraphs(2),
            category: 'Нефтяная отрасль',
            duration: `${Math.floor(Math.random() * 8) + 4} часов`,
            icon: ['droplets', 'drill', 'factory', 'pipe', 'leaf'][index % 5],
            coverImage: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800',
            isPublished: Math.random() > 0.2,
            teacherId: teachers[Math.floor(Math.random() * teachers.length)].id
        })),
        ...designCourses.map((title, index) => ({
            title,
            description: faker.lorem.paragraphs(2),
            category: 'Дизайн',
            duration: `${Math.floor(Math.random() * 12) + 6} часов`,
            icon: ['palette', 'pen-tool', 'image', 'layers', 'eye'][index % 5],
            coverImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
            isPublished: Math.random() > 0.2,
            teacherId: teachers[Math.floor(Math.random() * teachers.length)].id
        })),
        // Добавляем еще 20 случайных курсов
        ...Array.from({ length: 20 }, (_, i) => ({
            title: `${faker.commerce.productName()} ${faker.company.buzzVerb()}`,
            description: faker.lorem.paragraphs(3),
            category: categories[Math.floor(Math.random() * categories.length)],
            duration: `${Math.floor(Math.random() * 15) + 3} часов`,
            icon: ['book-open', 'graduation-cap', 'brain', 'target', 'trending-up'][i % 5],
            coverImage: `https://images.unsplash.com/photo-${1500000 + i}?w=800`,
            isPublished: Math.random() > 0.1,
            teacherId: teachers[Math.floor(Math.random() * teachers.length)].id
        }))
    ];

    const createdCourses = [];
    for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        const createdCourse = await prisma.course.create({
            data: course
        });
        createdCourses.push(createdCourse);
    }
    console.log(`✅ ${createdCourses.length} courses created`);

    // ==================== CREATE LESSONS (10 уроков для каждого курса) ====================
    console.log('📖 Creating lessons...');
    const lessonTypes = ['VIDEO', 'TEXT', 'QUIZ'];
    
    for (const course of createdCourses) {
        const lessonsCount = Math.floor(Math.random() * 8) + 5; // 5-12 уроков на курс
        
        for (let i = 1; i <= lessonsCount; i++) {
            const lessonType = lessonTypes[Math.floor(Math.random() * lessonTypes.length)];
            
            const lessonData = {
                title: `${i}. ${faker.commerce.productAdjective()} ${faker.company.buzzNoun()}`,
                type: lessonType,
                order: i,
                content: lessonType === 'TEXT' ? faker.lorem.paragraphs(5) : null,
                videoUrl: lessonType === 'VIDEO' ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : null,
                courseId: course.id
            };

            if (lessonType === 'QUIZ') {
                lessonData.quizData = {
                    questions: Array.from({ length: Math.floor(Math.random() * 5) + 3 }, (_, qIndex) => ({
                        id: qIndex + 1,
                        text: faker.lorem.sentence() + '?',
                        options: Array.from({ length: 4 }, (_, oIndex) => ({
                            id: oIndex + 1,
                            text: faker.lorem.word(),
                            isCorrect: oIndex === 0
                        })),
                        correctIndex: 0
                    }))
                };
            }

            await prisma.lesson.create({
                data: lessonData
            });
        }
    }
    console.log('✅ Lessons created for all courses');

    // ==================== CREATE ENROLLMENTS (случайные зачисления) ====================
    console.log('🎓 Creating enrollments...');
    const enrollments = [];
    
    // Каждый студент записывается на 3-8 случайных курсов
    for (const student of students) {
        const coursesToEnroll = [...createdCourses]
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.floor(Math.random() * 6) + 3);
        
        for (const course of coursesToEnroll) {
            if (course.isPublished) {
                const enrollment = await prisma.enrollment.create({
                    data: {
                        userId: student.id,
                        courseId: course.id,
                        enrolledAt: faker.date.past({ years: 1 })
                    }
                });
                enrollments.push(enrollment);
            }
        }
    }
    console.log(`✅ ${enrollments.length} enrollments created`);

    // ==================== CREATE PROGRESS (прогресс по урокам) ====================
    console.log('📈 Creating progress records...');
    const progressRecords = [];
    
    for (const enrollment of enrollments) {
        const course = createdCourses.find(c => c.id === enrollment.courseId);
        const lessons = await prisma.lesson.findMany({
            where: { courseId: course.id },
            orderBy: { order: 'asc' }
        });
        
        // Студент завершает 30-80% уроков на каждом курсе
        const lessonsToComplete = Math.floor(lessons.length * (Math.random() * 0.5 + 0.3));
        
        for (let i = 0; i < lessonsToComplete; i++) {
            const completedAt = new Date(enrollment.enrolledAt.getTime() + 
                Math.random() * 30 * 24 * 60 * 60 * 1000); // + до 30 дней
            
            const progress = await prisma.progress.create({
                data: {
                    userId: enrollment.userId,
                    lessonId: lessons[i].id,
                    completed: true,
                    completedAt: completedAt,
                    timeSpent: Math.floor(Math.random() * 3600) + 600, // 10-60 минут
                    quizScore: lessons[i].type === 'QUIZ' ? Math.floor(Math.random() * 40) + 60 : null
                }
            });
            progressRecords.push(progress);
        }
    }
    console.log(`✅ ${progressRecords.length} progress records created`);

    // ==================== CREATE CERTIFICATES (сертификаты) ====================
    console.log ('🏆 Creating certificates...');
    const certificates = [];
    
    for (const enrollment of enrollments) {
        const course = createdCourses.find(c => c.id === enrollment.courseId);
        const totalLessons = await prisma.lesson.count({
            where: { courseId: course.id }
        });
        const completedLessons = await prisma.progress.count({
            where: {
                userId: enrollment.userId,
                lesson: { courseId: course.id },
                completed: true
            }
        });
        
        // Выдаем сертификат если завершено >70% уроков
        if (totalLessons > 0 && (completedLessons / totalLessons) > 0.7) {
            const certificate = await prisma.certificate.create({
                data: {
                    userId: enrollment.userId,
                    courseId: course.id,
                    issuedAt: new Date(),
                    aiSummary: faker.lorem.paragraph()
                }
            });
            certificates.push(certificate);
        }
    }
    console.log(`✅ ${certificates.length} certificates created`);

    // ==================== CREATE CHAT SESSIONS ====================
    console.log('💬 Creating chat sessions...');
    const chatSessions = [];
    
    // Создаем чат-сессии для 30% студентов
    const studentsForChats = students.slice(0, Math.floor(students.length * 0.3));
    
    for (const student of studentsForChats) {
        const session = await prisma.chatSession.create({
            data: {
                title: `Вопросы по курсу "${createdCourses[Math.floor(Math.random() * createdCourses.length)].title}"`,
                context: 'course',
                userId: student.id
            }
        });
        chatSessions.push(session);
    }
    console.log(`✅ ${chatSessions.length} chat sessions created`);

    // ==================== SUMMARY ====================
    console.log('');
    console.log('🎉 FULL DATABASE SEED COMPLETED!');
    console.log('='.repeat(50));
    console.log('📊 SUMMARY:');
    console.log(`   👤 Users: ${1 + teachers.length + students.length} total`);
    console.log(`      👑 Admin: 1`);
    console.log(`      👨‍🏫 Teachers: ${teachers.length}`);
    console.log(`      👨‍🎓 Students: ${students.length}`);
    console.log('');
    console.log(`   📚 Courses: ${createdCourses.length} courses`);
    console.log(`   📖 Lessons: ${createdCourses.length * 8} lessons (average)`);
    console.log(`   🎓 Enrollments: ${enrollments.length} enrollments`);
    console.log(`   📈 Progress records: ${progressRecords.length} records`);
    console.log(`   🏆 Certificates: ${certificates.length} certificates`);
    console.log(`   💬 Chat sessions: ${chatSessions.length} sessions`);
    console.log('');
    console.log('🔑 TEST ACCOUNTS:');
    console.log('   Admin:    admin@lms.com / admin123');
    console.log('');
    console.log('   Teachers (first 5):');
    for (let i = 0; i < Math.min(5, teachers.length); i++) {
        console.log(`     teacher${i + 1}@lms.com / teacher${i + 1}`);
    }
    console.log('');
    console.log('   Students (first 5):');
    for (let i = 0; i < Math.min(5, students.length); i++) {
        console.log(`     student${i + 1}@lms.com / student${i + 1}`);
    }
    console.log('');
    console.log('='.repeat(50));
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });