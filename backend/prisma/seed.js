const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@lms.com' },
        update: {},
        create: {
            email: 'admin@lms.com',
            password: adminPassword,
            name: 'Администратор',
            role: 'ADMIN'
        }
    });
    console.log('✅ Admin user created:', admin.email);

    // Create teacher user
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    const teacher = await prisma.user.upsert({
        where: { email: 'teacher@lms.com' },
        update: {},
        create: {
            email: 'teacher@lms.com',
            password: teacherPassword,
            name: 'Иван Преподаватель',
            role: 'TEACHER'
        }
    });
    console.log('✅ Teacher user created:', teacher.email);

    // Create student user
    const studentPassword = await bcrypt.hash('student123', 10);
    const student = await prisma.user.upsert({
        where: { email: 'student@lms.com' },
        update: {},
        create: {
            email: 'student@lms.com',
            password: studentPassword,
            name: 'Алексей Студент',
            role: 'STUDENT'
        }
    });
    console.log('✅ Student user created:', student.email);

    // Create sample courses
    const course1 = await prisma.course.upsert({
        where: { id: 1 },
        update: {},
        create: {
            title: 'Эффективное делегирование для менеджеров',
            description: 'Научитесь правильно распределять задачи и развивать команду',
            category: 'Менеджмент',
            duration: '2 часа',
            icon: 'users',
            isPublished: true,
            teacherId: teacher.id
        }
    });

    const course2 = await prisma.course.upsert({
        where: { id: 2 },
        update: {},
        create: {
            title: 'Основы продуктового мышления',
            description: 'Как создавать продукты, которые нужны пользователям',
            category: 'Продукт',
            duration: '3 часа',
            icon: 'lightbulb',
            isPublished: true,
            teacherId: teacher.id
        }
    });

    const course3 = await prisma.course.upsert({
        where: { id: 3 },
        update: {},
        create: {
            title: 'Эффективные коммуникации',
            description: 'Мастерство деловой переписки и переговоров',
            category: 'Soft Skills',
            duration: '1.5 часа',
            icon: 'message-circle',
            isPublished: true,
            teacherId: teacher.id
        }
    });

    console.log('✅ Sample courses created');

    // Create lessons for course 1
    const lessons = [
        { title: 'Введение в делегирование', type: 'VIDEO', order: 1, content: 'Обзор курса и основные понятия' },
        { title: 'Психология делегирования', type: 'TEXT', order: 2, content: '<h1>Психология делегирования</h1><p>Делегирование — это не просто механическая передача задач...</p>' },
        { title: 'Ошибки делегирования', type: 'VIDEO', order: 3, videoUrl: 'https://www.youtube.com/watch?v=example' },
        {
            title: 'Тест по модулю 1', type: 'QUIZ', order: 4, quizData: JSON.stringify({
                questions: [
                    {
                        id: 1,
                        text: 'Что является главной целью делегирования?',
                        options: [
                            'Избавиться от скучной работы',
                            'Освободить время для стратегических задач и развить сотрудников',
                            'Переложить ответственность на других'
                        ],
                        correctIndex: 1
                    }
                ]
            })
        }
    ];

    for (const lesson of lessons) {
        await prisma.lesson.upsert({
            where: {
                id: lessons.indexOf(lesson) + 1
            },
            update: {},
            create: {
                ...lesson,
                courseId: course1.id
            }
        });
    }
    console.log('✅ Sample lessons created');

    // Enroll student in course1
    await prisma.enrollment.upsert({
        where: {
            userId_courseId: {
                userId: student.id,
                courseId: course1.id
            }
        },
        update: {},
        create: {
            userId: student.id,
            courseId: course1.id
        }
    });
    console.log('✅ Student enrolled in course');

    console.log('');
    console.log('🎉 Database seeding completed!');
    console.log('');
    console.log('📧 Test accounts:');
    console.log('   Admin:   admin@lms.com / admin123');
    console.log('   Teacher: teacher@lms.com / teacher123');
    console.log('   Student: student@lms.com / student123');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
