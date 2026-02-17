const { validationResult, body, param, query } = require('express-validator');

/**
 * Handle validation errors
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// Auth validations
const registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be 3-30 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    validate
];

const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    validate
];

// Habit validations
const habitValidation = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Habit name is required and must be under 100 characters'),
    body('category')
        .optional()
        .isIn(['Health', 'Productivity', 'Mindfulness', 'Learning', 'Social', 'Finance', 'Other'])
        .withMessage('Invalid category'),
    body('frequency.type')
        .optional()
        .isIn(['daily', 'weekly', 'custom'])
        .withMessage('Invalid frequency type'),
    body('difficulty')
        .optional()
        .isIn(['easy', 'medium', 'hard'])
        .withMessage('Invalid difficulty'),
    validate
];

// Log validations
const logValidation = [
    body('habitId')
        .isMongoId()
        .withMessage('Valid habit ID is required'),
    body('date')
        .isISO8601()
        .withMessage('Valid date is required'),
    body('completed')
        .isBoolean()
        .withMessage('Completed must be a boolean'),
    body('mood')
        .optional()
        .isIn(['great', 'good', 'okay', 'struggling', 'skipped'])
        .withMessage('Invalid mood'),
    validate
];

// Common param validations
const mongoIdParam = [
    param('id')
        .isMongoId()
        .withMessage('Invalid ID format'),
    validate
];

module.exports = {
    validate,
    registerValidation,
    loginValidation,
    habitValidation,
    logValidation,
    mongoIdParam
};
