const mongoose = require('mongoose');
const { CATEGORIES, FREQUENCY_TYPES, DAYS_OF_WEEK, DIFFICULTY_LEVELS } = require('../config/constants');

const habitSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Habit name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    category: {
        type: String,
        enum: CATEGORIES,
        default: 'Other'
    },
    icon: { type: String, default: '📌' },
    color: { type: String, default: '#6366f1' },

    // Frequency Settings
    frequency: {
        type: {
            type: String,
            enum: FREQUENCY_TYPES,
            default: 'daily'
        },
        daysOfWeek: [{
            type: String,
            enum: DAYS_OF_WEEK
        }],
        timesPerWeek: { type: Number, min: 1, max: 7 },
        customSchedule: [Date]
    },

    // Time Tracking
    preferredTime: { type: String },
    estimatedDuration: { type: Number, min: 1 },

    // Difficulty & Progression
    difficulty: {
        type: String,
        enum: DIFFICULTY_LEVELS,
        default: 'medium'
    },
    autoAdjustDifficulty: { type: Boolean, default: true },

    // Habit Stacking
    stackedWith: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Habit'
    },
    stackPosition: {
        type: String,
        enum: ['before', 'after'],
        default: 'after'
    },

    // Motivation & Context
    motivation: { type: String, maxlength: 500 },
    cue: { type: String, maxlength: 200 },
    reward: { type: String, maxlength: 200 },

    // Status
    isActive: { type: Boolean, default: true },
    isPaused: { type: Boolean, default: false },
    pausedUntil: { type: Date },

    // Stats (computed/cached)
    stats: {
        totalCompletions: { type: Number, default: 0 },
        currentStreak: { type: Number, default: 0 },
        longestStreak: { type: Number, default: 0 },
        successRate: { type: Number, default: 0 },
        averageCompletionTime: { type: String },
        bestCompletionDay: { type: String },
        lastCompleted: { type: Date }
    },

    // Sharing & Accountability
    isPublic: { type: Boolean, default: false },
    sharedWith: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date }
});

// Indexes for efficient queries
habitSchema.index({ user: 1, isActive: 1 });
habitSchema.index({ user: 1, category: 1 });
habitSchema.index({ user: 1, createdAt: -1 });

// Update timestamp
habitSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Habit', habitSchema);
