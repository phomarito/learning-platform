// backend/src/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const authMiddleware = require('../middleware/auth');

// ========== ВАЖНО: Настройки кук ==========
const COOKIE_SETTINGS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
  path: '/',
};

// Валидация для регистрации
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Имя обязательно'),
  body('email').isEmail().withMessage('Неверный формат email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Пароль должен быть минимум 6 символов'),
];

// Валидация для логина
const loginValidation = [
  body('email').isEmail().withMessage('Неверный формат email'),
  body('password').notEmpty().withMessage('Пароль обязателен'),
];

// Регистрация
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, email, password } = req.body;

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь с таким email уже существует',
      });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'STUDENT', // По умолчанию студент
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Создаем JWT токен
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Устанавливаем токен в httpOnly куку
    res.cookie('token', token, COOKIE_SETTINGS);

    res.status(201).json({
      success: true,
      message: 'Регистрация успешна',
      data: {
        user,
        // НЕ отправляем токен в теле ответа
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при регистрации',
    });
  }
});

// Логин
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Неверные учетные данные',
      });
    }

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Неверные учетные данные',
      });
    }

    // Создаем JWT токен
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Устанавливаем токен в httpOnly куку
    res.cookie('token', token, COOKIE_SETTINGS);

    // Возвращаем данные пользователя (без пароля)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    res.json({
      success: true,
      message: 'Вход выполнен успешно',
      data: {
        user: userData,
        // НЕ отправляем токен в теле ответа
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при входе',
    });
  }
});

// Получение текущего пользователя
// backend/src/routes/auth.js
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        // Уберите bio и avatar если их нет в схеме
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
    });
  }
});

// Обновление токена
router.post('/refresh', async (req, res) => {
  try {
    // Получаем токен из куки
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Токен не найден',
      });
    }

    try {
      // Проверяем текущий токен
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Находим пользователя
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true },
      });

      if (!user) {
        // Очищаем куку если пользователь не найден
        res.clearCookie('token', COOKIE_SETTINGS);
        return res.status(401).json({
          success: false,
          message: 'Пользователь не найден',
        });
      }

      // Создаем новый токен
      const newToken = jwt.sign(
        {
          userId: user.id,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Обновляем куку
      res.cookie('token', newToken, COOKIE_SETTINGS);

      res.json({
        success: true,
        message: 'Токен обновлен',
      });
    } catch (jwtError) {
      // Если токен невалидный
      res.clearCookie('token', COOKIE_SETTINGS);
      return res.status(401).json({
        success: false,
        message: 'Невалидный токен',
      });
    }
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
    });
  }
});

// Выход
router.post('/logout', (req, res) => {
  try {
    // Очищаем куку с токеном
    res.clearCookie('token', COOKIE_SETTINGS);
    
    res.json({
      success: true,
      message: 'Выход выполнен успешно',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера',
    });
  }
});

// Изменение пароля
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Требуется текущий и новый пароль',
      });
    }

    // Получаем пользователя с паролем
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { password: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден',
      });
    }

    // Проверяем текущий пароль
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Неверный текущий пароль',
      });
    }

    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Обновляем пароль
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: 'Пароль успешно изменен',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при изменении пароля',
    });
  }
});

module.exports = router;