const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const { isAdmin, isTeacher } = require('../middleware/roleCheck');

const router = express.Router();

// Создаем папку uploads если ее нет
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройка хранения файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// Фильтр для проверки типа файла
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Только изображения разрешены'));
    }
};

// Настройка multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: fileFilter
});

/**
 * POST /api/upload/avatar
 * Upload user avatar
 */
router.post('/avatar', auth, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Файл не загружен'
            });
        }

        // В продакшене здесь будет загрузка в облачное хранилище
        const fileUrl = `/uploads/${req.file.filename}`;

        res.json({
            success: true,
            data: {
                url: fileUrl,
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/upload/course-image
 * Upload course cover image
 */
router.post('/course-image', auth, isTeacher, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Файл не загружен'
            });
        }

        const fileUrl = `/uploads/${req.file.filename}`;

        res.json({
            success: true,
            data: {
                url: fileUrl,
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/upload/lesson-file
 * Upload lesson file (video, pdf, etc)
 */
router.post('/lesson-file', auth, isTeacher, upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Файл не загружен'
            });
        }

        const fileUrl = `/uploads/${req.file.filename}`;

        res.json({
            success: true, // ИСПРАВЛЕНО: было false, должно быть true
            data: {
                url: fileUrl,
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/upload/:filename
 * Delete uploaded file
 */
router.delete('/:filename', auth, async (req, res, next) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(uploadDir, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Файл не найден'
            });
        }

        fs.unlinkSync(filePath);

        res.json({
            success: true,
            message: 'Файл удален'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;