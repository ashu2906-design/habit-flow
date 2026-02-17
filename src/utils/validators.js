const { CATEGORIES, DIFFICULTY_LEVELS, FREQUENCY_TYPES, MOOD_OPTIONS } = require('../config/constants');

/**
 * Validate email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate MongoDB ObjectId
 */
const isValidObjectId = (id) => {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
};

/**
 * Validate category
 */
const isValidCategory = (category) => {
    return CATEGORIES.includes(category);
};

/**
 * Validate difficulty
 */
const isValidDifficulty = (difficulty) => {
    return DIFFICULTY_LEVELS.includes(difficulty);
};

/**
 * Validate frequency type
 */
const isValidFrequencyType = (type) => {
    return FREQUENCY_TYPES.includes(type);
};

/**
 * Validate mood
 */
const isValidMood = (mood) => {
    return MOOD_OPTIONS.includes(mood);
};

/**
 * Validate time format (HH:mm)
 */
const isValidTimeFormat = (time) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
};

/**
 * Validate ISO date string
 */
const isValidISODate = (dateString) => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
};

/**
 * Sanitize string input
 */
const sanitizeString = (str) => {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '');
};

/**
 * Validate hex color
 */
const isValidHexColor = (color) => {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
};

module.exports = {
    isValidEmail,
    isValidObjectId,
    isValidCategory,
    isValidDifficulty,
    isValidFrequencyType,
    isValidMood,
    isValidTimeFormat,
    isValidISODate,
    sanitizeString,
    isValidHexColor
};
