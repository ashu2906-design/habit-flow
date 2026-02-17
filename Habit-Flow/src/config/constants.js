// Habit Categories
const CATEGORIES = ['Health', 'Productivity', 'Mindfulness', 'Learning', 'Social', 'Finance', 'Other'];

// Frequency Types
const FREQUENCY_TYPES = ['daily', 'weekly', 'custom'];

// Days of Week
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Difficulty Levels
const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];

// Mood Options
const MOOD_OPTIONS = ['great', 'good', 'okay', 'struggling', 'skipped'];

// Difficulty Feedback
const DIFFICULTY_FEEDBACK = ['too-easy', 'just-right', 'challenging', 'too-hard'];

// Insight Types
const INSIGHT_TYPES = ['pattern', 'suggestion', 'achievement', 'warning', 'tip'];

// Priority Levels
const PRIORITY_LEVELS = ['low', 'medium', 'high'];

// Accountability Status
const ACCOUNTABILITY_STATUS = ['pending', 'accepted', 'rejected'];

// Time Slots for Analysis
const TIME_SLOTS = {
    morning: { start: 6, end: 12 },
    afternoon: { start: 12, end: 18 },
    evening: { start: 18, end: 22 },
    night: { start: 22, end: 6 }
};

// Streak Milestones
const STREAK_MILESTONES = [7, 14, 21, 30, 60, 90, 100, 180, 365];

// Default Forgiveness Limit (per month)
const DEFAULT_FORGIVENESS_LIMIT = 2;

// Week Start Options
const WEEK_START_OPTIONS = ['Monday', 'Sunday'];

module.exports = {
    CATEGORIES,
    FREQUENCY_TYPES,
    DAYS_OF_WEEK,
    DIFFICULTY_LEVELS,
    MOOD_OPTIONS,
    DIFFICULTY_FEEDBACK,
    INSIGHT_TYPES,
    PRIORITY_LEVELS,
    ACCOUNTABILITY_STATUS,
    TIME_SLOTS,
    STREAK_MILESTONES,
    DEFAULT_FORGIVENESS_LIMIT,
    WEEK_START_OPTIONS
};
