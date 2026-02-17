const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const { notFound, errorHandler } = require('./middleware/errorHandler.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const habitRoutes = require('./routes/habit.routes');
const logRoutes = require('./routes/log.routes');
const streakRoutes = require('./routes/streak.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const socialRoutes = require('./routes/social.routes');

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests, please try again later'
    }
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Swagger API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'HabitFlow API Docs'
}));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/streaks', streakRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/accountability', socialRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'HabitFlow API is running',
        timestamp: new Date().toISOString(),
        docs: '/api/docs'
    });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;

