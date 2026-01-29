# MicroLearning AI - LMS Platform

Платформа микрообучения для корпоративного обучения с ИИ-ассистентом.

## Структура проекта

```
learning-platform/
├── backend/                 # Express.js + Prisma + PostgreSQL
│   ├── prisma/
│   │   ├── schema.prisma   # Модели базы данных
│   │   └── seed.js         # Тестовые данные
│   └── src/
│       ├── index.js        # Точка входа сервера
│       ├── config/         # Конфигурация (database)
│       ├── middleware/     # JWT auth, role check
│       └── routes/         # API маршруты
├── frontend-new/           # Vite + React (миграция)
│   └── src/
│       ├── api/            # Axios client
│       ├── components/     # React компоненты
│       ├── contexts/       # Auth context
│       └── pages/          # Страницы приложения
├── frontend/               # Старый frontend (CDN React)
└── docker-compose.yml      # PostgreSQL контейнер
```

## Быстрый старт

### 1. Запуск базы данных (Docker)

```bash
docker-compose up -d
```

### 2. Настройка и запуск backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Backend запустится на http://localhost:5000

### 3. Запуск frontend

```bash
cd frontend-new
npm install
npm run dev
```

Frontend запустится на http://localhost:5173

## Тестовые аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Администратор | admin@lms.com | admin123 |
| Преподаватель | teacher@lms.com | teacher123 |
| Студент | student@lms.com | student123 |

## API Endpoints

### Аутентификация
- `POST /api/auth/login` - Вход в систему
- `GET /api/auth/me` - Текущий пользователь
- `PUT /api/auth/password` - Смена пароля

### Пользователи (Admin)
- `GET /api/users` - Список пользователей
- `POST /api/users` - Создание пользователя
- `PUT /api/users/:id` - Обновление
- `DELETE /api/users/:id` - Удаление

### Курсы
- `GET /api/courses` - Список курсов
- `GET /api/courses/:id` - Детали курса
- `POST /api/courses` - Создание (Teacher/Admin)
- `PUT /api/courses/:id` - Обновление
- `POST /api/courses/:id/enroll` - Запись на курс

### Уроки
- `GET /api/lessons/:id` - Получение урока
- `POST /api/lessons` - Создание урока
- `PUT /api/lessons/:id` - Обновление

### Прогресс
- `GET /api/progress` - Прогресс по всем курсам
- `PUT /api/progress/:lessonId` - Обновление прогресса
- `GET /api/progress/portfolio` - Портфолио с сертификатами

### Чат с ИИ
- `GET /api/chat/history` - История чата
- `POST /api/chat` - Отправка сообщения
- `POST /api/chat/recommendations` - Рекомендации
- `POST /api/chat/resume` - Генерация резюме

## Роли и права

| Действие | Admin | Teacher | Student |
|----------|-------|---------|---------|
| Управление пользователями | ✓ | ✗ | ✗ |
| Создание курсов | ✓ | ✓ | ✗ |
| Прохождение курсов | ✓ | ✓ | ✓ |
| Чат с ИИ | ✓ | ✓ | ✓ |

## Технологии

### Backend
- Express.js
- Prisma ORM
- PostgreSQL
- JWT + bcrypt
- Socket.io

### Frontend
- React 18 + Vite
- React Router
- TanStack Query
- Tailwind CSS
- Axios
- Lucide Icons
- React Hook Form + Zod
- React Player
- Framer Motion

## TODO

- [ ] Интеграция DeepSeek API для чата
- [ ] Админ-панель управления пользователями
- [ ] Панель преподавателя
- [ ] Портфолио с сертификатами
- [ ] Уведомления (email)
- [ ] Загрузка файлов (видео, документы)
