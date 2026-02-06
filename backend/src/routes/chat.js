// backend/src/routes/chat.js
const express = require('express');
const prisma = require('../config/database');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// ==================== AI CHAT SESSIONS (Prisma) ====================

/**
 * GET /api/chat/sessions
 * Get all AI chat sessions for current user
 */
router.get('/sessions', auth, async (req, res, next) => {
    try {
        const sessions = await prisma.chatSession.findMany({
            where: { 
                userId: req.user.id 
            },
            orderBy: { updatedAt: 'desc' },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        res.json({
            success: true,
            data: sessions.map(session => ({
                ...session,
                messages: session.messages.map(msg => ({
                    ...msg,
                    isAI: msg.senderId === 'ai_assistant'
                }))
            }))
        });
    } catch (error) {
        console.error('Error getting AI sessions:', error);
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
        console.error('Error creating AI session:', error);
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
        console.error('Error getting AI session:', error);
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

        // Save user message
        const userMessage = await prisma.chatMessage.create({
            data: {
                sessionId,
                content,
                type,
                senderId: String(req.user.id),
                userId: req.user.id,
                metadata: metadata || {}
            }
        });

        // Update session timestamp
        await prisma.chatSession.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() }
        });

        // Generate AI response (placeholder)
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
                userMessage: {
                    ...userMessage,
                    isAI: false
                },
                aiMessage: {
                    ...aiMessage,
                    isAI: true
                }
            }
        });
    } catch (error) {
        console.error('Error sending AI message:', error);
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
        console.error('Error deleting AI session:', error);
        next(error);
    }
});

// ==================== USER-TO-USER CHATS (Prisma) ====================

/**
 * GET /api/chat/user
 * Get all user chats (not AI)
 */
router.get('/user', auth, async (req, res, next) => {
    try {
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

        // Format response
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
            unreadCount: 0 // TODO: implement real unread count
        }));

        res.json({
            success: true,
            data: formattedChats
        });
    } catch (error) {
        console.error('Error getting user chats:', error);
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

        // Validate participantIds if provided
        if (participantIds && participantIds.length > 0) {
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

        // Create chat
        const chat = await prisma.chat.create({
            data: {
                name: name || 'Новый чат',
                isGroup,
                participants: {
                    create: [
                        // Add creator
                        { userId: req.user.id },
                        // Add other participants if any
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
        console.error('Error creating chat:', error);
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

        // Check if it's an AI chat (starts with 'ai-')
        if (id.startsWith('ai-')) {
            const sessionId = id.replace('ai-', '');
            const session = await prisma.chatSession.findUnique({
                where: { 
                    id: sessionId,
                    userId: req.user.id
                },
                include: {
                    messages: {
                        orderBy: { createdAt: 'asc' },
                        take: 50
                    }
                }
            });

            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: 'AI сессия не найдена'
                });
            }

            return res.json({
                success: true,
                data: {
                    id: `ai-${session.id}`,
                    name: session.title,
                    isGroup: false,
                    isAI: true,
                    participants: [
                        {
                            id: 'ai_assistant',
                            name: 'AI-Наставник',
                            avatar: null,
                            role: 'AI'
                        }
                    ],
                    messages: session.messages.map(msg => ({
                        ...msg,
                        isAI: msg.senderId === 'ai_assistant'
                    })),
                    createdAt: session.createdAt,
                    updatedAt: session.updatedAt
                }
            });
        }

        // Regular user chat
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

        // Check if user is a participant
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
                isAI: false,
                participants: chat.participants.map(p => p.user),
                createdAt: chat.createdAt,
                updatedAt: chat.updatedAt
            }
        });
    } catch (error) {
        console.error('Error getting chat:', error);
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

        // Check if it's an AI chat
        if (id.startsWith('ai-')) {
            const sessionId = id.replace('ai-', '');
            
            const session = await prisma.chatSession.findUnique({
                where: { 
                    id: sessionId,
                    userId: req.user.id
                }
            });

            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: 'AI сессия не найдена'
                });
            }

            const messages = await prisma.chatMessage.findMany({
                where: { sessionId },
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

            const formattedMessages = messages.map(message => ({
                id: message.id,
                content: message.content,
                type: message.type,
                senderId: message.senderId,
                userId: message.userId,
                senderName: message.user?.name || 'Вы',
                senderAvatar: message.user?.avatar,
                isAI: message.senderId === 'ai_assistant',
                createdAt: message.createdAt,
                metadata: message.metadata
            }));

            return res.json({
                success: true,
                data: formattedMessages
            });
        }

        // Regular user chat
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

        // Get messages
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

        // Format response
        const formattedMessages = messages.map(message => ({
            id: message.id,
            content: message.content,
            type: message.type,
            senderId: message.senderId,
            userId: message.userId,
            senderName: message.user?.name || 'Пользователь',
            senderAvatar: message.user?.avatar,
            createdAt: message.createdAt,
            metadata: message.metadata,
            isAI: false
        }));

        res.json({
            success: true,
            data: formattedMessages
        });
    } catch (error) {
        console.error('Error getting chat messages:', error);
        next(error);
    }
});


