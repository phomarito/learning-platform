import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { 
    Save, 
    X, 
    Plus, 
    Video, 
    FileText, 
    Image, 
    File, 
    HelpCircle, 
    BarChart3,
    Trash2,
    Upload,
    ArrowUp,
    ArrowDown,
    Link as LinkIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LessonCreatePage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [lesson, setLesson] = useState({
        title: '',
        description: '',
        contentBlocks: []
    });
    const [isSaving, setIsSaving] = useState(false);
    const [currentBlockType, setCurrentBlockType] = useState('text');
    const [activeBlockIndex, setActiveBlockIndex] = useState(null);

    // Типы контента для добавления
    const contentTypes = [
        { type: 'text', label: 'Текст', icon: FileText, color: 'blue' },
        { type: 'video', label: 'Видео', icon: Video, color: 'red' },
        { type: 'image', label: 'Изображение', icon: Image, color: 'green' },
        { type: 'file', label: 'Файл', icon: File, color: 'purple' },
        { type: 'quiz', label: 'Тест', icon: HelpCircle, color: 'orange' },
        { type: 'presentation', label: 'Презентация', icon: BarChart3, color: 'indigo' },
        { type: 'link', label: 'Ссылка', icon: LinkIcon, color: 'pink' }
    ];

    // Dropzone для файлов
    const onDrop = useCallback((acceptedFiles, blockIndex) => {
        if (blockIndex !== undefined) {
            // Обновляем конкретный блок
            const updatedBlocks = [...lesson.contentBlocks];
            const block = updatedBlocks[blockIndex];
            
            if (block.type === 'image' || block.type === 'file' || block.type === 'presentation') {
                acceptedFiles.forEach(file => {
                    // В реальном приложении здесь будет загрузка на сервер
                    const fileData = {
                        id: Date.now(),
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        url: URL.createObjectURL(file),
                        file: file
                    };
                    
                    if (!block.files) block.files = [];
                    block.files.push(fileData);
                });
                
                setLesson(prev => ({ ...prev, contentBlocks: updatedBlocks }));
                toast.success(`Загружено ${acceptedFiles.length} файл(ов)`);
            }
        }
    }, [lesson.contentBlocks]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (files) => onDrop(files, activeBlockIndex),
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc', '.docx'],
            'application/vnd.ms-powerpoint': ['.ppt', '.pptx'],
            'application/vnd.ms-excel': ['.xls', '.xlsx']
        },
        multiple: true
    });

    const handleAddBlock = (type) => {
        const newBlock = {
            id: Date.now(),
            type: type,
            order: lesson.contentBlocks.length + 1,
            createdAt: new Date().toISOString()
        };

        // Устанавливаем начальные значения в зависимости от типа
        switch (type) {
            case 'text':
                newBlock.content = '';
                newBlock.title = 'Текстовый блок';
                break;
            case 'video':
                newBlock.title = 'Видео блок';
                newBlock.videoUrl = '';
                newBlock.description = '';
                break;
            case 'image':
                newBlock.title = 'Галерея изображений';
                newBlock.description = '';
                newBlock.files = [];
                break;
            case 'file':
                newBlock.title = 'Файлы для скачивания';
                newBlock.description = '';
                newBlock.files = [];
                break;
            case 'quiz':
                newBlock.title = 'Тест';
                newBlock.description = '';
                newBlock.questions = [];
                break;
            case 'presentation':
                newBlock.title = 'Презентация';
                newBlock.description = '';
                newBlock.files = [];
                break;
            case 'link':
                newBlock.title = 'Полезные ссылки';
                newBlock.description = '';
                newBlock.links = [];
                break;
        }

        setLesson(prev => ({
            ...prev,
            contentBlocks: [...prev.contentBlocks, newBlock]
        }));
        setActiveBlockIndex(lesson.contentBlocks.length);
        toast.success(`Добавлен ${contentTypes.find(t => t.type === type)?.label || 'блок'}`);
    };

    const handleUpdateBlock = (index, updates) => {
        const updatedBlocks = [...lesson.contentBlocks];
        updatedBlocks[index] = { ...updatedBlocks[index], ...updates };
        setLesson(prev => ({ ...prev, contentBlocks: updatedBlocks }));
    };

    const handleDeleteBlock = (index) => {
        const updatedBlocks = lesson.contentBlocks.filter((_, i) => i !== index);
        // Обновляем порядок
        updatedBlocks.forEach((block, idx) => {
            block.order = idx + 1;
        });
        setLesson(prev => ({ ...prev, contentBlocks: updatedBlocks }));
        if (activeBlockIndex === index) setActiveBlockIndex(null);
        toast.success('Блок удален');
    };

    const handleMoveBlock = (index, direction) => {
        const updatedBlocks = [...lesson.contentBlocks];
        if (direction === 'up' && index > 0) {
            [updatedBlocks[index], updatedBlocks[index - 1]] = [updatedBlocks[index - 1], updatedBlocks[index]];
        } else if (direction === 'down' && index < updatedBlocks.length - 1) {
            [updatedBlocks[index], updatedBlocks[index + 1]] = [updatedBlocks[index + 1], updatedBlocks[index]];
        }
        // Обновляем порядок
        updatedBlocks.forEach((block, idx) => {
            block.order = idx + 1;
        });
        setLesson(prev => ({ ...prev, contentBlocks: updatedBlocks }));
    };

    const handleAddQuestion = (blockIndex) => {
        const updatedBlocks = [...lesson.contentBlocks];
        const block = updatedBlocks[blockIndex];
        
        if (!block.questions) block.questions = [];
        
        block.questions.push({
            id: Date.now(),
            text: '',
            type: 'single', // 'single' или 'multiple'
            options: [
                { id: 1, text: '', isCorrect: false },
                { id: 2, text: '', isCorrect: false }
            ],
            points: 1
        });
        
        setLesson(prev => ({ ...prev, contentBlocks: updatedBlocks }));
    };

    const handleAddLink = (blockIndex) => {
        const updatedBlocks = [...lesson.contentBlocks];
        const block = updatedBlocks[blockIndex];
        
        if (!block.links) block.links = [];
        
        block.links.push({
            id: Date.now(),
            title: '',
            url: '',
            description: ''
        });
        
        setLesson(prev => ({ ...prev, contentBlocks: updatedBlocks }));
    };

    const handleSaveLesson = async () => {
        if (!lesson.title.trim()) {
            toast.error('Введите название урока');
            return;
        }

        if (lesson.contentBlocks.length === 0) {
            toast.error('Добавьте хотя бы один блок контента');
            return;
        }

        try {
            setIsSaving(true);
            
            // Здесь будет вызов API для создания урока
            // await lessonsAPI.create({ courseId, ...lesson });
            
            toast.success('Урок успешно создан!');
            navigate(`/courses/${courseId}`);
        } catch (error) {
            console.error('Error creating lesson:', error);
            toast.error('Ошибка при сохранении урока');
        } finally {
            setIsSaving(false);
        }
    };

    const renderBlockContent = (block, index) => {
        const isActive = activeBlockIndex === index;
        const ContentTypeIcon = contentTypes.find(t => t.type === block.type)?.icon || FileText;
        const colorClass = `bg-${contentTypes.find(t => t.type === block.type)?.color}-100 text-${contentTypes.find(t => t.type === block.type)?.color}-600`;

        return (
            <div 
                key={block.id} 
                className={`border rounded-xl mb-4 transition-all ${isActive ? 'border-primary border-2' : 'border-gray-200'}`}
                onClick={() => setActiveBlockIndex(index)}
            >
                {/* Block Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                            <ContentTypeIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <input
                                type="text"
                                value={block.title}
                                onChange={(e) => handleUpdateBlock(index, { title: e.target.value })}
                                className="font-bold text-gray-900 bg-transparent border-none focus:outline-none"
                                placeholder="Название блока"
                            />
                            <p className="text-sm text-gray-500">
                                {contentTypes.find(t => t.type === block.type)?.label} • Блок {block.order}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleMoveBlock(index, 'up');
                            }}
                            disabled={index === 0}
                            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                            <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleMoveBlock(index, 'down');
                            }}
                            disabled={index === lesson.contentBlocks.length - 1}
                            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                            <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBlock(index);
                            }}
                            className="p-2 text-red-400 hover:text-red-600"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Block Content */}
                <div className="p-6">
                    {/* Description */}
                    {['video', 'image', 'file', 'quiz', 'presentation', 'link'].includes(block.type) && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Описание блока
                            </label>
                            <textarea
                                value={block.description || ''}
                                onChange={(e) => handleUpdateBlock(index, { description: e.target.value })}
                                className="input w-full"
                                rows="2"
                                placeholder="Опишите что содержится в этом блоке..."
                            />
                        </div>
                    )}

                    {/* Content based on type */}
                    {block.type === 'text' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Текст
                            </label>
                            <textarea
                                value={block.content || ''}
                                onChange={(e) => handleUpdateBlock(index, { content: e.target.value })}
                                className="input w-full min-h-[200px]"
                                placeholder="Введите текст урока..."
                            />
                            <p className="text-sm text-gray-500 mt-2">
                                Поддерживается Markdown форматирование
                            </p>
                        </div>
                    )}

                    {block.type === 'video' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                URL видео (YouTube, Vimeo, etc.)
                            </label>
                            <input
                                type="text"
                                value={block.videoUrl || ''}
                                onChange={(e) => handleUpdateBlock(index, { videoUrl: e.target.value })}
                                className="input w-full"
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                            {block.videoUrl && (
                                <div className="mt-4">
                                    <div className="bg-gray-100 rounded-lg p-4 text-center">
                                        <Video className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-600">Предпросмотр видео будет доступен после сохранения</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {block.type === 'image' && (
                        <div>
                            <div 
                                {...getRootProps()} 
                                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                                    isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                <input {...getInputProps()} />
                                <Image className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                <p className="text-gray-600 mb-1">
                                    {isDragActive ? 'Отпустите файлы для загрузки' : 'Перетащите изображения сюда или нажмите для выбора'}
                                </p>
                                <p className="text-sm text-gray-500">
                                    PNG, JPG, GIF, WEBP до 10MB
                                </p>
                            </div>

                            {block.files && block.files.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-medium text-gray-900 mb-3">Загруженные изображения ({block.files.length})</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        {block.files.map((file, fileIndex) => (
                                            <div key={file.id} className="relative group">
                                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                                    {file.type.startsWith('image/') ? (
                                                        <img 
                                                            src={file.url} 
                                                            alt={file.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <File className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const updatedFiles = [...block.files];
                                                            updatedFiles.splice(fileIndex, 1);
                                                            handleUpdateBlock(index, { files: updatedFiles });
                                                        }}
                                                        className="p-1 bg-red-500 text-white rounded-full"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-2 truncate">{file.name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {block.type === 'file' && (
                        <div>
                            <div 
                                {...getRootProps()} 
                                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                                    isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                <input {...getInputProps()} />
                                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                <p className="text-gray-600 mb-1">
                                    {isDragActive ? 'Отпустите файлы для загрузки' : 'Перетащите файлы сюда или нажмите для выбора'}
                                </p>
                                <p className="text-sm text-gray-500">
                                    PDF, DOC, PPT, XLS до 50MB
                                </p>
                            </div>

                            {block.files && block.files.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-medium text-gray-900 mb-3">Файлы ({block.files.length})</h4>
                                    <div className="space-y-2">
                                        {block.files.map((file, fileIndex) => (
                                            <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <File className="w-5 h-5 text-gray-400" />
                                                    <div>
                                                        <p className="font-medium text-gray-900">{file.name}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const updatedFiles = [...block.files];
                                                        updatedFiles.splice(fileIndex, 1);
                                                        handleUpdateBlock(index, { files: updatedFiles });
                                                    }}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {block.type === 'quiz' && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium text-gray-900">Вопросы теста</h4>
                                <button
                                    onClick={() => handleAddQuestion(index)}
                                    className="btn btn-primary btn-sm"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Добавить вопрос
                                </button>
                            </div>

                            {block.questions && block.questions.map((question, qIndex) => (
                                <div key={question.id} className="border rounded-lg p-4 mb-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-medium text-gray-900">Вопрос {qIndex + 1}</h5>
                                        <button
                                            onClick={() => {
                                                const updatedQuestions = [...block.questions];
                                                updatedQuestions.splice(qIndex, 1);
                                                handleUpdateBlock(index, { questions: updatedQuestions });
                                            }}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Текст вопроса
                                            </label>
                                            <input
                                                type="text"
                                                value={question.text}
                                                onChange={(e) => {
                                                    const updatedQuestions = [...block.questions];
                                                    updatedQuestions[qIndex].text = e.target.value;
                                                    handleUpdateBlock(index, { questions: updatedQuestions });
                                                }}
                                                className="input w-full"
                                                placeholder="Введите вопрос..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Тип вопроса
                                            </label>
                                            <select
                                                value={question.type}
                                                onChange={(e) => {
                                                    const updatedQuestions = [...block.questions];
                                                    updatedQuestions[qIndex].type = e.target.value;
                                                    handleUpdateBlock(index, { questions: updatedQuestions });
                                                }}
                                                className="input w-full"
                                            >
                                                <option value="single">Один правильный ответ</option>
                                                <option value="multiple">Несколько правильных ответов</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Варианты ответов
                                            </label>
                                            {question.options.map((option, oIndex) => (
                                                <div key={option.id} className="flex items-center gap-3 mb-2">
                                                    <input
                                                        type={question.type === 'single' ? 'radio' : 'checkbox'}
                                                        checked={option.isCorrect}
                                                        onChange={() => {
                                                            const updatedQuestions = [...block.questions];
                                                            if (question.type === 'single') {
                                                                // Сбрасываем все остальные для single choice
                                                                updatedQuestions[qIndex].options.forEach(opt => {
                                                                    opt.isCorrect = false;
                                                                });
                                                            }
                                                            updatedQuestions[qIndex].options[oIndex].isCorrect = !option.isCorrect;
                                                            handleUpdateBlock(index, { questions: updatedQuestions });
                                                        }}
                                                        className="w-4 h-4"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={option.text}
                                                        onChange={(e) => {
                                                            const updatedQuestions = [...block.questions];
                                                            updatedQuestions[qIndex].options[oIndex].text = e.target.value;
                                                            handleUpdateBlock(index, { questions: updatedQuestions });
                                                        }}
                                                        className="input flex-1"
                                                        placeholder="Текст варианта ответа"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const updatedQuestions = [...block.questions];
                                                            updatedQuestions[qIndex].options.splice(oIndex, 1);
                                                            handleUpdateBlock(index, { questions: updatedQuestions });
                                                        }}
                                                        className="text-red-500 hover:text-red-700"
                                                        disabled={question.options.length <= 2}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}

                                            <button
                                                onClick={() => {
                                                    const updatedQuestions = [...block.questions];
                                                    updatedQuestions[qIndex].options.push({
                                                        id: Date.now() + oIndex,
                                                        text: '',
                                                        isCorrect: false
                                                    });
                                                    handleUpdateBlock(index, { questions: updatedQuestions });
                                                }}
                                                className="btn btn-outline btn-sm mt-2"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Добавить вариант
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {block.type === 'link' && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium text-gray-900">Полезные ссылки</h4>
                                <button
                                    onClick={() => handleAddLink(index)}
                                    className="btn btn-primary btn-sm"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Добавить ссылку
                                </button>
                            </div>

                            {block.links && block.links.map((link, lIndex) => (
                                <div key={link.id} className="border rounded-lg p-4 mb-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h5 className="font-medium text-gray-900">Ссылка {lIndex + 1}</h5>
                                        <button
                                            onClick={() => {
                                                const updatedLinks = [...block.links];
                                                updatedLinks.splice(lIndex, 1);
                                                handleUpdateBlock(index, { links: updatedLinks });
                                            }}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Заголовок
                                            </label>
                                            <input
                                                type="text"
                                                value={link.title}
                                                onChange={(e) => {
                                                    const updatedLinks = [...block.links];
                                                    updatedLinks[lIndex].title = e.target.value;
                                                    handleUpdateBlock(index, { links: updatedLinks });
                                                }}
                                                className="input w-full"
                                                placeholder="Название ссылки"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                URL
                                            </label>
                                            <input
                                                type="url"
                                                value={link.url}
                                                onChange={(e) => {
                                                    const updatedLinks = [...block.links];
                                                    updatedLinks[lIndex].url = e.target.value;
                                                    handleUpdateBlock(index, { links: updatedLinks });
                                                }}
                                                className="input w-full"
                                                placeholder="https://example.com"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Описание
                                            </label>
                                            <textarea
                                                value={link.description}
                                                onChange={(e) => {
                                                    const updatedLinks = [...block.links];
                                                    updatedLinks[lIndex].description = e.target.value;
                                                    handleUpdateBlock(index, { links: updatedLinks });
                                                }}
                                                className="input w-full"
                                                rows="2"
                                                placeholder="Краткое описание ссылки..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={() => navigate(`/courses/${courseId}`)}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-2"
                    >
                        <ArrowUp className="w-4 h-4" />
                        Назад к курсу
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Создание нового урока</h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/courses/${courseId}`)}
                        className="btn btn-outline"
                    >
                        <X className="w-4 h-4 mr-2" />
                        Отмена
                    </button>
                    <button
                        onClick={handleSaveLesson}
                        disabled={isSaving}
                        className="btn btn-primary"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Сохранение...' : 'Создать урок'}
                    </button>
                </div>
            </div>

            {/* Main Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Lesson Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Основная информация</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Название урока *
                                </label>
                                <input
                                    type="text"
                                    value={lesson.title}
                                    onChange={(e) => setLesson(prev => ({ ...prev, title: e.target.value }))}
                                    className="input"
                                    placeholder="Введите название урока"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Описание урока
                                </label>
                                <textarea
                                    value={lesson.description}
                                    onChange={(e) => setLesson(prev => ({ ...prev, description: e.target.value }))}
                                    rows="3"
                                    className="input"
                                    placeholder="Опишите содержание урока..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Content Blocks */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900">Контент урока</h2>
                            <div className="text-sm text-gray-600">
                                {lesson.contentBlocks.length} блоков
                            </div>
                        </div>

                        {/* Content Type Selector */}
                        <div className="mb-6">
                            <p className="text-sm font-medium text-gray-700 mb-3">Выберите тип контента:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                                {contentTypes.map((type) => {
                                    const Icon = type.icon;
                                    return (
                                        <button
                                            key={type.type}
                                            onClick={() => handleAddBlock(type.type)}
                                            className={`
                                                flex flex-col items-center justify-center p-4 rounded-xl border-2
                                                hover:border-primary hover:bg-primary/5 transition-all
                                                ${currentBlockType === type.type 
                                                    ? 'border-primary bg-primary/5' 
                                                    : 'border-gray-200'
                                                }
                                            `}
                                        >
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 bg-${type.color}-100`}>
                                                <Icon className={`w-6 h-6 text-${type.color}-600`} />
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">{type.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Content Blocks List */}
                        <div>
                            {lesson.contentBlocks.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                                    <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-600 mb-2">Нет добавленных блоков</p>
                                    <p className="text-sm text-gray-500">
                                        Выберите тип контента выше, чтобы начать создание урока
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    {lesson.contentBlocks.map((block, index) => renderBlockContent(block, index))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Tips & Preview */}
                <div className="space-y-6">
                    {/* Tips Card */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                        <h3 className="font-bold text-blue-900 mb-3">📝 Советы по созданию урока</h3>
                        <ul className="space-y-2 text-sm text-blue-800">
                            <li className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                                <span>Добавляйте разные типы контента для лучшего усвоения</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                                <span>Видео должно быть не более 10-15 минут</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                                <span>Разбивайте текст на небольшие блоки с заголовками</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                                <span>Добавляйте тесты для проверки знаний</span>
                            </li>
                        </ul>
                    </div>

                    {/* Preview Card */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Предпросмотр</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Название:</p>
                                <p className="font-medium text-gray-900 truncate">{lesson.title || 'Без названия'}</p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-600 mb-1">Описание:</p>
                                <p className="text-gray-900 line-clamp-2">{lesson.description || 'Нет описания'}</p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-600 mb-2">Содержание:</p>
                                <div className="space-y-2">
                                    {lesson.contentBlocks.map((block) => {
                                        const Icon = contentTypes.find(t => t.type === block.type)?.icon;
                                        return (
                                            <div key={block.id} className="flex items-center gap-2 text-sm">
                                                {Icon && <Icon className="w-4 h-4 text-gray-400" />}
                                                <span className="text-gray-700 truncate">{block.title}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistics Card */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Статистика</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-2xl font-bold text-primary mb-1">
                                    {lesson.contentBlocks.length}
                                </div>
                                <div className="text-sm text-gray-600">Блоков</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-2xl font-bold text-green-600 mb-1">
                                    {lesson.contentBlocks.filter(b => b.type === 'quiz').length}
                                </div>
                                <div className="text-sm text-gray-600">Тестов</div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-600 mb-2">Распределение типов:</p>
                            <div className="space-y-2">
                                {contentTypes.map(type => {
                                    const count = lesson.contentBlocks.filter(b => b.type === type.type).length;
                                    if (count === 0) return null;
                                    return (
                                        <div key={type.type} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-700">{type.label}</span>
                                            <span className="font-medium">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}