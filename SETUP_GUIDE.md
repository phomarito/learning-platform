# Руководство по развертыванию (Setup Guide)

## 0. Создание репозитория и первый пуш

Чтобы сохранить проект на GitHub (выполнять в корневой папке `learning-platform`):

1. **Создайте пустой репозиторий на GitHub** (без README и .gitignore).

2. **Инициализация локального репозитория:**
```bash
git init
git add .
git commit -m "Initial commit of LMS platform"
```

3. **Связка с GitHub и пуш:**
```bash
# Замените URL на ваш репозиторий
git remote add origin https://github.com/ВАШ_USERNAME/ВАШ_REPO.git
git branch -M main
git push -u origin main
```

---

## 1. Запуск проекта на новом устройстве

### Шаг 1: Скачивание (Клонирование)
```bash
git clone https://github.com/ВАШ_USERNAME/ВАШ_REPO.git
cd learning-platform
```

### Шаг 2: Запуск базы данных (Docker)
Убедитесь, что Docker Desktop установлен и запущен.
```bash
docker-compose up -d
```
*Эта команда скачает PostgreSQL и запустит её в фоне.*

### Шаг 3: Настройка Backend

1. Перейдите в папку backend:
```bash
cd backend
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env`. 
   Так как `.env` не попадает в git, создайте его на основе примера:
   - **Windows (CMD):** `copy .env.example .env`
   - **Mac/Linux:** `cp .env.example .env`

4. Подготовьте базу данных (создание таблиц и тестовых данных):
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```
*Seed создаст тестовых пользователей (admin/teacher/student).*

### Шаг 4: Настройка Frontend

1. Откройте **новый терминал** в корне проекта.
2. Перейдите в папку frontend:
```bash
cd frontend
```
3. Установите зависимости:
```bash
npm install
```

---

## 2. Запуск проекта (Run)

Вам понадобится **два терминала** (для бэкенда и фронтенда).

### Терминал 1: Backend
```bash
cd backend
npm run dev
```
*Сервер запустится на http://localhost:5000*

### Терминал 2: Frontend
```bash
cd frontend
npm run dev
```
*Приложение откроется на http://localhost:5173*

---

## Важные команды

| Действие | Команда | Где выполнять |
|s----------|---------|---------------|
| Остановить Docker | `docker-compose down` | Корень |
| Обновить БД (после изменения schema.prisma) | `npx prisma db push` | backend |
| Просмотр БД (GUI) | `npx prisma studio` | backend |
