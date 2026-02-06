// frontend/src/pages/ChatPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import {
    Send, 
    ArrowLeft, 
    Users, 
    Bot, 
    User, 
    Paperclip,
    Mic,
    Smile,
    MoreVertical,
    Search,
    Phone,
    Video,
    Info,
    Trash2,
    Clock
} from 'lucide-react';

export default function ChatPage() {
    const { chatId } = useParams();
    const { user } = useAuth();
    const { socket, joinChat, joinSession, isConnected } = useSocket();
    const navigate = useNavigate();
    
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [isAIChat, setIsAIChat] = useState(false);
    
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (chatId) {
            loadChat();
        }
    }, [chatId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!socket || !isConnected || !chatId) return;

        // Определяем тип чата и подписываемся
        if (isAIChat) {
            joinSession(chatId.replace('ai-', ''));
        } else {
            joinChat(chatId);
        }

        // Слушаем новые сообщения
        const handleNewMessage = (message) => {
            console.log('New message received:', message);
            
            // Проверяем, что сообщение для текущего чата
            const isForCurrentChat = 
                (isAIChat && message.sessionId === chatId.replace('ai-', '')) ||
                (!isAIChat && message.chatId === chatId);
            
            if (!isForCurrentChat) return;

            // Проверяем, нет ли такого сообщения уже в списке
            const messageExists = messages.some(m => m.id === message.id);
            if (messageExists) return;

            // Добавляем сообщение
            setMessages(prev => [...prev, {
                ...message,
                isAI: message.senderId === 'ai_assistant',
                userId: message.userId || (message.senderId === 'ai_assistant' ? null : parseInt(message.senderId))
            }]);

            // Обновляем время последнего сообщения в чате
            if (chat) {
                setChat(prev => ({
                    ...prev,
                    lastMessage: message.content,
                    updatedAt: new Date().toISOString()
                }));
            }

            scrollToBottom();
        };

        // Слушаем события в зависимости от типа чата
        if (isAIChat) {
            socket.on('ai-session-message', handleNewMessage);
        } else {
            socket.on('chat-message', handleNewMessage);
        }

        // Очистка при размонтировании или изменении чата
        return () => {
            if (socket) {
                socket.off('ai-session-message', handleNewMessage);
                socket.off('chat-message', handleNewMessage);
            }
        };
    }, [socket, isConnected, chatId, isAIChat, messages.length]);

    const loadChat = async () => {
        try {
            setIsLoading(true);
            
            // Проверяем тип чата по chatId
            const isAI = chatId.startsWith('ai-');
            setIsAIChat(isAI);
            const realId = isAI ? chatId.replace('ai-', '') : chatId;
            
            if (isAI) {
                // Загружаем AI сессию
                const sessionResponse = await chatAPI.getSession(realId);
                const sessionData = sessionResponse.data.data;
                
                setChat({
                    id: `ai-${sessionData.id}`,
                    name: sessionData.title,
                    isGroup: false,
                    participants: [{ id: 'ai_assistant', name: 'AI-Наставник' }],
                    updatedAt: sessionData.updatedAt
                });
                
                // Загружаем сообщения
                const messagesResponse = await chatAPI.getSession(realId, { limit: 50 });
                const sessionMessages = messagesResponse.data.data.messages || [];
                
                setMessages(sessionMessages.map(msg => ({
                    ...msg,
                    isAI: msg.senderId === 'ai_assistant',
                    userId: msg.userId || (msg.senderId === 'ai_assistant' ? null : parseInt(msg.senderId))
                })));
                
                setParticipants([{ id: 'ai_assistant', name: 'AI-Наставник' }]);
                
            } else {
                // Загружаем пользовательский чат
                const chatResponse = await chatAPI.getChat(realId);
                const chatData = chatResponse.data.data;
                setChat(chatData);
                
                // Загружаем сообщения
                const messagesResponse = await chatAPI.getMessages(realId);
                setMessages(messagesResponse.data.data);
                
                // Загружаем участников
                setParticipants(chatData.participants || []);
            }
            
        } catch (error) {
            console.error('Error loading chat:', error);
            navigate('/chats');
        } finally {
            setIsLoading(false);
            scrollToBottom();
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    console.log('Sending message to chat:', chatId);
    console.log('Message content:', newMessage);

    // Create temporary message for immediate display
    const tempId = Date.now();
    const tempMessage = {
        id: tempId,
        content: newMessage,
        senderId: user.id,
        isAI: false,
        createdAt: new Date().toISOString(),
        status: 'sending',
        senderName: user.name,
        senderAvatar: user.avatar
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setIsSending(true);

    try {
        console.log('Calling API...');
        const response = await chatAPI.sendMessage(chatId, {
            content: newMessage,
            type: 'text'
        });

        console.log('API response:', response.data);

        // Handle AI chat response (returns both user and AI messages)
        if (response.data.data.userMessage && response.data.data.aiMessage) {
            // Replace temp message with real user message
            setMessages(prev => 
                prev.map(msg => 
                    msg.id === tempId 
                        ? { ...response.data.data.userMessage, status: 'sent' }
                        : msg
                )
            );
            
            // Add AI response
            setMessages(prev => [...prev, {
                ...response.data.data.aiMessage,
                status: 'sent'
            }]);
        } else {
            // Regular chat response
            setMessages(prev => 
                prev.map(msg => 
                    msg.id === tempId 
                        ? { ...response.data.data, status: 'sent' }
                        : msg
                )
            );
        }

        // Update chat last message
        setChat(prev => ({
            ...prev,
            lastMessage: newMessage,
            updatedAt: new Date().toISOString()
        }));

    } catch (error) {
        console.error('Error sending message:', error);
        console.error('Error response:', error.response?.data);
        
        // Mark message as failed
        setMessages(prev => 
            prev.map(msg => 
                msg.id === tempId 
                    ? { 
                        ...msg, 
                        status: 'error', 
                        error: 'Не удалось отправить',
                        errorDetails: error.response?.data?.message 
                    }
                    : msg
            )
        );
    } finally {
        setIsSending(false);
    }
};

    const handleFileUpload = async (file) => {
        console.log('Uploading file:', file);
    };

    const handleDeleteMessage = async (messageId) => {
        if (window.confirm('Удалить это сообщение?')) {
            try {
                await chatAPI.deleteMessage(messageId);
                setMessages(prev => prev.filter(msg => msg.id !== messageId));
            } catch (error) {
                console.error('Error deleting message:', error);
            }
        }
    };

    const getParticipantName = (participantId) => {
        if (participantId === 'ai_assistant') return 'AI-Наставник';
        const participant = participants.find(p => p.id === participantId);
        return participant?.name || 'Пользователь';
    };

    const getParticipantAvatar = (participantId) => {
        if (participantId === 'ai_assistant') {
            return (
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                </div>
            );
        }
        
        const participant = participants.find(p => p.id === participantId);
        if (participant?.avatar) {
            return (
                <img 
                    src={participant.avatar} 
                    alt={participant.name}
                    className="w-8 h-8 rounded-full object-cover"
                />
            );
        }
        
        return (
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
            </div>
        );
    };

    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Connection status indicator */}
            <div className={`fixed top-4 right-4 z-50 px-3 py-1 rounded-full text-xs font-medium ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isConnected ? '✓ Онлайн' : '✗ Офлайн'}
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/chats')}
                            className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center gap-3">
                            {isAIChat ? (
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                    <Bot className="w-6 h-6 text-white" />
                                </div>
                            ) : chat?.isGroup ? (
                                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                            ) : (
                                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                            )}
                            
                            <div>
                                <h2 className="font-semibold text-gray-900">
                                    {isAIChat ? 'AI-Наставник' : chat?.name || getParticipantName(participants[0]?.id)}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {isAIChat 
                                        ? 'Онлайн • Готов помочь с обучением'
                                        : chat?.isGroup 
                                            ? `${participants.length} участников`
                                            : 'В сети'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isAIChat && (
                            <>
                                <button className="p-2 hover:bg-gray-100 rounded-lg">
                                    <Phone className="w-5 h-5" />
                                </button>
                                <button className="p-2 hover:bg-gray-100 rounded-lg">
                                    <Video className="w-5 h-5" />
                                </button>
                            </>
                        )}
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                            <Search className="w-5 h-5" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                            <Info className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Welcome message for AI chats */}
                        {isAIChat && messages.length === 0 && (
                            <div className="text-center py-8">
                                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bot className="w-10 h-10 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    Привет! Я ваш AI-наставник
                                </h3>
                                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                    Могу помочь с объяснением материалов, создать тесты, провести тренировку диалогов и дать рекомендации по обучению.
                                </p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    <button
                                        onClick={() => setNewMessage('Объясни тему...')}
                                        className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100"
                                    >
                                        Объяснить тему
                                    </button>
                                    <button
                                        onClick={() => setNewMessage('Создай тест по...')}
                                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                                    >
                                        Создать тест
                                    </button>
                                    <button
                                        onClick={() => setNewMessage('Потренируй диалог...')}
                                        className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                                    >
                                        Тренировка
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        {messages.map((message) => {
                            const isOwn = message.senderId === String(user.id);
                            const isAI = message.senderId === 'ai_assistant';
                            
                            return (
                                <div
                                    key={message.id}
                                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex gap-3 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                                        {/* Avatar */}
                                        {!isOwn && (
                                            <div className="flex-shrink-0">
                                                {getParticipantAvatar(message.senderId)}
                                            </div>
                                        )}

                                        {/* Message Bubble */}
                                        <div className={`relative ${isOwn ? 'text-right' : ''}`}>
                                            {!isOwn && !isAI && (
                                                <div className="text-sm font-medium text-gray-700 mb-1">
                                                    {message.senderName || getParticipantName(message.senderId)}
                                                </div>
                                            )}
                                            
                                            <div
                                                className={`
                                                    rounded-2xl px-4 py-3
                                                    ${isOwn
                                                        ? 'bg-primary text-white rounded-br-none'
                                                        : isAI
                                                            ? 'bg-purple-50 text-gray-900 border border-purple-100 rounded-bl-none'
                                                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                                                    }
                                                    ${message.status === 'error' ? 'bg-red-50 border-red-200' : ''}
                                                    ${message.status === 'sending' ? 'opacity-70' : ''}
                                                `}
                                            >
                                                <div className="whitespace-pre-wrap break-words">
                                                    {message.content}
                                                </div>
                                                
                                                {message.metadata?.type === 'quiz_suggestion' && (
                                                    <button
                                                        onClick={() => setNewMessage('Создай тест по...')}
                                                        className="mt-2 px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg text-sm hover:bg-blue-200"
                                                    >
                                                        Создать тест
                                                    </button>
                                                )}
                                                
                                                {message.metadata?.type === 'simulation_suggestion' && (
                                                    <button
                                                        onClick={() => setNewMessage('Начни симуляцию...')}
                                                        className="mt-2 px-3 py-1.5 bg-green-100 text-green-600 rounded-lg text-sm hover:bg-green-200"
                                                    >
                                                        Начать тренировку
                                                    </button>
                                                )}
                                            </div>

                                            {/* Message Info */}
                                            <div className={`flex items-center gap-2 mt-1 text-xs ${isOwn ? 'justify-end' : ''} ${message.status === 'error' ? 'text-red-500' : 'text-gray-500'}`}>
                                                <span>{formatMessageTime(message.createdAt)}</span>
                                                
                                                {isOwn && (
                                                    <>
                                                        {message.status === 'sending' && (
                                                            <>
                                                                <Clock className="w-3 h-3 animate-spin" />
                                                                <span>Отправка...</span>
                                                            </>
                                                        )}
                                                        {message.status === 'sent' && (
                                                            <span className="text-green-500">✓</span>
                                                        )}
                                                        {message.status === 'error' && (
                                                            <>
                                                                <span className="text-red-500">✗</span>
                                                                <span>{message.error || 'Ошибка'}</span>
                                                            </>
                                                        )}
                                                        
                                                        {!message.id.startsWith('temp_') && (
                                                            <button
                                                                onClick={() => handleDeleteMessage(message.id)}
                                                                className="opacity-0 hover:opacity-100 transition-opacity text-gray-400"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="bg-white border-t p-4">
                    <div className="max-w-3xl mx-auto">
                        {/* Connection status warning */}
                        {!isConnected && (
                            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                                ⚠️ Нет подключения к серверу. Сообщения могут не отправляться.
                            </div>
                        )}

                        {/* Quick Actions for AI */}
                        {isAIChat && (
                            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                                <button
                                    type="button"
                                    onClick={() => setNewMessage('Объясни тему из курса...')}
                                    className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-sm hover:bg-purple-100 whitespace-nowrap"
                                >
                                    Объяснить тему
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewMessage('Создай тест по текущему курсу')}
                                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 whitespace-nowrap"
                                >
                                    Создать тест
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewMessage('Потренируй диалог продаж')}
                                    className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-sm hover:bg-green-100 whitespace-nowrap"
                                >
                                    Тренировка диалога
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewMessage('Дай рекомендации по обучению')}
                                    className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-sm hover:bg-orange-100 whitespace-nowrap"
                                >
                                    Рекомендации
                                </button>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <div className="flex items-center border rounded-2xl focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-3 text-gray-500 hover:text-gray-700"
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                    
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder={isAIChat ? "Задайте вопрос AI-наставнику..." : "Введите сообщение..."}
                                        className="flex-1 py-3 px-1 outline-none"
                                        disabled={isSending}
                                    />
                                    
                                    <div className="flex items-center pr-2">
                                        <button
                                            type="button"
                                            className="p-2 text-gray-500 hover:text-gray-700"
                                        >
                                            <Smile className="w-5 h-5" />
                                        </button>
                                        <button
                                            type="button"
                                            className="p-2 text-gray-500 hover:text-gray-700"
                                        >
                                            <Mic className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(e.target.files[0])}
                                    multiple
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!newMessage.trim() || isSending || !isConnected}
                                className={`
                                    px-6 rounded-2xl font-medium transition-colors
                                    ${isAIChat
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                                        : 'bg-primary hover:bg-primary/90 text-white'
                                    }
                                    ${(!newMessage.trim() || isSending || !isConnected) ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Sidebar - Chat Info (опционально) */}
            <div className="hidden lg:block w-80 border-l bg-white">
                <div className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Информация о чате</h3>
                    
                    {isAIChat ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-3">
                                    <Bot className="w-7 h-7 text-white" />
                                </div>
                                <h4 className="font-semibold text-gray-900">AI-Наставник</h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    Помощник по обучению. Может объяснять темы, создавать тесты и проводить тренировки диалогов.
                                </p>
                            </div>
                            
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Что умеет:</h4>
                                <ul className="space-y-2 text-sm text-gray-600">
                                    <li className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                        Объяснение материалов курса
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        Генерация тестов и вопросов
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        Тренировка диалогов (продажи, переговоры)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                        Рекомендации по обучению
                                    </li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">Участники ({participants.length})</h4>
                                <div className="space-y-2">
                                    {participants.map(participant => (
                                        <div key={participant.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                                            {getParticipantAvatar(participant.id)}
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {participant.id === user.id ? 'Вы' : participant.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {participant.role || 'Сотрудник'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Файлы</h4>
                                <p className="text-sm text-gray-500">Пока нет общих файлов</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}