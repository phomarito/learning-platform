# Backend

## Запуск

1. Запустить PostgreSQL через Docker:
```bash
cd .. && docker-compose up -d
```

2. Установить зависимости:
```bash
npm install
```

3. Применить миграции и сгенерировать Prisma клиент:
```bash
npm run db:generate
npm run db:push
```

4. Загрузить тестовые данные:
```bash
npm run db:seed
```

5. Запустить сервер:
```bash
npm run dev
```

## Тестовые аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Admin | admin@lms.com | admin123 |
| Teacher | teacher@lms.com | teacher123 |
| Student | student@lms.com | student123 |

## API Endpoints

- `POST /api/auth/login` - авторизация
- `GET /api/auth/me` - текущий пользователь
- `GET /api/users` - список пользователей (admin)
- `POST /api/users` - создание пользователя (admin)
- `GET /api/courses` - список курсов
- `POST /api/courses` - создание курса (teacher/admin)
- `GET /api/lessons/:id` - получение урока
- `PUT /api/progress/:lessonId` - обновление прогресса
- `POST /api/chat` - чат с AI
