/**
 * Role-based access control middleware
 * @param  {...string} roles - Allowed roles (ADMIN, TEACHER, STUDENT)
 */
const roleCheck = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Требуется авторизация'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Недостаточно прав для выполнения операции'
            });
        }

        next();
    };
};

// Convenience exports for common role checks
const isAdmin = roleCheck('ADMIN');
const isTeacher = roleCheck('TEACHER', 'ADMIN');
const isStudent = roleCheck('STUDENT', 'TEACHER', 'ADMIN');

module.exports = {
    roleCheck,
    isAdmin,
    isTeacher,
    isStudent
};
