import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, Eye, EyeOff, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
    email: z.string().email('Введите корректный email'),
    password: z.string().min(6, 'Минимум 6 символов'),
});

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/courses';

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        setError('');

        const result = await login(data.email, data.password);

        if (result.success) {
            navigate(from, { replace: true });
        } else {
            setError(result.message);
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-purple-100 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-purple-700 rounded-2xl mb-4 shadow-lg">
                        <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">MicroLearning AI</h1>
                    <p className="text-gray-600 mt-2">Платформа корпоративного обучения</p>
                </div>

                {/* Login form */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Вход в систему</h2>

                    {error && (
                        <div className="flex items-center gap-2 p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label className="label">Email</label>
                            <input
                                type="email"
                                {...register('email')}
                                className={`input ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                                placeholder="email@company.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="label">Пароль</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password')}
                                    className={`input pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary w-full"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                'Войти'
                            )}
                        </button>
                    </form>

                    {/* Demo accounts */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-sm text-gray-500 text-center mb-4">Тестовые аккаунты:</p>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                                <span className="text-gray-600">Admin</span>
                                <span className="font-mono text-gray-800">admin@lms.com / admin123</span>
                            </div>
                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                                <span className="text-gray-600">Teacher</span>
                                <span className="font-mono text-gray-800">teacher@lms.com / teacher123</span>
                            </div>
                            <div className="flex justify-between p-2 bg-gray-50 rounded">
                                <span className="text-gray-600">Student</span>
                                <span className="font-mono text-gray-800">student@lms.com / student123</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
