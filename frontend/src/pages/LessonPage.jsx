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
            await progressAPI.update(id, { completed: true });

            // If there's a next lesson, go to it
            if (lesson.navigation?.next) {
                navigate(`/lessons/${lesson.navigation.next.id}`);
            } else {
                // Course completed, go to completion page
                navigate(`/courses/${lesson.course.id}/completed`);
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
                        <QuizContent lesson={lesson} onComplete={handleComplete} />
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="flex items-center justify-between h-20 px-4 md:px-8 border-t border-gray-200 bg-white">
                <button
                    onClick={() => lesson.navigation?.prev && navigate(`/lessons/${lesson.navigation.prev.id}`)}
                    disabled={!lesson.navigation?.prev}
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
                    disabled={!lesson.navigation?.next}
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
function QuizContent({ lesson, onComplete }) {
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(null);

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
        quizData.questions.forEach(q => {
            if (answers[q.id] === q.correctIndex) {
                correct++;
            }
        });

        const percentage = Math.round((correct / quizData.questions.length) * 100);
        setScore(percentage);
        setSubmitted(true);

        // If passed, complete the lesson
        if (percentage >= 70) {
            setTimeout(() => onComplete(), 2000);
        }
    };

    return (
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Проверка знаний</h2>

            {submitted ? (
                <div className="text-center py-8">
                    <div className={`
            w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold
            ${score >= 70 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
          `}>
                        {score}%
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                        {score >= 70 ? 'Отлично! Тест пройден' : 'Попробуйте ещё раз'}
                    </h3>
                    {score < 70 && (
                        <button
                            onClick={() => {
                                setSubmitted(false);
                                setAnswers({});
                            }}
                            className="btn btn-primary mt-4"
                        >
                            Пройти заново
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {quizData.questions?.map((question, qIndex) => (
                        <div key={question.id} className="bg-gray-50 p-6 rounded-lg">
                            <p className="font-medium text-gray-900 mb-4">
                                {qIndex + 1}. {question.text}
                            </p>
                            <div className="space-y-3">
                                {question.options?.map((option, oIndex) => (
                                    <label
                                        key={oIndex}
                                        className={`
                      flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors
                      ${answers[question.id] === oIndex
                                                ? 'bg-primary-50 border-primary'
                                                : 'bg-white border-gray-200 hover:border-primary'
                                            }
                    `}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${question.id}`}
                                            checked={answers[question.id] === oIndex}
                                            onChange={() => setAnswers(prev => ({ ...prev, [question.id]: oIndex }))}
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
