const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getMe,
    updateProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/auth.middleware');
const { registerValidation, loginValidation } = require('../middleware/validation.middleware');

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
