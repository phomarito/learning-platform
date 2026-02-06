import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { coursesAPI, uploadAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  BookOpen, 
  Calendar, 
  FileText,
  Eye,
  EyeOff,
  Image as ImageIcon,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

const CATEGORIES = [
  'Менеджмент',
  'Продукт',
  'Soft Skills',
  'Технологии',
  'Маркетинг',
  'Дизайн',
  'Бизнес',
  'Личностный рост'
];

const DURATION_OPTIONS = [
  '30 мин',
  '1 час',
  '2 часа',
  '4 часа',
  '8 часов',
  '16 часов',
  '24 часа',
  'Недельный курс'
];

export default function CourseCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { courseId } = useParams();
  const isEditMode = !!courseId;

  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    category: 'Менеджмент',
    duration: '1 час',
    icon: '🎓',
    coverImage: '',
    isPublished: false
  });

  const [iconOptions] = useState([
    '🎓', '💼', '📚', '💻', '🎨', '📊', '🎯', '🚀', '🌟', '🔥'
  ]);

  // DropZone для загрузки изображений
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    console.log('File selected:', file.name, file.size, file.type);

    // Проверка размера файла
    if (file.size > 5 * 1024 * 1024) {
        console.log('File too large:', file.size);
        setErrors(prev => ({
            ...prev,
            coverImage: 'Файл слишком большой. Максимальный размер: 5MB'
        }));
        return;
    }

    try {
        setUploading(true);
        setErrors(prev => ({ ...prev, coverImage: '' }));

        // Создаем FormData
        const formData = new FormData();
        formData.append('file', file);
        console.log('FormData created, sending to server...');

        // Загружаем на сервер
        const response = await uploadAPI.uploadCourseImage(formData);
        console.log('Server response:', response.data);
        
        if (response.data.success) {
            const imageUrl = `http://localhost:3000${response.data.data.url}`;
            console.log('Image URL from server:', imageUrl);
            
            // Сохраняем URL от сервера
            setCourseData(prev => ({
                ...prev,
                coverImage: imageUrl + '?t=' + Date.now() // Добавляем timestamp для избежания кэширования
            }));
            
            console.log('Course data updated with image URL');
        } else {
            throw new Error('Ошибка загрузки файла');
        }
    } catch (error) {
        console.error('Full error uploading image:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        
        // Fallback: создаем временное превью
        console.log('Creating fallback preview...');
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Image = reader.result;
            console.log('Fallback base64 created, length:', base64Image.length);
            setCourseData(prev => ({
                ...prev,
                coverImage: base64Image
            }));
        };
        reader.readAsDataURL(file);
        
        setErrors(prev => ({
            ...prev,
            coverImage: error.response?.data?.message || 'Ошибка загрузки. Используется временное изображение.'
        }));
    } finally {
        setUploading(false);
    }
}, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: uploading
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
        // Валидация
        const validationErrors = {};
        if (!courseData.title.trim()) validationErrors.title = 'Название обязательно';
        if (!courseData.category.trim()) validationErrors.category = 'Категория обязательна';
        if (!courseData.description.trim()) validationErrors.description = 'Описание обязательно';
        if (courseData.description.length < 50) validationErrors.description = 'Описание должно быть не менее 50 символов';

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setIsLoading(false);
            return;
        }

        // Подготовка данных для отправки
        const dataToSend = {
            title: courseData.title,
            description: courseData.description,
            category: courseData.category,
            duration: courseData.duration,
            icon: courseData.icon,
            isPublished: courseData.isPublished
        };

        // Если обложка - это base64 (временный превью), убираем его
        if (courseData.coverImage && courseData.coverImage.startsWith('data:image')) {
            console.log('Cover image is base64, not sending in request');
            // dataToSend.coverImage = null; // или оставить пустым
        } else if (courseData.coverImage) {
            // Если это URL от сервера, отправляем
            dataToSend.coverImage = courseData.coverImage;
        }

        console.log('Sending data:', dataToSend);

        let response;
        if (isEditMode) {
            // Обновление курса
            response = await coursesAPI.update(courseId, dataToSend);
        } else {
            // Создание нового курса
            response = await coursesAPI.create(dataToSend);
        }

        if (response.data.success) {
            const createdCourseId = response.data.data.id;
            navigate(`/courses/${createdCourseId}/edit`);
        }

    } catch (error) {
        console.error('Error saving course:', error);
        console.error('Error response:', error.response?.data);
        const errorMsg = error.response?.data?.message || 'Ошибка при сохранении курса';
        alert(errorMsg);
    } finally {
        setIsLoading(false);
    }
};

  const handleChange = (field, value) => {
    setCourseData(prev => ({
      ...prev,
      [field]: value
    }));
    // Очищаем ошибку для поля при изменении
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Назад
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditMode ? 'Редактирование курса' : 'Создание нового курса'}
              </h1>
              <p className="text-gray-600">
                {user?.role === 'ADMIN' ? 'Администратор' : 'Преподаватель'}: {user?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={courseData.isPublished}
                  onChange={(e) => handleChange('isPublished', e.target.checked)}
                  className="sr-only"
                />
                <div className={`
                  w-12 h-6 rounded-full transition-colors
                  ${courseData.isPublished ? 'bg-primary' : 'bg-gray-300'}
                `}>
                  <div className={`
                    absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                    ${courseData.isPublished ? 'translate-x-7' : 'translate-x-1'}
                  `} />
                </div>
              </div>
              <span className="text-sm text-gray-600">
                {courseData.isPublished ? 'Опубликован' : 'Черновик'}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Основная информация */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Основная информация
            </h2>

            <div className="space-y-6">
              {/* Название */}
              <div>
                <label className="label">Название курса *</label>
                <input
                  type="text"
                  value={courseData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className={`input ${errors.title ? 'border-red-500' : ''}`}
                  placeholder="Введите название курса"
                  maxLength={100}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
                <div className="mt-1 text-sm text-gray-500">
                  {courseData.title.length}/100 символов
                </div>
              </div>

              {/* Описание */}
              <div>
                <label className="label">Описание курса *</label>
                <textarea
                  value={courseData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className={`input min-h-[120px] resize-y ${errors.description ? 'border-red-500' : ''}`}
                  placeholder="Опишите содержание курса, цели обучения и требования к студентам..."
                  rows={4}
                  maxLength={2000}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
                <div className="mt-1 text-sm text-gray-500">
                  {courseData.description.length}/2000 символов
                </div>
              </div>
            </div>
          </div>

          {/* Детали курса */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Детали курса
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Категория */}
              <div>
                <label className="label">Категория *</label>
                <select
                  value={courseData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className={`input ${errors.category ? 'border-red-500' : ''}`}
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>

              {/* Длительность */}
              <div>
                <label className="label">Длительность</label>
                <select
                  value={courseData.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  className="input"
                >
                  {DURATION_OPTIONS.map(duration => (
                    <option key={duration} value={duration}>{duration}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Визуальное оформление */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Визуальное оформление
            </h2>

            <div className="space-y-6">
              {/* Иконка курса */}
              <div>
                <label className="label">Иконка курса</label>
                <div className="flex flex-wrap gap-3 mb-4">
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => handleChange('icon', icon)}
                      className={`
                        w-12 h-12 text-2xl rounded-lg flex items-center justify-center
                        transition-all hover:scale-105
                        ${courseData.icon === icon
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                        }
                      `}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  Выберите эмодзи, который будет представлять ваш курс
                </p>
              </div>

              {/* Обложка с DropZone */}
              <div>
                <label className="label">Обложка курса</label>
                
                {/* Информация о загрузке */}
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-blue-800 font-medium">Рекомендации по обложке:</p>
                      <ul className="text-sm text-blue-700 mt-1 space-y-1">
                        <li>• Форматы: JPEG, PNG, GIF, WebP</li>
                        <li>• Максимальный размер: 5MB</li>
                        <li>• Рекомендуемые размеры: 1200×630px</li>
                        <li>• Соотношение сторон: 16:9</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* DropZone */}
                {courseData.coverImage ? (
                  <div className="relative group">
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={courseData.coverImage}
                        alt="Обложка курса"
                        className="w-full h-64 object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg">
                      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleChange('coverImage', '')}
                          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                          title="Удалить"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-medium">Нажмите для замены</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    {...getRootProps()}
                    className={`
                      border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                      transition-all duration-200
                      ${isDragActive 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                      }
                      ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <input {...getInputProps()} />
                    
                    {uploading ? (
                      <div className="space-y-3">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-gray-600 font-medium">Загрузка...</p>
                      </div>
                    ) : isDragActive ? (
                      <div className="space-y-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                          <Check className="w-6 h-6 text-primary" />
                        </div>
                        <p className="text-primary font-medium">Отпустите для загрузки</p>
                        <p className="text-sm text-gray-500">Изображение будет загружено</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                          <Upload className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-600 font-medium">
                            Перетащите изображение сюда
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            или нажмите для выбора файла
                          </p>
                        </div>
                        <div className="text-xs text-gray-400">
                          Поддерживаются: JPEG, PNG, GIF, WebP
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Ошибка загрузки */}
                {errors.coverImage && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-sm">{errors.coverImage}</p>
                    </div>
                  </div>
                )}

                {/* Статус загрузки */}
                {uploading && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Загрузка...</span>
                      <span>50%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: '50%' }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Предпросмотр */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Предпросмотр карточки курса
            </h2>

            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-br from-primary/10 to-purple-100 rounded-xl border border-gray-200 p-6 shadow-sm">
                {/* Обложка */}
                {courseData.coverImage && (
                  <div className="h-40 rounded-lg overflow-hidden mb-4 border border-gray-200">
                    <img
                      src={courseData.coverImage}
                      alt="Предпросмотр обложки"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Иконка и название */}
                <div className="flex items-start gap-4">
                  <div className={`
                    w-16 h-16 rounded-xl flex items-center justify-center text-3xl
                    bg-gradient-to-br from-primary to-purple-600 text-white shadow-sm
                  `}>
                    {courseData.icon || '🎓'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-900">
                      {courseData.title || 'Название курса'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {courseData.category}
                    </p>
                  </div>
                </div>

                {/* Описание */}
                {courseData.description && (
                  <div className="mt-4">
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {courseData.description}
                    </p>
                  </div>
                )}

                {/* Детали */}
                <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {courseData.duration}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    courseData.isPublished
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {courseData.isPublished ? 'Опубликован' : 'Черновик'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline"
              disabled={isLoading || uploading}
            >
              Отмена
            </button>

            <div className="flex gap-3">
              {isEditMode ? (
                <button
                  type="button"
                  onClick={() => navigate(`/courses/${courseId}`)}
                  className="btn btn-outline flex items-center gap-2"
                  disabled={uploading}
                >
                  <Eye className="w-4 h-4" />
                  Просмотр
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  handleChange('isPublished', false);
                  handleSubmit(e);
                }}
                className="btn btn-outline flex items-center gap-2"
                disabled={isLoading || uploading}
              >
                <Save className="w-4 h-4" />
                Сохранить как черновик
              </button>

              <button
                type="submit"
                className="btn btn-primary flex items-center gap-2"
                disabled={isLoading || uploading}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {courseData.isPublished ? 'Опубликовать курс' : 'Сохранить и продолжить'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}