/**
 * POST /api/chat/:id/messages
 * Send message to chat (both AI and user chats)
 */
router.post('/:id/messages', auth, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { content, type = 'text', metadata } = req.body;

        console.log('Sending message to chat:', { id, content, userId: req.user.id });

        // Check if it's an AI chat
        if (id.startsWith('ai-')) {
            const sessionId = id.replace('ai-', '');
            
            const session = await prisma.chatSession.findUnique({
                where: { 
                    id: sessionId,
                    userId: req.user.id
                }
            });

            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: 'AI сессия не найдена'
                });
            }

            // 1. Save user message
            const userMessage = await prisma.chatMessage.create({
                data: {
                    sessionId,
                    content,
                    type,
                    senderId: String(req.user.id),
                    userId: req.user.id,
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

            console.log('User message saved:', userMessage.id);

            // 2. Update session timestamp
            await prisma.chatSession.update({
                where: { id: sessionId },
                data: { updatedAt: new Date() }
            });

            // 3. Generate AI response (placeholder)
            const aiResponse = await generateAIResponse(content, {
                userId: req.user.id,
                sessionId,
                context: session.context
            });

            console.log('AI response generated:', aiResponse.content);

            // 4. Save AI response
            const aiMessage = await prisma.chatMessage.create({
                data: {
                    sessionId,
                    content: aiResponse.content,
                    type: aiResponse.type,
                    senderId: 'ai_assistant',
                    metadata: aiResponse.metadata || {}
                }
            });

            console.log('AI message saved:', aiMessage.id);

            // 5. Format response
            const formattedUserMessage = {
                id: userMessage.id,
                content: userMessage.content,
                type: userMessage.type,
                senderId: userMessage.senderId,
                userId: userMessage.userId,
                senderName: userMessage.user?.name || 'Вы',
                senderAvatar: userMessage.user?.avatar,
                isAI: false,
                createdAt: userMessage.createdAt,
                metadata: userMessage.metadata
            };

            const formattedAiMessage = {
                id: aiMessage.id,
                content: aiMessage.content,
                type: aiMessage.type,
                senderId: aiMessage.senderId,
                senderName: 'AI-Наставник',
                isAI: true,
                createdAt: aiMessage.createdAt,
                metadata: aiMessage.metadata
            };

            // 6. Socket.io broadcast
            const io = req.app.get('io');
            if (io) {
                io.to(`ai-session_${sessionId}`).emit('new-ai-message', formattedAiMessage);
            }

            return res.json({
                success: true,
                data: {
                    userMessage: formattedUserMessage,
                    aiMessage: formattedAiMessage
                }
            });
        }

        // ========== REGULAR USER CHAT ==========
        console.log('Processing regular user chat');
        
        // 1. Verify chat access
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

        // 2. Get sender info
        const sender = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { name: true, avatar: true }
        });

        // 3. Save message
        const message = await prisma.chatMessage.create({
            data: {
                chatId: id,
                content,
                type,
                senderId: String(req.user.id),
                userId: req.user.id,
                metadata: metadata || {}
            }
        });

        console.log('Message saved:', message.id);

        // 4. Update chat timestamp
        await prisma.chat.update({
            where: { id },
            data: { updatedAt: new Date() }
        });

        // 5. Format response
        const formattedMessage = {
            id: message.id,
            content: message.content,
            type: message.type,
            senderId: message.senderId,
            userId: message.userId,
            senderName: sender?.name || 'Пользователь',
            senderAvatar: sender?.avatar,
            isAI: false,
            createdAt: message.createdAt,
            metadata: message.metadata,
            chatId: id
        };

        // 6. Socket.io broadcast
        const io = req.app.get('io');
        if (io) {
            io.to(`chat_${id}`).emit('new-chat-message', formattedMessage);
        }

        res.json({
            success: true,
            data: formattedMessage
        });

    } catch (error) {
        console.error('Error sending message:', error);
        console.error('Error stack:', error.stack);
        next(error);
    }
});

