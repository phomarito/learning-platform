const express = require('express');
const prisma = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/certificates/course/:courseId
 * Get certificate for specific course
 */
router.get('/course/:courseId', auth, async (req, res, next) => {
    try {
        const courseId = parseInt(req.params.courseId);
        const userId = req.userId;

        const certificate = await prisma.certificate.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId
                }
            },
            include: {
                course: true
            }
        });

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Сертификат не найден'
            });
        }

        res.json({
            success: true,
            data: {
                certificate,
                course: certificate.course
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/certificates
 * Get all user's certificates
 */
router.get('/', auth, async (req, res, next) => {
    try {
        const certificates = await prisma.certificate.findMany({
            where: { userId: req.userId },
            include: {
                course: true
            },
            orderBy: { issuedAt: 'desc' }
        });

        res.json({
            success: true,
            data: certificates
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/certificates/:id/pdf
 * Generate PDF for certificate
 */
router.get('/:id/pdf', auth, async (req, res, next) => {
    try {
        const certificateId = parseInt(req.params.id);
        
        const certificate = await prisma.certificate.findUnique({
            where: { id: certificateId },
            include: {
                user: true,
                course: true
            }
        });

        if (!certificate || certificate.userId !== req.userId) {
            return res.status(404).json({
                success: false,
                message: 'Сертификат не найден'
            });
        }

        // Здесь будет логика генерации PDF
        // Временный ответ с URL для скачивания
        res.json({
            success: true,
            data: {
                url: `/certificates/${certificate.uniqueCode}.pdf`,
                message: 'PDF будет сгенерирован'
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;