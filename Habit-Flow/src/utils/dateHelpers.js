const {
    startOfDay,
    endOfDay,
    subDays,
    addDays,
    differenceInDays,
    isSameDay,
    format,
    parseISO,
    isValid
} = require('date-fns');

/**
 * Get start of day for a date
 */
const getStartOfDay = (date) => {
    return startOfDay(date instanceof Date ? date : parseISO(date));
};

/**
 * Get end of day for a date
 */
const getEndOfDay = (date) => {
    return endOfDay(date instanceof Date ? date : parseISO(date));
};

/**
 * Subtract days from a date
 */
const subtractDays = (date, days) => {
    return subDays(date, days);
};

/**
 * Add days to a date
 */
const addDaysToDate = (date, days) => {
    return addDays(date, days);
};

/**
 * Check if two dates are the same day
 */
const isSameDayCheck = (date1, date2) => {
    return isSameDay(date1, date2);
};

/**
 * Get difference in days between two dates
 */
const getDaysDifference = (date1, date2) => {
    return differenceInDays(date1, date2);
};

/**
 * Format date to string
 */
const formatDate = (date, formatString = 'yyyy-MM-dd') => {
    return format(date, formatString);
};

/**
 * Parse ISO date string
 */
const parseDateString = (dateString) => {
    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : null;
};

/**
 * Get expected days based on frequency
 */
const getExpectedDays = (frequency, startDate, endDate = new Date()) => {
    const days = getDaysDifference(endDate, startDate);

    if (frequency.type === 'daily') {
        return days;
    }

    if (frequency.type === 'weekly' && frequency.daysOfWeek) {
        // Count how many of the specified days fall in the range
        let count = 0;
        let currentDate = startDate;

        while (currentDate <= endDate) {
            const dayName = format(currentDate, 'EEEE');
            if (frequency.daysOfWeek.includes(dayName)) {
                count++;
            }
            currentDate = addDays(currentDate, 1);
        }

        return count;
    }

    if (frequency.type === 'custom' && frequency.timesPerWeek) {
        // Approximate based on times per week
        const weeks = days / 7;
        return Math.round(weeks * frequency.timesPerWeek);
    }

    return days;
};

/**
 * Get next expected date based on frequency
 */
const getNextExpectedDate = (currentDate, frequency) => {
    if (frequency.type === 'daily') {
        return subDays(currentDate, 1);
    }

    if (frequency.type === 'weekly' && frequency.daysOfWeek) {
        // Find previous day that matches
        let checkDate = subDays(currentDate, 1);
        let attempts = 0;

        while (attempts < 7) {
            const dayName = format(checkDate, 'EEEE');
            if (frequency.daysOfWeek.includes(dayName)) {
                return checkDate;
            }
            checkDate = subDays(checkDate, 1);
            attempts++;
        }
    }

    return subDays(currentDate, 1);
};

module.exports = {
    getStartOfDay,
    getEndOfDay,
    subtractDays,
    addDaysToDate,
    isSameDayCheck,
    getDaysDifference,
    formatDate,
    parseDateString,
    getExpectedDays,
    getNextExpectedDate
};
