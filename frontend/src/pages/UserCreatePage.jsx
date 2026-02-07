import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, ArrowLeft, Mail, Lock, User, Shield, AlertCircle } from 'lucide-react';

const ROLES = [
    { value: 'STUDENT', label: 'Студент', description: 'Может записываться на курсы и проходить обучение' },
    { value: 'TEACHER', label: 'Учитель', description: 'Может создавать курсы и управлять ими' },
    { value: 'ADMIN', label: 'Администратор', description: 'Полный доступ к системе' },
];

export default function UserCreatePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        role: 'STUDENT'
    });
    
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [createdUser, setCreatedUser] = useState(null);

    // Проверяем, является ли пользователь админом
    if (user?.role !== 'ADMIN') {
        navigate('/admin/dashboard');
        return null;
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Очищаем ошибку при изменении поля
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email обязателен';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Некорректный email';
        }
        
        // Password validation
        if (!formData.password) {
            newErrors.password = 'Пароль обязателен';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Пароль должен быть не менее 6 символов';
        }
        
        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Имя обязательно';
        }
        
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        
        setIsSubmitting(true);
        setErrors({});
        setSuccess(false);
        setCreatedUser(null);
        
        try {
            const response = await usersAPI.create(formData);
            
            if (response.data.success) {
                setSuccess(true);
                setCreatedUser(response.data.data);
                
                // Сбрасываем форму
                setFormData({
                    email: '',
                    password: '',
                    name: '',
                    role: 'STUDENT'
                });
                
                // Автоматически скрываем сообщение об успехе через 5 секунд
                setTimeout(() => {
                    setSuccess(false);
                }, 5000);
            }
        } catch (error) {
            console.error('Error creating user:', error);
            
            if (error.response?.status === 409) {
                setErrors({ 
                    submit: 'Пользователь с таким email уже существует' 
                });
            } else if (error.response?.data?.message) {
                setErrors({ 
                    submit: error.response.data.message 
                });
            } else if (error.response?.data?.errors) {
                // Если сервер вернул объект с ошибками полей
                setErrors(error.response.data.errors);
            } else if (error.response?.status === 403) {
                setErrors({ 
                    submit: 'У вас нет прав для создания пользователей' 
                });
            } else if (error.response?.status === 401) {
                setErrors({ 
                    submit: 'Требуется авторизация' 
                });
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setErrors({ 
                    submit: 'Произошла ошибка при создании пользователя. Проверьте подключение к серверу.' 
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        navigate('/admin/users');
    };

    const handleCreateAnother = () => {
        setSuccess(false);
        setCreatedUser(null);
    };

    const getRoleLabel = (roleValue) => {
        const role = ROLES.find(r => r.value === roleValue);
        return role ? role.label : roleValue;
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Success Message with User Details */}
            {success && createdUser && (
                <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <UserPlus className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <div className="ml-4 flex-1">
                            <h3 className="text-lg font-semibold text-green-800">
                                Пользователь успешно создан! 🎉
                            </h3>
                            <div className="mt-3 p-4 bg-white rounded-lg border border-green-100">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">ID</p>
                                        <p className="text-sm text-gray-900 font-mono">{createdUser.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Имя</p>
                                        <p className="text-sm text-gray-900">{createdUser.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Email</p>
                                        <p className="text-sm text-gray-900">{createdUser.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Роль</p>
                                        <p className="text-sm text-gray-900">{getRoleLabel(createdUser.role)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex gap-3">
                                <button
                                    onClick={handleCreateAnother}
                                    className="px-4 py-2 bg-white text-green-700 border border-green-300 font-medium rounded-lg hover:bg-green-50 transition-colors"
                                >
                                    Создать ещё одного
                                </button>
                                <button
                                    onClick={handleBack}
                                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Вернуться к списку
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {errors.submit && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                Ошибка создания пользователя
                            </h3>
                            <p className="mt-1 text-sm text-red-600">
                                {errors.submit}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleBack}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Назад к списку пользователей"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">
                                    Создание нового пользователя
                                </h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    Добавьте нового пользователя в систему обучения
                                </p>
                            </div>
                        </div>
                        
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center">
                            <UserPlus className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5">
                    <div className="space-y-6">
                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    Email пользователя *
                                </div>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`input ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                placeholder="user@example.com"
                                disabled={isSubmitting}
                                autoComplete="off"
                            />
                            {errors.email && (
                                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <Lock className="w-4 h-4" />
                                    Пароль *
                                </div>
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`input ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                placeholder="Не менее 6 символов"
                                disabled={isSubmitting}
                                autoComplete="new-password"
                            />
                            {errors.password && (
                                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                            )}
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                                <Lock className="w-4 h-4 mr-2" />
                                Пароль будет зашифрован и недоступен для просмотра
                            </div>
                        </div>

                        {/* Name Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Полное имя *
                                </div>
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`input ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                placeholder="Иван Иванов"
                                disabled={isSubmitting}
                            />
                            {errors.name && (
                                <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    Роль пользователя
                                </div>
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {ROLES.map((roleOption) => (
                                    <div key={roleOption.value} className="relative">
                                        <input
                                            type="radio"
                                            name="role"
                                            id={`role-${roleOption.value}`}
                                            value={roleOption.value}
                                            checked={formData.role === roleOption.value}
                                            onChange={handleChange}
                                            className="peer sr-only"
                                            disabled={isSubmitting}
                                        />
                                        <label
                                            htmlFor={`role-${roleOption.value}`}
                                            className={`
                                                block p-4 border rounded-lg cursor-pointer transition-all duration-200
                                                peer-checked:border-primary peer-checked:ring-2 peer-checked:ring-primary/20
                                                peer-checked:shadow-sm
                                                ${formData.role === roleOption.value 
                                                    ? 'border-primary bg-primary/5' 
                                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }
                                                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                                            `}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`
                                                    w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 flex-shrink-0
                                                    ${formData.role === roleOption.value 
                                                        ? 'border-primary bg-primary' 
                                                        : 'border-gray-300'
                                                    }
                                                `}>
                                                    {formData.role === roleOption.value && (
                                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {roleOption.label}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                                                        {roleOption.description}
                                                    </div>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="px-5 py-2.5 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                                disabled={isSubmitting}
                            >
                                Отмена
                            </button>
                            
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFormData({
                                            email: '',
                                            password: '',
                                            name: '',
                                            role: 'STUDENT'
                                        });
                                        setErrors({});
                                    }}
                                    className="px-5 py-2.5 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Очистить форму
                                </button>
                                
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`
                                        px-6 py-2.5 bg-primary text-white font-medium rounded-lg
                                        hover:bg-primary/90 transition-colors shadow-sm
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        flex items-center gap-2 min-w-[180px] justify-center
                                    `}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Создание...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" />
                                            Создать пользователя
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Что происходит после создания пользователя?
                </h3>
                <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5"></div>
                        <span>Пользователь сразу сможет войти в систему с предоставленными данными</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5"></div>
                        <span>Пароль будет зашифрован и недоступен для просмотра даже администраторам</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5"></div>
                        <span>Для смены пароля пользователь должен использовать функцию "Забыли пароль" или обратиться к администратору</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5"></div>
                        <span>Учителя могут создавать курсы сразу после создания аккаунта</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5"></div>
                        <span>Студенты могут записываться на доступные курсы</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}