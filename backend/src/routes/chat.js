// backend/routes/chat.js
const express = require('express');
const prisma = require('../config/database');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// ==================== AI CHAT SESSIONS ====================

/**
 * GET /api/chat/sessions
 * Get all AI chat sessions for current user
 */
router.get('/sessions', auth, async (req, res, next) => {
    try {
        const sessions = await prisma.chatSession.findMany({
            where: { userId: req.user.id },
            orderBy: { updatedAt: 'desc' },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    take: 1
                }
            }
        });

        res.json({
            success: true,
            data: sessions
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/chat/sessions
 * Create new AI chat session
 */
router.post('/sessions', auth, async (req, res, next) => {
    try {
        const { title, context } = req.body;
        
        const session = await prisma.chatSession.create({
            data: {
                userId: req.user.id,
                title: title || 'Новый чат',
                context: context || 'general'
            }
        });

        res.status(201).json({
            success: true,
            data: session
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/chat/sessions/:sessionId
 * Get AI chat session with messages
 */
router.get('/sessions/:sessionId', auth, async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const session = await prisma.chatSession.findUnique({
            where: { 
                id: sessionId,
                userId: req.user.id // Security check
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    skip: parseInt(offset),
                    take: parseInt(limit)
                }
            }
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Сессия не найдена'
            });
        }

        res.json({
            success: true,
            data: session
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/chat/sessions/:sessionId/messages
 * Send message to AI session
 */
router.post('/sessions/:sessionId/messages', auth, async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { content, type = 'text', metadata } = req.body;

        // Validate session ownership
        const session = await prisma.chatSession.findUnique({
            where: { 
                id: sessionId,
                userId: req.user.id
            }
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Сессия не найдена'
            });
        }

        // Save user message (senderId как строка)
        const userMessage = await prisma.chatMessage.create({
            data: {
                sessionId,
                content,
                type,
                senderId: String(req.user.id), // Конвертируем в строку
                metadata: metadata || {},
                userId: req.user.id // Связь с User
            }
        });

        // Update session timestamp
        await prisma.chatSession.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() }
        });

        // Generate AI response
        const aiResponse = await generateAIResponse(content, {
            userId: req.user.id,
            sessionId,
            context: session.context
        });

        // Save AI response
        const aiMessage = await prisma.chatMessage.create({
            data: {
                sessionId,
                content: aiResponse.content,
                type: aiResponse.type,
                senderId: 'ai_assistant',
                metadata: aiResponse.metadata || {}
            }
        });

        // Socket.io broadcast if available
        const io = req.app.get('io');
        if (io) {
            io.to(`session_${sessionId}`).emit('new-message', aiMessage);
        }

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
 * DELETE /api/chat/sessions/:sessionId
 * Delete AI chat session
 */
router.delete('/sessions/:sessionId', auth, async (req, res, next) => {
    try {
        const { sessionId } = req.params;

        // Delete session and all related messages (cascade)
        await prisma.chatSession.delete({
            where: { 
                id: sessionId,
                userId: req.user.id
            }
        });

        res.json({
            success: true,
            message: 'Сессия удалена'
        });
    } catch (error) {
        next(error);
    }
});

// ==================== USER-TO-USER CHATS ====================

/**
 * GET /api/chat/user
 * Get all user chats (not AI)
 */
router.get('/user', auth, async (req, res, next) => {
    try {
        // Находим чаты пользователя
        const userChats = await prisma.chat.findMany({
            where: {
                participants: {
                    some: {
                        userId: req.user.id
                    }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                                role: true
                            }
                        }
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Форматируем ответ
        const formattedChats = userChats.map(chat => ({
            id: chat.id,
            name: chat.name,
            isGroup: chat.isGroup,
            lastMessage: chat.messages[0]?.content || null,
            updatedAt: chat.updatedAt,
            participants: chat.participants.map(p => ({
                id: p.user.id,
                name: p.user.name,
                avatar: p.user.avatar,
                role: p.user.role
            })),
            unreadCount: Math.floor(Math.random() * 5) // TODO: считать реальные непрочитанные
        }));

        res.json({
            success: true,
            data: formattedChats
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/chat
 * Create new chat with users
 */
router.post('/', auth, async (req, res, next) => {
    try {
        const { name, isGroup = false, participantIds } = req.body;

        // Проверяем participantIds если переданы
        if (participantIds && participantIds.length > 0) {
            // Проверяем существование пользователей
            const users = await prisma.user.findMany({
                where: {
                    id: {
                        in: participantIds
                    }
                }
            });
            
            if (users.length !== participantIds.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Некоторые пользователи не найдены'
                });
            }
        }

        // Создаем чат
        const chat = await prisma.chat.create({
            data: {
                name: name || 'Новый чат',
                isGroup,
                participants: {
                    create: [
                        // Добавляем создателя
                        { userId: req.user.id },
                        // Добавляем других участников если есть
                        ...(participantIds || []).map(id => ({
                            userId: id
                        }))
                    ]
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true
                            }
                        }
                    }
                }
            }
        });

        res.status(201).json({
            success: true,
            data: {
                id: chat.id,
                name: chat.name,
                isGroup: chat.isGroup,
                participants: chat.participants.map(p => p.user)
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/chat/:id
 * Get chat details
 */
router.get('/:id', auth, async (req, res, next) => {
    try {
        const { id } = req.params;

        const chat = await prisma.chat.findUnique({
            where: { id },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                                role: true
                            }
                        }
                    }
                }
            }
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Чат не найден'
            });
        }

        // Проверяем, что пользователь участник
        const isParticipant = chat.participants.some(p => p.userId === req.user.id);
        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Нет доступа к чату'
            });
        }

        res.json({
            success: true,
            data: {
                id: chat.id,
                name: chat.name,
                isGroup: chat.isGroup,
                participants: chat.participants.map(p => p.user),
                createdAt: chat.createdAt,
                updatedAt: chat.updatedAt
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/chat/:id/messages
 * Get chat messages
 */
router.get('/:id/messages', auth, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        // Проверяем доступ
        const chat = await prisma.chat.findUnique({
            where: { id },
            include: {
                participants: {
                    select: { userId: true }
                }
            }
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Чат не найден'
            });
        }

        const isParticipant = chat.participants.some(p => p.userId === req.user.id);
        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Нет доступа к чату'
            });
        }

        // Получаем сообщения
        const messages = await prisma.chatMessage.findMany({
            where: { chatId: id },
            orderBy: { createdAt: 'asc' },
            skip: parseInt(offset),
            take: parseInt(limit),
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            }
        });

        // Форматируем ответ
        const formattedMessages = messages.map(message => ({
            id: message.id,
            content: message.content,
            type: message.type,
            senderId: message.senderId,
            userId: message.userId,
            senderName: message.user?.name || 'Пользователь',
            senderAvatar: message.user?.avatar,
            createdAt: message.createdAt,
            metadata: message.metadata
        }));

        res.json({
            success: true,
            data: formattedMessages
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/chat/:id/messages
 * Send message to user chat
 */
router.post('/:id/messages', auth, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { content, type = 'text', metadata } = req.body;

        // Проверяем доступ
        const chat = await prisma.chat.findUnique({
            where: { id },
            include: {
                participants: {
                    select: { userId: true }
                }
            }
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Чат не найден'
            });
        }

        const isParticipant = chat.participants.some(p => p.userId === req.user.id);
        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Нет доступа к чату'
            });
        }

        // Сохраняем сообщение
        const message = await prisma.chatMessage.create({
            data: {
                chatId: id,
                content,
                type,
                senderId: String(req.user.id), // Конвертируем в строку
                userId: req.user.id, // Связь с User
                metadata: metadata || {}
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true
                    }
                }
            }
        });

        // Обновляем время чата
        await prisma.chat.update({
            where: { id },
            data: { updatedAt: new Date() }
        });

        // Socket.io broadcast
        const io = req.app.get('io');
        if (io) {
            io.to(id).emit('new-message', {
                ...message,
                chatId: id
            });
        }

        res.json({
            success: true,
            data: {
                id: message.id,
                content: message.content,
                type: message.type,
                senderId: message.senderId,
                userId: message.userId,
                senderName: message.user?.name || 'Пользователь',
                senderAvatar: message.user?.avatar,
                createdAt: message.createdAt,
                metadata: message.metadata
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/chat/messages/:id
 * Delete message
 */
router.delete('/messages/:id', auth, async (req, res, next) => {
    try {
        const { id } = req.params;

        const message = await prisma.chatMessage.findUnique({
            where: { id }
        });

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Сообщение не найдено'
            });
        }

        // Только автор может удалить
        if (message.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Нельзя удалить чужое сообщение'
            });
        }

        await prisma.chatMessage.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Сообщение удалено'
        });
    } catch (error) {
        next(error);
    }
});

