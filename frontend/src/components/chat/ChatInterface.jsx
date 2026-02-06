import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, History, HelpCircle, MessageSquare, X } from 'lucide-react';
import { chatAPI } from '../../api/client';

export default function ChatInterface({ sessionId, onClose, context }) {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (sessionId) {
            fetchSessionMessages();
        } else {
            createNewSession();
        }
    }, [sessionId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchSessionMessages = async () => {
        try {
            setIsLoading(true);
            const response = await chatAPI.getSession(sessionId);
            setMessages(response.data.data.messages || []);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const createNewSession = async () => {
        try {
            const response = await chatAPI.createSession({
                title: 'Чат с AI-наставником',
                context: context || 'general'
            });
            // Redirect or update parent with new sessionId
        } catch (error) {
            console.error('Error creating session:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            content: inputMessage,
            isAI: false,
            createdAt: new Date().toISOString(),
            senderId: 'user'
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsTyping(true);

        try {
            const response = await chatAPI.sendMessage(sessionId, {
                content: inputMessage,
                type: 'text'
            });

            const aiMessage = {
                ...response.data.data.aiMessage,
                id: Date.now() + 1
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            // Add error message
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                content: 'Извините, произошла ошибка. Попробуйте позже.',
                isAI: true,
                createdAt: new Date().toISOString(),
                senderId: 'ai_assistant',
                isError: true
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleQuickAction = async (action) => {
        switch (action) {
            case 'help':
                setInputMessage('Помощь по использованию чата');
                break;
            case 'generate_quiz':
                setInputMessage('Создай тест по текущему курсу');
                break;
            case 'simulate':
                setInputMessage('Начни симуляцию диалога продаж');
                break;
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Bot className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">AI-Наставник</h3>
                        <p className="text-sm text-gray-500">Готов помочь с обучением</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleQuickAction('help')}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Помощь"
                    >
                        <HelpCircle className="w-5 h-5 text-gray-500" />
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    )}
                </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Начните диалог с AI-наставником
                        </h3>
                        <p className="text-gray-600 max-w-md mb-6">
                            Задайте вопрос по курсу, попросите создать тест или начните тренировку диалога
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleQuickAction('help')}
                                className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
                            >
                                Что умеет AI?
                            </button>
                            <button
                                onClick={() => handleQuickAction('generate_quiz')}
                                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                            >
                                Создать тест
                            </button>
                            <button
                                onClick={() => handleQuickAction('simulate')}
                                className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                            >
                                Тренировка диалога
                            </button>
                        </div>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.isAI ? 'justify-start' : 'justify-end'}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-2xl p-4 ${message.isAI
                                        ? 'bg-gray-100 text-gray-900 rounded-tl-none'
                                        : 'bg-primary text-white rounded-tr-none'
                                    } ${message.isError ? 'bg-red-50 text-red-700 border border-red-200' : ''}`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    {message.isAI ? (
                                        <Bot className="w-4 h-4" />
                                    ) : (
                                        <User className="w-4 h-4" />
                                    )}
                                    <span className="text-xs opacity-75">
                                        {message.isAI ? 'AI-Наставник' : 'Вы'}
                                    </span>
                                </div>
                                <div className="whitespace-pre-wrap">{message.content}</div>
                                <div className="text-xs opacity-50 mt-2 text-right">
                                    {new Date(message.createdAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-2xl rounded-tl-none p-4">
                            <div className="flex items-center gap-2">
                                <Bot className="w-4 h-4" />
                                <span className="text-xs">AI-Наставник печатает...</span>
                            </div>
                            <div className="flex gap-1 mt-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="border-t p-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Введите сообщение..."
                        className="flex-1 input"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !inputMessage.trim()}
                        className="btn btn-primary px-4"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex gap-2 mt-3 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setInputMessage('Объясни тему...')}
                        className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg whitespace-nowrap"
                    >
                        Объясни тему
                    </button>
                    <button
                        type="button"
                        onClick={() => setInputMessage('Создай тест по...')}
                        className="text-sm px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg whitespace-nowrap"
                    >
                        Создать тест
                    </button>
                    <button
                        type="button"
                        onClick={() => setInputMessage('Потренируй диалог...')}
                        className="text-sm px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg whitespace-nowrap"
                    >
                        Тренировка
                    </button>
                    <button
                        type="button"
                        onClick={() => setInputMessage('Дай рекомендации...')}
                        className="text-sm px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg whitespace-nowrap"
                    >
                        Рекомендации
                    </button>
                </div>
            </form>
        </div>
    );
}