// frontend/src/pages/ChatsPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { chatAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import ChatCreateModal from './ChatCreateModal';
import {
    MessageSquare,
    Bot,
    Users,
    User,
    Plus,
    Search,
    MoreVertical,
    Clock,
    Filter,
    Video,
    Phone,
    BookOpen
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

export default function ChatsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [chats, setChats] = useState([]);
    const [aiChats, setAIChats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // all, ai, personal, group
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { socket, isConnected } = useSocket();

    useEffect(() => {
        loadChats();
    }, []);

    useEffect(() => {
        if (!socket || !isConnected) return;

        // Слушаем новые сообщения в чатах
        const handleNewChatMessage = (message) => {
            console.log('New chat message notification:', message);
            // Можно обновить список чатов или показать уведомление
            loadChats(); // Перезагружаем список чатов
        };

        // Слушаем новые AI сообщения
        const handleNewAIMessage = (message) => {
            console.log('New AI message notification:', message);
            loadChats();
        };

        socket.on('new-chat-message', handleNewChatMessage);
        socket.on('new-ai-message', handleNewAIMessage);

        return () => {
            if (socket) {
                socket.off('new-chat-message', handleNewChatMessage);
                socket.off('new-ai-message', handleNewAIMessage);
            }
        };
    }, [socket, isConnected]);

    const loadChats = async () => {
        try {
            setIsLoading(true);
            
            // Загружаем пользовательские чаты
            const chatsResponse = await chatAPI.getUserChats();
            setChats(chatsResponse.data.data || []);
            
            // Загружаем AI чаты (сессии)
            const aiResponse = await chatAPI.getSessions();
            setAIChats(aiResponse.data.data || []);
            
        } catch (error) {
            console.error('Error loading chats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const createNewAIChat = async () => {
        try {
            const response = await chatAPI.createSession({
                title: 'Чат с AI-наставником',
                context: 'general'
            });
            
            navigate(`/chat/${response.data.data.id}`);
        } catch (error) {
            console.error('Error creating AI chat:', error);
        }
    };

    const createNewUserChat = async () => {
        // Здесь можно открыть модалку для выбора пользователей
        // Для простоты создадим групповой чат
        setShowCreateModal(true);
        
    };

    const handleCreateChat = async (data) => {
    try {
        const response = await chatAPI.createChat(data);
        setShowCreateModal(false);
        navigate(`/chat/${response.data.data.id}`);
    } catch (error) {
        console.error('Error creating chat:', error);
        alert('Ошибка при создании чата');
    }
};

    const getChatDisplayData = (chat) => {
        if (chat.isGroup) {
            return {
                name: chat.name,
                avatar: (
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                ),
                lastMessage: chat.lastMessage || 'Нет сообщений',
                time: new Date(chat.updatedAt).toLocaleDateString(),
                unread: chat.unreadCount || 0
            };
        } else {
            const otherParticipant = chat.participants?.find(p => p.id !== user.id);
            return {
                name: otherParticipant?.name || 'Пользователь',
                avatar: otherParticipant?.avatar ? (
                    <img 
                        src={otherParticipant.avatar} 
                        alt={otherParticipant.name}
                        className="w-12 h-12 rounded-xl object-cover"
                    />
                ) : (
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                    </div>
                ),
                lastMessage: chat.lastMessage || 'Нет сообщений',
                time: new Date(chat.updatedAt).toLocaleDateString(),
                unread: chat.unreadCount || 0
            };
        }
    };

    const getAIChatDisplayData = (chat) => ({
        name: chat.title,
        avatar: (
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
            </div>
        ),
        lastMessage: chat.messages?.[0]?.content || 'Начните диалог с AI',
        time: new Date(chat.updatedAt).toLocaleDateString(),
        context: chat.context
    });

    const filteredChats = chats.filter(chat => {
        if (filter === 'ai') return false;
        if (filter === 'personal' && chat.isGroup) return false;
        if (filter === 'group' && !chat.isGroup) return false;
        
        const displayData = getChatDisplayData(chat);
        return displayData.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const filteredAIChats = aiChats.filter(chat => {
        if (filter !== 'all' && filter !== 'ai') return false;
        
        const displayData = getAIChatDisplayData(chat);
        return displayData.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-full md:w-96 bg-white border-r flex flex-col">
                {/* Header */}
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold text-gray-900">Чаты</h1>
                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-gray-100 rounded-lg">
                                <Video className="w-5 h-5" />
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg">
                                <Phone className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Поиск чатов..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
                        >
                            Все
                        </button>
                        <button
                            onClick={() => setFilter('ai')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${filter === 'ai' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                        >
                            AI-Наставник
                        </button>
                        <button
                            onClick={() => setFilter('personal')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${filter === 'personal' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
                        >
                            Личные
                        </button>
                        <button
                            onClick={() => setFilter('group')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${filter === 'group' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
                        >
                            Групповые
                        </button>
                    </div>
                </div>

                {/* Create New Chat Buttons */}
                <div className="p-4 border-b space-y-2">
                    <button
                        onClick={createNewAIChat}
                        className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl transition-colors"
                    >
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                            <div className="font-medium text-gray-900">Создать чат с AI</div>
                            <div className="text-sm text-gray-600">Обучение, тесты, тренировки</div>
                        </div>
                    </button>
                    
                    <button
                        onClick={createNewUserChat}
                        className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                            <div className="font-medium text-gray-900">Новый групповой чат</div>
                            <div className="text-sm text-gray-600">С коллегами и менеджерами</div>
                        </div>
                    </button>
                </div>

                {/* Chats List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="animate-pulse">
                                    <div className="flex items-center gap-3 p-3">
                                        <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* AI Chats */}
                            {filteredAIChats.length > 0 && (
                                <div className="p-3">
                                    <h3 className="text-sm font-semibold text-gray-500 mb-2">AI-Наставник</h3>
                                    {filteredAIChats.map(chat => {
                                        const displayData = getAIChatDisplayData(chat);
                                        return (
                                            <Link
                                                key={chat.id}
                                                to={`/chat/ai-${chat.id}`}
                                                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors mb-2"
                                            >
                                                {displayData.avatar}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-medium text-gray-900 truncate">
                                                            {displayData.name}
                                                        </h4>
                                                        <span className="text-xs text-gray-500">
                                                            {displayData.time}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 truncate">
                                                        {displayData.lastMessage}
                                                    </p>
                                                    {displayData.context && (
                                                        <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded">
                                                            {displayData.context}
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}

                            {/* User Chats */}
                            {filteredChats.length > 0 && (
                                <div className="p-3">
                                    <h3 className="text-sm font-semibold text-gray-500 mb-2">
                                        {filter === 'group' ? 'Групповые чаты' : 
                                         filter === 'personal' ? 'Личные чаты' : 
                                         'Чаты с пользователями'}
                                    </h3>
                                    {filteredChats.map(chat => {
                                        const displayData = getChatDisplayData(chat);
                                        return (
                                            <Link
                                                key={chat.id}
                                                to={`/chat/${chat.id}`}
                                                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors mb-2"
                                            >
                                                {displayData.avatar}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-medium text-gray-900 truncate">
                                                            {displayData.name}
                                                        </h4>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-gray-500">
                                                                {displayData.time}
                                                            </span>
                                                            {displayData.unread > 0 && (
                                                                <span className="w-2 h-2 bg-primary rounded-full"></span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-600 truncate">
                                                        {displayData.lastMessage}
                                                    </p>
                                                    {displayData.unread > 0 && (
                                                        <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                                                            {displayData.unread} новое
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Empty State */}
                            {filteredChats.length === 0 && filteredAIChats.length === 0 && (
                                <div className="flex flex-col items-center justify-center p-8 text-center">
                                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <MessageSquare className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Нет чатов
                                    </h3>
                                    <p className="text-gray-600 mb-6 max-w-sm">
                                        {searchTerm 
                                            ? 'По вашему запросу чатов не найдено'
                                            : 'Создайте новый чат с AI-наставником или коллегами'
                                        }
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={createNewAIChat}
                                            className="btn bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                                        >
                                            Чат с AI
                                        </button>
                                        <button
                                            onClick={createNewUserChat}
                                            className="btn btn-outline"
                                        >
                                            Групповой чат
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">{user?.name}</div>
                                <div className="text-xs text-gray-500">{user?.role}</div>
                            </div>
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Welcome Screen */}
            <div className="flex-1 hidden md:flex flex-col items-center justify-center p-8">
                <div className="max-w-md text-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8">
                        <MessageSquare className="w-16 h-16 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Добро пожаловать в чаты!
                    </h2>
                    <p className="text-gray-600 mb-8 text-lg">
                        Общайтесь с AI-наставником для обучения или создавайте чаты с коллегами для совместной работы
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">AI-Наставник</h3>
                            <p className="text-sm text-gray-600">
                                Помощь в обучении, тесты, тренировка диалогов
                            </p>
                        </div>
                        <div className="p-6 bg-blue-50 rounded-2xl">
                            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-2">Коллеги</h3>
                            <p className="text-sm text-gray-600">
                                Совместные обсуждения, обмен опытом
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            {showCreateModal && (
            <ChatCreateModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={handleCreateChat}
            />
        )}
        </div>
    );
}