// ==================== AI FEATURES ====================

/**
 * POST /api/chat/generate-quiz
 * Generate quiz questions based on course content
 */
router.post('/generate-quiz', auth, async (req, res, next) => {
    try {
        const { courseId, topic, difficulty = 'medium', count = 5 } = req.body;

        // Get course content for context
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                lessons: {
                    where: topic ? { title: { contains: topic } } : {},
                    take: 5
                }
            }
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Курс не найден'
            });
        }

        // Generate quiz questions (placeholder for DeepSeek)
        const questions = await generateQuizQuestions({
            courseTitle: course.title,
            lessons: course.lessons,
            difficulty,
            count
        });

        res.json({
            success: true,
            data: {
                courseId,
                topic,
                questions
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/chat/simulate-conversation
 * Start a simulated conversation (e.g., sales call)
 */
router.post('/simulate-conversation', auth, async (req, res, next) => {
    try {
        const { scenario, role } = req.body;

        // TODO: DeepSeek API integration
        const simulation = await generateConversationSimulation(scenario, role);

        res.json({
            success: true,
            data: simulation
        });
    } catch (error) {
        next(error);
    }
});

// ==================== HELPER FUNCTIONS ====================

async function generateAIResponse(message, context) {
    // Placeholder - integrate with DeepSeek API
    const responses = {
        help: "Я ваш AI-наставник. Могу помочь с:\n1. Объяснением материалов курса\n2. Генерацией тестов\n3. Симуляцией диалогов (продажи, переговоры)\n4. Рекомендациями по обучению",
        quiz: "Создам для вас тест по теме. Укажите:\n- ID курса\n- Тему\n- Количество вопросов",
        simulate: "Давайте потренируем навыки! Выберите сценарий:\n1. Продажа продукта\n2. Обработка возражений\n3. Деловые переговоры"
    };

    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('помощь') || lowerMessage.includes('help')) {
        return {
            content: responses.help,
            type: 'text',
            metadata: { type: 'help' }
        };
    }

    if (lowerMessage.includes('тест') || lowerMessage.includes('quiz')) {
        return {
            content: responses.quiz,
            type: 'text',
            metadata: { type: 'quiz_suggestion' }
        };
    }

    if (lowerMessage.includes('симуляция') || lowerMessage.includes('тренировка')) {
        return {
            content: responses.simulate,
            type: 'text',
            metadata: { type: 'simulation_suggestion' }
        };
    }

    return {
        content: `Я понял ваш вопрос: "${message}". Сейчас я учусь и скоро смогу давать более точные ответы!`,
        type: 'text',
        metadata: { type: 'placeholder' }
    };
}

async function generateQuizQuestions(params) {
    // Placeholder quiz generation
    return Array.from({ length: params.count }, (_, i) => ({
        id: uuidv4(),
        question: `Вопрос ${i + 1} по теме "${params.courseTitle}"`,
        options: ['Вариант A', 'Вариант B', 'Вариант C', 'Вариант D'],
        correctAnswer: Math.floor(Math.random() * 4),
        explanation: 'Пояснение к ответу...',
        difficulty: params.difficulty
    }));
}

async function generateConversationSimulation(scenario, role) {
    const scenarios = {
        sales: {
            role: 'клиент',
            firstMessage: 'Здравствуйте, расскажите о вашем продукте.',
            objectives: ['Презентовать продукт', 'Выявить потребности', 'Закрыть сделку']
        },
        negotiation: {
            role: 'партнер',
            firstMessage: 'Ваши условия нас не совсем устраивают.',
            objectives: ['Найти компромисс', 'Сохранить отношения', 'Достичь соглашения']
        }
    };

    const selectedScenario = scenarios[scenario] || scenarios.sales;

    return {
        scenario,
        userRole: role || 'продавец',
        botRole: selectedScenario.role,
        objectives: selectedScenario.objectives,
        firstMessage: selectedScenario.firstMessage,
        tips: [
            'Слушайте внимательно',
            'Задавайте уточняющие вопросы',
            'Предлагайте решения'
        ]
    };
}

module.exports = router;