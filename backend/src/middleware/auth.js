// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = async function authMiddleware(req, res, next) {
  try {
    // Пробуем получить токен из кук
    let token = req.cookies.token;
    
    // Если нет в куках, пробуем из заголовка Authorization
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.replace('Bearer ', '');
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Требуется авторизация',
      });
    }

    // Проверяем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Добавляем данные пользователя в запрос
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    // Очищаем куку если токен невалидный
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    });
    
    return res.status(401).json({
      success: false,
      message: 'Невалидный токен',
    });
  }
};