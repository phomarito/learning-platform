import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lessonsAPI, progressAPI } from '../api/client';
import ReactPlayer from 'react-player';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    BookOpen,
    MessageCircle
} from 'lucide-react';

export default function LessonPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lesson, setLesson] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCompleting, setIsCompleting] = useState(false);
    const [courseCompleted, setCourseCompleted] = useState(false);

    useEffect(() => {
        fetchLesson();
    }, [id]);

    const fetchLesson = async () => {
        try {
            setIsLoading(true);
            const response = await lessonsAPI.getById(id);
            setLesson(response.data.data);
        } catch (error) {
            console.error('Error fetching lesson:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleComplete = async () => {
        try {
            setIsCompleting(true);
            
            // Отмечаем урок как завершенный
            const response = await progressAPI.update(id, { completed: true });
            
            // Проверяем, завершен ли весь курс
            if (response.data.data.courseProgress.percentage === 100) {
                setCourseCompleted(true);
                // Если курс завершен, переходим на страницу завершения
                setTimeout(() => {
                    navigate(`/courses/${lesson.course.id}/completed`, {
                        state: {
                            certificate: response.data.data.certificate,
                            course: lesson.course
                        }
                    });
                }, 1500);
                return;
            }

            // Если есть следующий урок, переходим к нему
            if (lesson.navigation?.next) {
                navigate(`/lessons/${lesson.navigation.next.id}`);
            } else {
                // Последний урок, но курс еще не завершен (мало уроков)
                navigate(`/courses/${lesson.course.id}`);
            }
        } catch (error) {
            console.error('Error completing lesson:', error);
        } finally {
            setIsCompleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Урок не найден</p>
                    <button onClick={() => navigate('/courses')} className="btn btn-primary">
                        Вернуться к курсам
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex flex-col bg-white">
            {/* Уведомление о завершении курса */}
            {courseCompleted && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-8 max-w-md mx-4 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Курс завершен! 🎉</h3>
                        <p className="text-gray-600 mb-4">
                            Поздравляем! Вы успешно завершили курс "{lesson.course.title}"
                        </p>
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="flex items-center justify-between h-16 px-4 md:px-8 border-b border-gray-200 bg-white z-10">
                <button
                    onClick={() => navigate(`/courses/${lesson.course.id}`)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="hidden sm:inline">{lesson.course.title}</span>
                </button>

                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        Урок {lesson.navigation?.current} из {lesson.navigation?.total}
                    </p>
                    <p className="font-medium text-gray-900 truncate max-w-xs">{lesson.title}</p>
                </div>

                <div className="w-20" />
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto bg-gray-50">
                <div className="max-w-4xl mx-auto p-4 md:p-8">
                    {/* Video Content */}
                    {lesson.type === 'VIDEO' && (
                        <div className="space-y-8">
                            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
                                {lesson.videoUrl ? (
                                    <ReactPlayer
                                        url={lesson.videoUrl}
                                        width="100%"
                                        height="100%"
                                        controls
                                        playing={false}
                                        onEnded={() => {
                                            // Автоматически отмечаем как просмотренное при завершении видео
                                            if (!lesson.completed) {
                                                // Можно добавить авто-завершение
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
                                        <p>Видео недоступно</p>
                                    </div>
                                )}
                            </div>

                            {lesson.content && (
                                <div className="bg-white p-6 rounded-xl border border-gray-200">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Описание урока</h2>
                                    <div
                                        className="prose prose-lg max-w-none"
                                        dangerouslySetInnerHTML={{ __html: lesson.content }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Text Content */}
                    {lesson.type === 'TEXT' && (
                        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                            <div
                                className="prose prose-lg prose-purple max-w-none"
                                dangerouslySetInnerHTML={{ __html: lesson.content }}
                            />
                        </div>
                    )}

                    {/* Quiz Content */}
                    {lesson.type === 'QUIZ' && (
                        <QuizContent 
                            lesson={lesson} 
                            onComplete={handleComplete} 
                            isCompleting={isCompleting}
                        />
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="flex items-center justify-between h-20 px-4 md:px-8 border-t border-gray-200 bg-white">
                <button
                    onClick={() => lesson.navigation?.prev && navigate(`/lessons/${lesson.navigation.prev.id}`)}
                    disabled={!lesson.navigation?.prev || isCompleting}
                    className="btn btn-outline disabled:opacity-50"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Назад
                </button>

                <div className="flex items-center gap-4">
                    {!lesson.completed && lesson.type !== 'QUIZ' && (
                        <button
                            onClick={handleComplete}
                            disabled={isCompleting}
                            className="btn btn-primary"
                        >
                            {isCompleting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Завершить урок
                                </>
                            )}
                        </button>
                    )}

                    {lesson.completed && (
                        <span className="flex items-center gap-2 text-green-600 font-medium">
                            <CheckCircle className="w-5 h-5" />
                            Завершено
                        </span>
                    )}
                </div>

                <button
                    onClick={() => lesson.navigation?.next && navigate(`/lessons/${lesson.navigation.next.id}`)}
                    disabled={!lesson.navigation?.next || isCompleting}
                    className="btn btn-outline disabled:opacity-50"
                >
                    Далее
                    <ArrowRight className="w-5 h-5 ml-2" />
                </button>
            </footer>
        </div>
    );
}

// Quiz Component
function QuizContent({ lesson, onComplete, isCompleting }) {
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(null);
    const [showingAnswers, setShowingAnswers] = useState(false);

    let quizData;
    try {
        quizData = typeof lesson.quizData === 'string'
            ? JSON.parse(lesson.quizData)
            : lesson.quizData;
    } catch {
        quizData = { questions: [] };
    }

    const handleSubmit = async () => {
        let correct = 0;
        const results = [];
        
        quizData.questions.forEach((q, index) => {
            const isCorrect = answers[index] === q.correctAnswer;
            if (isCorrect) correct++;
            results.push({
                question: q.question,
                userAnswer: answers[index],
                correctAnswer: q.correctAnswer,
                isCorrect
            });
        });

        const percentage = Math.round((correct / quizData.questions.length) * 100);
        setScore(percentage);
        setSubmitted(true);

        // Отправляем результат на сервер
        try {
            await progressAPI.update(lesson.id, { 
                completed: percentage >= 70,
                quizScore: percentage 
            });
        } catch (error) {
            console.error('Error saving quiz results:', error);
        }
    };

    const handleContinue = () => {
        if (score >= 70) {
            onComplete();
        } else {
            setShowingAnswers(true);
        }
    };

    return (
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Проверка знаний</h2>

            {submitted ? (
                <div className="space-y-6">
                    <div className="text-center py-4">
                        <div className={`
                            w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold
                            ${score >= 70 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
                        `}>
                            {score}%
                        </div>
                        <h3 className={`text-xl font-bold mb-2 ${score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                            {score >= 70 ? 'Отлично! Тест пройден' : 'Необходимо набрать 70%'}
                        </h3>
                        <p className="text-gray-600">
                            Правильных ответов: {score / 100 * quizData.questions.length} из {quizData.questions.length}
                        </p>
                    </div>

                    {showingAnswers && (
                        <div className="space-y-4 mt-6">
                            <h4 className="font-bold text-gray-900">Правильные ответы:</h4>
                            {quizData.questions.map((q, index) => (
                                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                                    <p className="font-medium mb-2">{q.question}</p>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Правильный ответ: </span>
                                        {q.options[q.correctAnswer]}
                                    </p>
                                    {q.explanation && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            <span className="font-medium">Объяснение: </span>
                                            {q.explanation}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-3">
                        {score < 70 && !showingAnswers && (
                            <button
                                onClick={() => setShowingAnswers(true)}
                                className="btn btn-outline flex-1"
                            >
                                Посмотреть ответы
                            </button>
                        )}
                        <button
                            onClick={handleContinue}
                            disabled={isCompleting}
                            className={`btn ${score >= 70 ? 'btn-primary' : 'btn-outline'} flex-1`}
                        >
                            {isCompleting ? (
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : score >= 70 ? (
                                'Продолжить'
                            ) : (
                                'Попробовать снова'
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {quizData.questions?.map((question, qIndex) => (
                        <div key={qIndex} className="bg-gray-50 p-6 rounded-lg">
                            <p className="font-medium text-gray-900 mb-4">
                                {qIndex + 1}. {question.question}
                            </p>
                            <div className="space-y-3">
                                {question.options?.map((option, oIndex) => (
                                    <label
                                        key={oIndex}
                                        className={`
                                            flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors
                                            ${answers[qIndex] === oIndex
                                                ? 'bg-primary-50 border-primary'
                                                : 'bg-white border-gray-200 hover:border-primary'
                                            }
                                        `}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${qIndex}`}
                                            checked={answers[qIndex] === oIndex}
                                            onChange={() => setAnswers(prev => ({ ...prev, [qIndex]: oIndex }))}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={handleSubmit}
                        disabled={Object.keys(answers).length !== quizData.questions?.length}
                        className="btn btn-primary w-full"
                    >
                        Отправить ответы
                    </button>
                </div>
            )}
        </div>
    );
}