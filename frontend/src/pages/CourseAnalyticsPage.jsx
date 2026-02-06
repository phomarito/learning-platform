import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { coursesAPI } from '../api/client';
import {
    ArrowLeft,
    Users,
    TrendingUp,
    Clock,
    CheckCircle,
    Target,
    BarChart3,
    Download,
    Calendar,
    Award,
    PieChart,
    Activity
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts';

export default function CourseAnalyticsPage() {
    const { id } = useParams();
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('week');

    useEffect(() => {
        fetchAnalytics();
    }, [id, timeRange]);

    const fetchAnalytics = async () => {
        try {
            setIsLoading(true);
            const response = await coursesAPI.getAnalytics(id, { timeRange });
            setAnalytics(response.data.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const exportData = () => {
        // In real app, this would download a CSV/Excel file
        const dataStr = JSON.stringify(analytics, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `course-analytics-${id}-${new Date().toISOString()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="text-center py-16">
                <p className="text-gray-600">Аналитика недоступна</p>
                <Link to={`/courses/${id}`} className="btn btn-primary mt-4">
                    Вернуться к курсу
                </Link>
            </div>
        );
    }

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Link 
                        to={`/courses/${id}`}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Назад к курсу
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Аналитика курса: <span className="text-primary">{analytics.course.title}</span>
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="input input-sm"
                    >
                        <option value="week">За неделю</option>
                        <option value="month">За месяц</option>
                        <option value="quarter">За квартал</option>
                        <option value="year">За год</option>
                    </select>
                    
                    <button
                        onClick={exportData}
                        className="btn btn-outline btn-sm"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Экспорт
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-sm text-gray-500">Всего</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                        {analytics.totalStudents}
                    </div>
                    <div className="text-sm text-gray-600">Студентов записалось</div>
                    <div className="mt-2 flex items-center text-green-600 text-sm">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span>+{analytics.newStudentsThisWeek} на этой неделе</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-sm text-gray-500">Процент</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                        {analytics.completionRate}%
                    </div>
                    <div className="text-sm text-gray-600">Завершили курс</div>
                    <div className="mt-4">
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div 
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${analytics.completionRate}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-6 h-6 text-purple-600" />
                        </div>
                        <span className="text-sm text-gray-500">Среднее</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                        {analytics.avgTimeToComplete}
                    </div>
                    <div className="text-sm text-gray-600">Время на курс</div>
                    <div className="mt-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {analytics.avgLessonsPerDay} уроков/день
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Award className="w-6 h-6 text-orange-600" />
                        </div>
                        <span className="text-sm text-gray-500">Выдано</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                        {analytics.certificatesIssued}
                    </div>
                    <div className="text-sm text-gray-600">Сертификатов</div>
                    <div className="mt-2 flex items-center text-blue-600 text-sm">
                        <Target className="w-4 h-4 mr-1" />
                        <span>{analytics.certificateRate}% студентов</span>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Enrollment Chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900">
                            <Users className="w-5 h-5 inline mr-2" />
                            Динамика записей
                        </h2>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics.enrollmentTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="date" 
                                    tickFormatter={(date) => new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                                />
                                <YAxis />
                                <Tooltip 
                                    formatter={(value) => [`${value} студентов`, 'Записи']}
                                    labelFormatter={(label) => `Дата: ${new Date(label).toLocaleDateString('ru-RU')}`}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="count" 
                                    stroke="#0088FE" 
                                    strokeWidth={2}
                                    dot={{ stroke: '#0088FE', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Lesson Completion Chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900">
                            <BarChart3 className="w-5 h-5 inline mr-2" />
                            Прогресс по урокам
                        </h2>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.lessonCompletion}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis 
                                    dataKey="lesson" 
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis />
                                <Tooltip 
                                    formatter={(value) => [`${value} студентов`, 'Завершили']}
                                />
                                <Bar 
                                    dataKey="completed" 
                                    fill="#00C49F" 
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Student Distribution */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900">
                            <PieChart className="w-5 h-5 inline mr-2" />
                            Распределение студентов
                        </h2>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                                <Pie
                                    data={analytics.studentDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {analytics.studentDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${value} студентов`, name]} />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Activity Timeline */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900">
                            <Activity className="w-5 h-5 inline mr-2" />
                            Активность студентов
                        </h2>
                    </div>
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                        {analytics.recentActivities.map((activity, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                                <div className={`w-2 h-2 mt-2 rounded-full ${
                                    activity.type === 'enrollment' ? 'bg-blue-500' :
                                    activity.type === 'completion' ? 'bg-green-500' :
                                    'bg-purple-500'
                                }`} />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{activity.studentName}</p>
                                    <p className="text-sm text-gray-600">{activity.description}</p>
                                </div>
                                <div className="text-sm text-gray-500 whitespace-nowrap">
                                    {new Date(activity.timestamp).toLocaleTimeString('ru-RU', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Students */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Топ студентов</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-gray-500 text-sm border-b border-gray-100">
                                <th className="pb-3 px-4">Студент</th>
                                <th className="pb-3 px-4">Прогресс</th>
                                <th className="pb-3 px-4">Время</th>
                                <th className="pb-3 px-4">Тесты</th>
                                <th className="pb-3 px-4">Завершил</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analytics.topStudents.map((student, index) => (
                                <tr key={student.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-medium">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{student.name}</p>
                                                <p className="text-sm text-gray-500">{student.email}</p>
                                            </div>
                                            {index < 3 && (
                                                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                                    Топ {index + 1}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div 
                                                className="bg-primary h-2 rounded-full"
                                                style={{ width: `${student.progress}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-gray-600">{student.progress}%</span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <Clock className="w-4 h-4" />
                                            <span>{student.timeSpent}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                                            student.quizScore >= 80 ? 'bg-green-100 text-green-800' :
                                            student.quizScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {student.quizScore}%
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        {student.completedAt ? (
                                            <span className="text-green-600 font-medium">
                                                {new Date(student.completedAt).toLocaleDateString('ru-RU')}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">В процессе</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}