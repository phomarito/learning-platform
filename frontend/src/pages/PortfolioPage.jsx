import { useState, useEffect } from 'react';
import { coursesAPI, portfolioAPI } from '../api/client';
import CourseCard from '../components/courses/CourseCard';
import { 
  Award, 
  BookOpen, 
  Star, 
  TrendingUp, 
  Users, 
  Calendar,
  FileText,
  ExternalLink
} from 'lucide-react';

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      setIsLoading(true);
      
      // Получаем данные портфолио
      const portfolioResponse = await portfolioAPI.get();
      setPortfolio(portfolioResponse.data.data);
      
      // Получаем рекомендуемые курсы
      const coursesResponse = await coursesAPI.getAll({ 
        limit: 3,
        sort: 'popular'
      });
      setFeaturedCourses(coursesResponse.data.data);
      
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Обзор', icon: BookOpen },
    { id: 'skills', label: 'Навыки', icon: Award },
    { id: 'certificates', label: 'Сертификаты', icon: FileText },
    { id: 'activity', label: 'Активность', icon: TrendingUp },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Portfolio Header */}
      <div className="bg-gradient-to-r from-primary to-purple-700 rounded-2xl text-white p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold">Моё портфолио</h1>
            <p className="text-purple-100 mt-2">
              Здесь собраны все ваши достижения и результаты обучения
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{portfolio?.stats?.totalCourses || 5}</div>
              <div className="text-sm text-purple-200">Курсов</div>
            </div>
            <div className="h-8 w-px bg-purple-400" />
            <div className="text-center">
              <div className="text-2xl font-bold">{portfolio?.stats?.hoursSpent || 12}ч</div>
              <div className="text-sm text-purple-200">Часов</div>
            </div>
            <div className="h-8 w-px bg-purple-400" />
            <div className="text-center">
              <div className="text-2xl font-bold">{portfolio?.stats?.certificates || 2}</div>
              <div className="text-sm text-purple-200">Сертификатов</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-1 py-3 text-sm font-medium whitespace-nowrap
                border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Обо мне</h2>
                <p className="text-gray-600">
                  {portfolio?.bio || 'Расскажите о себе, своих целях и достижениях в обучении.'}
                </p>
                
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {portfolio?.stats?.completionRate || 40}%
                    </div>
                    <div className="text-sm text-gray-500">Завершение</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {portfolio?.stats?.avgScore || 5.0}
                    </div>
                    <div className="text-sm text-gray-500">Средний балл</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {portfolio?.stats?.streak || 4}
                    </div>
                    <div className="text-sm text-gray-500">Дней подряд</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {portfolio?.stats?.level || 2}
                    </div>
                    <div className="text-sm text-gray-500">Уровень</div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              {/* <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Последняя активность</h2>
                <div className="space-y-3">
                  {portfolio?.recentActivity?.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center
                        ${activity.type === 'course_completed' ? 'bg-green-100 text-green-600' : ''}
                        ${activity.type === 'lesson_completed' ? 'bg-blue-100 text-blue-600' : ''}
                        ${activity.type === 'certificate_earned' ? 'bg-purple-100 text-purple-600' : ''}
                      `}>
                        {activity.type === 'course_completed' && <Award className="w-4 h-4" />}
                        {activity.type === 'lesson_completed' && <BookOpen className="w-4 h-4" />}
                        {activity.type === 'certificate_earned' && <Star className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(activity.date).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-4">Активность пока отсутствует</p>
                  )}
                </div>
              </div> */}
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Мои навыки</h2>
              <div className="space-y-4">
                {portfolio?.skills?.map((skill, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-900">{skill.name}</span>
                      <span className="text-sm text-gray-500">{skill.level}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-8">Навыки пока не добавлены</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'certificates' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Сертификаты</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portfolio?.certificates?.map((cert, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{cert.courseName}</h3>
                        <p className="text-sm text-gray-500">{cert.issuedBy}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Выдан: {new Date(cert.date).toLocaleDateString('ru-RU')}</p>
                    <button className="text-primary text-sm font-medium hover:underline">
                      Просмотреть сертификат
                    </button>
                  </div>
                )) || (
                  <div className="col-span-2 text-center py-8">
                    <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Сертификаты пока не получены</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Детальная активность</h2>
              <div className="space-y-6">
                {portfolio?.detailedActivity?.map((month, index) => (
                  <div key={index}>
                    <h3 className="font-medium text-gray-700 mb-3">{month.month}</h3>
                    <div className="space-y-2">
                      {month.activities.map((activity, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center
                            ${activity.type === 'study' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}
                          `}>
                            {activity.type === 'study' ? (
                              <BookOpen className="w-4 h-4" />
                            ) : (
                              <TrendingUp className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{activity.description}</p>
                            <p className="text-xs text-gray-500">{activity.duration}</p>
                          </div>
                          <span className="text-sm text-gray-500">{activity.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-8">Детальная активность пока не доступна</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Featured Courses */}
          {/* <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Рекомендуемые курсы</h2>
            <div className="space-y-4">
              {featuredCourses.map(course => (
                <div key={course.id} className="p-3 border border-gray-100 rounded-lg hover:border-primary transition-colors">
                  <h3 className="font-medium text-gray-900 mb-1">{course.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">{course.category}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      <Users className="w-3 h-3 inline mr-1" />
                      {course.enrolledCount || 0}
                    </span>
                    <button className="text-primary text-sm font-medium hover:underline">
                      Подробнее
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div> */}

          {/* Share Portfolio */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
            <h3 className="font-bold text-gray-900 mb-2">Поделиться портфолио</h3>
            <p className="text-sm text-gray-600 mb-4">
              Покажите свои достижения работодателям или коллегам
            </p>
            <button className="w-full btn btn-primary">
              Сгенерировать публичную ссылку
            </button>
          </div>

          {/* Goals */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Мои цели</h3>
            <div className="space-y-3">
              {portfolio?.goals?.map((goal, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={goal.completed}
                    className="w-4 h-4 text-primary rounded"
                    readOnly
                  />
                  <div className="flex-1">
                    <p className={`text-sm ${goal.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {goal.title}
                    </p>
                    {goal.deadline && (
                      <p className="text-xs text-gray-500">
                        до {new Date(goal.deadline).toLocaleDateString('ru-RU')}
                      </p>
                    )}
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-sm">Цели пока не установлены</p>
              )}
            </div>
            <button className="w-full mt-4 text-primary text-sm font-medium hover:underline">
              + Добавить новую цель
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}