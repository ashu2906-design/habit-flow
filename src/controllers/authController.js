const User = require('../models/User');
const { generateToken } = require('../middleware/auth.middleware');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 */
const register = async (req, res, next) => {
    try {
        const { username, email, password, name, timezone } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email
                    ? 'Email already registered'
                    : 'Username already taken'
            });
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password,
            profile: {
                name: name || username,
                timezone: timezone || 'UTC'
            }
        });

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            data: {
                user,
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user with password
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.json({
            success: true,
            data: {
                user,
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 */
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('accountabilityPartners', 'username profile.name profile.avatar');

        res.json({
            success: true,
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
    try {
        const { name, avatar, preferences, timezone } = req.body;

        const updateData = {};

        if (name) updateData['profile.name'] = name;
        if (avatar) updateData['profile.avatar'] = avatar;
        if (timezone) updateData['profile.timezone'] = timezone;
        if (preferences) {
            if (preferences.reminderTime) updateData['profile.preferences.reminderTime'] = preferences.reminderTime;
            if (preferences.weekStartsOn) updateData['profile.preferences.weekStartsOn'] = preferences.weekStartsOn;
            if (typeof preferences.forgivenessMode === 'boolean') {
                updateData['profile.preferences.forgivenessMode'] = preferences.forgivenessMode;
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getMe,
    updateProfile
};
