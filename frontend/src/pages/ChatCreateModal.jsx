// frontend/src/components/chat/ChatCreateModal.jsx
import { useState, useEffect } from 'react';
import { X, Search, User, Users } from 'lucide-react';
import { usersAPI } from '../api/client';

export default function ChatCreateModal({ isOpen, onClose, onCreate }) {
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [chatName, setChatName] = useState('');
    const [isGroup, setIsGroup] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadUsers();
            // Сброс при открытии модалки
            setChatName('');
            setSelectedUsers([]);
            setIsGroup(true);
        }
    }, [isOpen]);

    useEffect(() => {
        // Автоматически генерируем название чата
        updateChatName();
    }, [isGroup, selectedUsers]);

    const loadUsers = async () => {
        try {
            setIsLoading(true);
            
            // Используем chat endpoint
            const response = await usersAPI.getAllForChat();
            console.log('Users from chat endpoint:', response.data);
            setUsers(response.data.data || []);
            
        } catch (error) {
            console.error('Error loading users:', error);
            
            // Fallback данные для теста
            setUsers([
                { id: 1, name: 'Иван Иванов', email: 'ivan@test.com', role: 'STUDENT' },
                { id: 2, name: 'Мария Петрова', email: 'maria@test.com', role: 'TEACHER' },
                { id: 3, name: 'Алексей Сидоров', email: 'alex@test.com', role: 'ADMIN' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const updateChatName = () => {
        if (!isGroup && selectedUsers.length === 1) {
            // Для личного чата используем имя собеседника
            const partner = selectedUsers[0];
            setChatName(partner.name || 'Личный чат');
        } else if (isGroup && selectedUsers.length > 0) {
            // Для группового чата можно предложить дефолтное название
            if (!chatName || chatName === 'Новый чат' || chatName.startsWith('Чат с ')) {
                if (selectedUsers.length === 1) {
                    setChatName(`Чат с ${selectedUsers[0].name}`);
                } else {
                    setChatName(`Групповой чат (${selectedUsers.length} участников)`);
                }
            }
        } else {
            // Если нет выбранных пользователей или сбросили выбор
            if (!chatName || chatName === 'Новый чат') {
                setChatName('Новый чат');
            }
        }
    };

    const handleUserSelection = (user, checked) => {
        let newSelectedUsers;
        
        if (checked) {
            // Добавляем пользователя
            newSelectedUsers = [...selectedUsers, user];
            
            // Для личного чата можно выбрать только одного
            if (!isGroup && newSelectedUsers.length > 1) {
                alert('В личном чате можно выбрать только одного собеседника');
                return;
            }
        } else {
            // Удаляем пользователя
            newSelectedUsers = selectedUsers.filter(u => u.id !== user.id);
        }
        
        setSelectedUsers(newSelectedUsers);
    };

    const handleGroupTypeChange = (newIsGroup) => {
        setIsGroup(newIsGroup);
        
        // При переключении типа чата сбрасываем выбор если нужно
        if (!newIsGroup && selectedUsers.length > 1) {
            // Для личного чата оставляем только первого выбранного
            setSelectedUsers(selectedUsers.slice(0, 1));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!chatName.trim()) {
            alert('Введите название чата');
            return;
        }

        if (selectedUsers.length === 0) {
            alert('Выберите хотя бы одного участника');
            return;
        }

        // Для личного чата проверяем что выбран только один
        if (!isGroup && selectedUsers.length !== 1) {
            alert('В личном чате должен быть только один собеседник');
            return;
        }

        const participantIds = selectedUsers.map(user => user.id);
        
        console.log('Creating chat:', {
            name: chatName,
            isGroup,
            participantIds
        });
        
        onCreate({
            name: chatName,
            isGroup,
            participantIds
        });
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Получаем имя партнера для отображения
    const getPartnerName = () => {
        if (!isGroup && selectedUsers.length === 1) {
            return selectedUsers[0].name;
        }
        return null;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Создать новый чат</h2>
                        <p className="text-gray-600 mt-1">
                            {isGroup ? 'Групповой чат с коллегами' : 'Личная беседа'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col h-[calc(90vh-8rem)]">
                    {/* Chat Settings */}
                    <div className="p-6 border-b space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Название чата
                            </label>
                            <input
                                type="text"
                                value={chatName}
                                onChange={(e) => setChatName(e.target.value)}
                                placeholder="Введите название чата..."
                                className="w-full input"
                                required
                            />
                            {!isGroup && selectedUsers.length === 1 && (
                                <p className="text-sm text-gray-500 mt-1">
                                    Название автоматически заполнено именем собеседника
                                </p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-700">Тип чата</h3>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer flex-1">
                                    <input
                                        type="radio"
                                        checked={isGroup}
                                        onChange={() => handleGroupTypeChange(true)}
                                        className="w-4 h-4 text-primary"
                                    />
                                    <div className="flex items-center gap-2 p-3 border rounded-lg flex-1 hover:bg-gray-50">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Users className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium text-gray-900">Групповой чат</div>
                                            <div className="text-sm text-gray-500">Несколько участников</div>
                                        </div>
                                    </div>
                                </label>
                                
                                <label className="flex items-center gap-2 cursor-pointer flex-1">
                                    <input
                                        type="radio"
                                        checked={!isGroup}
                                        onChange={() => handleGroupTypeChange(false)}
                                        className="w-4 h-4 text-primary"
                                    />
                                    <div className="flex items-center gap-2 p-3 border rounded-lg flex-1 hover:bg-gray-50">
                                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                            <User className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-medium text-gray-900">Личный чат</div>
                                            <div className="text-sm text-gray-500">Только вы и собеседник</div>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Выбранные пользователи */}
                        {selectedUsers.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">
                                    Выбранные участники ({selectedUsers.length})
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedUsers.map(user => (
                                        <div
                                            key={user.id}
                                            className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg"
                                        >
                                            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                                                <User className="w-3 h-3 text-primary" />
                                            </div>
                                            <span className="text-sm font-medium">{user.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleUserSelection(user, false)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {!isGroup && selectedUsers.length === 1 && (
                                    <p className="text-sm text-green-600 mt-2">
                                        Личный чат с {getPartnerName()}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Users Selection */}
                    <div className="flex-1 overflow-hidden">
                        <div className="p-6 border-b">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Поиск пользователей..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                                />
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-sm text-gray-500">
                                    {!isGroup 
                                        ? 'Выберите одного собеседника'
                                        : 'Выберите участников чата'
                                    }
                                </span>
                                <span className="text-sm text-gray-500">
                                    Найдено: {filteredUsers.length}
                                </span>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto h-64">
                            {isLoading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                    <p className="mt-2 text-sm text-gray-500">Загрузка пользователей...</p>
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="text-center py-8">
                                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">
                                        {searchTerm 
                                            ? `По запросу "${searchTerm}" пользователи не найдены`
                                            : 'Пользователи не найдены'
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredUsers.map(user => {
                                        const isSelected = selectedUsers.some(u => u.id === user.id);
                                        const isDisabled = !isGroup && selectedUsers.length === 1 && !isSelected;
                                        
                                        return (
                                            <label
                                                key={user.id}
                                                className={`
                                                    flex items-center gap-3 p-3 rounded-lg cursor-pointer
                                                    ${isSelected 
                                                        ? 'bg-primary/10 border border-primary/20' 
                                                        : 'hover:bg-gray-50'
                                                    }
                                                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                                                `}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => handleUserSelection(user, e.target.checked)}
                                                    className="w-4 h-4 text-primary rounded"
                                                    disabled={isDisabled}
                                                />
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className={`
                                                        w-10 h-10 rounded-full flex items-center justify-center
                                                        ${isSelected 
                                                            ? 'bg-primary text-white' 
                                                            : 'bg-gray-100 text-gray-600'
                                                        }
                                                    `}>
                                                        {user.avatar ? (
                                                            <img 
                                                                src={user.avatar} 
                                                                alt={user.name}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <User className="w-5 h-5" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-900">
                                                            {user.name}
                                                            {isSelected && !isGroup && (
                                                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                                                    собеседник
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {user.email}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {user.role === 'STUDENT' ? 'Студент' : 
                                                             user.role === 'TEACHER' ? 'Преподаватель' : 
                                                             user.role === 'ADMIN' ? 'Администратор' : 
                                                             'Пользователь'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t bg-gray-50">
                        <div className="flex justify-between items-center">
                            <div className="text-sm">
                                {selectedUsers.length === 0 ? (
                                    <span className="text-gray-600">
                                        {!isGroup 
                                            ? 'Выберите одного собеседника'
                                            : 'Выберите участников чата'
                                        }
                                    </span>
                                ) : !isGroup ? (
                                    <span className="text-green-600 font-medium">
                                        Личный чат с {getPartnerName()}
                                    </span>
                                ) : (
                                    <span className="text-gray-600">
                                        {selectedUsers.length} участник(ов) выбрано
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-2 border rounded-lg hover:bg-gray-100"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={selectedUsers.length === 0 || (!isGroup && selectedUsers.length !== 1)}
                                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {!isGroup ? 'Начать диалог' : 'Создать чат'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}