// ... остальные функции (generateAIResponse, generateQuizQuestions и т.д.) остаются без изменений ...
// Оставьте их как есть в конце файла


/**
 * DELETE /api/chat/messages/:id
 * Delete message
 */
router.delete('/messages/:id', auth, async (req, res, next) => {
    try {
        const { id } = req.params;

        const message = await ChatMessage.findOne({
            _id: id,
            userId: req.user.id
        });

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Сообщение не найдено или нет прав для удаления'
            });
        }

        // Soft delete - помечаем как удаленное
        message.deletedAt = new Date();
        message.deletedBy = req.user.id;
        await message.save();

        res.json({
            success: true,
            message: 'Сообщение удалено'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/chat/messages/:id/read
 * Mark message as read
 */
router.post('/messages/:id/read', auth, async (req, res, next) => {
    try {
        const { id } = req.params;

        const message = await ChatMessage.findById(id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Сообщение не найдено'
            });
        }

        // Обновляем статус сообщения
        message.status = 'read';
        await message.save();

        // Если это сообщение в чате, обновляем счетчик непрочитанных
        if (message.chatId) {
            await Chat.updateOne(
                { _id: message.chatId },
                { $set: { [`unreadCounts.${req.user.id}`]: 0 } }
            );
        }

        res.json({
            success: true,
            message: 'Сообщение помечено как прочитанное'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/chat/users
 * Get users for chat creation
 */
router.get('/users', auth, async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            where: {
                id: {
                    not: req.user.id
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
 * GET /api/chat/chat/:id
 * Get chat details (alternate endpoint)
 */
router.get('/chat/:id', auth, async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if it's an AI chat
        if (id.startsWith('ai-')) {
            const sessionId = id.replace('ai-', '');
            const session = await prisma.chatSession.findUnique({
                where: { 
                    id: sessionId,
                    userId: req.user.id
                },
                include: {
                    messages: {
                        orderBy: { createdAt: 'asc' },
                        take: 50
                    }
                }
            });

            if (!session) {
                return res.status(404).json({
                    success: false,
                    message: 'AI сессия не найдена'
                });
            }

            return res.json({
                success: true,
                data: {
                    id: `ai-${session.id}`,
                    name: session.title,
                    isGroup: false,
                    isAI: true,
                    participants: [
                        {
                            id: 'ai_assistant',
                            name: 'AI-Наставник',
                            avatar: null,
                            role: 'AI'
                        }
                    ],
                    messages: session.messages.map(msg => ({
                        ...msg,
                        isAI: msg.senderId === 'ai_assistant'
                    })),
                    createdAt: session.createdAt,
                    updatedAt: session.updatedAt
                }
            });
        }

        // Regular user chat
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

        // Check if user is a participant
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
                isAI: false,
                participants: chat.participants.map(p => p.user),
                createdAt: chat.createdAt,
                updatedAt: chat.updatedAt
            }
        });
    } catch (error) {
        console.error('Error getting chat:', error);
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

        // Получаем контент курса для контекста
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

        // Генерируем вопросы теста (placeholder)
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

        // TODO: Интеграция с DeepSeek API
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