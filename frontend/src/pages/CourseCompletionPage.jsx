import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { certificatesAPI, portfolioAPI } from '../api/client';
import { useState, useEffect } from 'react';
import {
    Award,
    Download,
    Share2,
    Printer,
    Home,
    BookOpen,
    Calendar,
    User,
    Clock,
    ArrowRight  
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function CourseCompletionPage() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [certificate, setCertificate] = useState(location.state?.certificate);
    const [course, setCourse] = useState(location.state?.course);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    useEffect(() => {
        if (!certificate || !course) {
            // Загружаем данные если их нет в state
            fetchCertificateData();
        }
    }, [id]);

    const fetchCertificateData = async () => {
        try {
            const response = await certificatesAPI.getForCourse(id);
            setCertificate(response.data.data.certificate);
            setCourse(response.data.data.course);
        } catch (error) {
            console.error('Error fetching certificate:', error);
            navigate(`/courses/${id}`);
        }
    };

    const handleGeneratePDF = async () => {
        try {
            setIsGeneratingPDF(true);
            const response = await certificatesAPI.generatePDF(certificate.id);
            
            // Создаем ссылку для скачивания
            const link = document.createElement('a');
            link.href = response.data.data.url;
            link.download = `Сертификат_${course.title.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleShareCertificate = async () => {
        try {
            setIsSharing(true);
            // Генерируем публичную ссылку
            const response = await certificatesAPI.share(certificate.id);
            const shareUrl = response.data.data.shareUrl;
            
            // Используем Web Share API если доступен
            if (navigator.share) {
                await navigator.share({
                    title: `Мой сертификат: ${course.title}`,
                    text: `Я успешно завершил курс "${course.title}"!`,
                    url: shareUrl
                });
            } else {
                // Копируем в буфер обмена
                await navigator.clipboard.writeText(shareUrl);
                alert('Ссылка скопирована в буфер обмена!');
            }
        } catch (error) {
            console.error('Error sharing certificate:', error);
        } finally {
            setIsSharing(false);
        }
    };

    if (!certificate || !course) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Поздравляем! 🎉</h1>
                    <p className="text-xl text-gray-600">
                        Вы успешно завершили курс "{course.title}"
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Certificate Preview */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ваш сертификат</h2>
                            <p className="text-gray-600">Сертификат об успешном завершении курса</p>
                        </div>

                        {/* Certificate Design */}
                        <div className="relative bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200 rounded-xl p-8 shadow-inner">
                            {/* Decorative elements */}
                            <div className="absolute top-4 right-4 w-12 h-12 border-2 border-purple-300 rounded-full opacity-20" />
                            <div className="absolute bottom-4 left-4 w-16 h-16 border-2 border-pink-300 rounded-full opacity-20" />
                            
                            {/* Certificate Content */}
                            <div className="relative text-center space-y-6">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Award className="w-10 h-10 text-white" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-gray-900 mb-2">Сертификат</h3>
                                    <p className="text-gray-500">об успешном завершении</p>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-xl font-medium text-gray-700">Настоящим удостоверяется, что</p>
                                    <h4 className="text-3xl font-bold text-purple-600">{user?.name || 'Студент'}</h4>
                                    <p className="text-gray-600">успешно завершил(а) курс</p>
                                </div>

                                <div className="py-4 border-y border-gray-200">
                                    <h5 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h5>
                                    <p className="text-gray-600">в системе микрообучения</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                    <div className="text-center">
                                        <Calendar className="w-5 h-5 inline-block mr-2" />
                                        {new Date(certificate.issuedAt).toLocaleDateString('ru-RU')}
                                    </div>
                                    <div className="text-center">
                                        <Clock className="w-5 h-5 inline-block mr-2" />
                                        {course.duration}
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <div className="text-left">
                                            <p className="text-sm text-gray-500">Уникальный код:</p>
                                            <p className="font-mono text-sm text-gray-700">{certificate.uniqueCode}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">Выдано:</p>
                                            <p className="text-sm font-medium">LMS Platform</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Actions and Info */}
                    <div className="space-y-6">
                        {/* Actions */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Действия с сертификатом</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={handleGeneratePDF}
                                    disabled={isGeneratingPDF}
                                    className="btn btn-primary flex items-center justify-center gap-2"
                                >
                                    {isGeneratingPDF ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Download className="w-5 h-5" />
                                            Скачать PDF
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleShareCertificate}
                                    disabled={isSharing}
                                    className="btn btn-outline flex items-center justify-center gap-2"
                                >
                                    {isSharing ? (
                                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Share2 className="w-5 h-5" />
                                            Поделиться
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => window.print()}
                                    className="btn btn-outline flex items-center justify-center gap-2"
                                >
                                    <Printer className="w-5 h-5" />
                                    Распечатать
                                </button>

                                <button
                                    onClick={() => navigate('/portfolio')}
                                    className="btn btn-outline flex items-center justify-center gap-2"
                                >
                                    <Award className="w-5 h-5" />
                                    В портфолио
                                </button>
                            </div>
                        </div>

                        {/* Course Summary */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Итоги курса</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <BookOpen className="w-5 h-5 text-purple-600" />
                                        <span className="font-medium">Курс:</span>
                                    </div>
                                    <span className="font-medium">{course.title}</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-purple-600" />
                                        <span className="font-medium">Дата завершения:</span>
                                    </div>
                                    <span>{new Date(certificate.issuedAt).toLocaleDateString('ru-RU')}</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-5 h-5 text-purple-600" />
                                        <span className="font-medium">Продолжительность:</span>
                                    </div>
                                    <span>{course.duration}</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <User className="w-5 h-5 text-purple-600" />
                                        <span className="font-medium">Сертификат №:</span>
                                    </div>
                                    <span className="font-mono text-sm">{certificate.uniqueCode}</span>
                                </div>
                            </div>
                        </div>

                        {/* Next Steps */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100 p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Что дальше?</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('/courses')}
                                    className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-300 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <BookOpen className="w-5 h-5 text-purple-600" />
                                        <span>Найти новый курс</span>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-purple-400" />
                                </button>

                                <button
                                    onClick={() => navigate('/portfolio')}
                                    className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-300 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Award className="w-5 h-5 text-purple-600" />
                                        <span>Посмотреть все сертификаты</span>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-purple-400" />
                                </button>

                                <button
                                    onClick={() => navigate('/')}
                                    className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-300 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Home className="w-5 h-5 text-purple-600" />
                                        <span>Вернуться на главную</span>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-purple-400" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Share on Social */}
                <div className="mt-8 text-center">
                    <p className="text-gray-600 mb-4">Поделитесь своим достижением:</p>
                    <div className="flex justify-center gap-4">
                        <button className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200">
                            📘
                        </button>
                        <button className="w-10 h-10 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center hover:bg-blue-100">
                            🐦
                        </button>
                        <button className="w-10 h-10 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center hover:bg-pink-200">
                            💼
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}