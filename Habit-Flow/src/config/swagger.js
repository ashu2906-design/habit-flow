const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'HabitFlow API',
            version: '1.0.0',
            description: 'Smart Habit Tracker API with Behavioral Psychology',
            contact: {
                name: 'HabitFlow Team'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        username: { type: 'string' },
                        email: { type: 'string' },
                        profile: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                timezone: { type: 'string' }
                            }
                        }
                    }
                },
                Habit: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        category: { type: 'string', enum: ['Health', 'Productivity', 'Mindfulness', 'Learning', 'Social', 'Finance', 'Other'] },
                        icon: { type: 'string' },
                        difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
                        isActive: { type: 'boolean' }
                    }
                },
                HabitLog: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        habit: { type: 'string' },
                        date: { type: 'string', format: 'date' },
                        completed: { type: 'boolean' },
                        mood: { type: 'string' },
                        notes: { type: 'string' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string' }
                    }
                }
            }
        },
        tags: [
            { name: 'Auth', description: 'Authentication endpoints' },
            { name: 'Habits', description: 'Habit management' },
            { name: 'Logs', description: 'Habit completion logs' },
            { name: 'Streaks', description: 'Streak tracking' },
            { name: 'Analytics', description: 'Analytics and insights' },
            { name: 'Accountability', description: 'Social features' }
        ],
        paths: {
            '/api/auth/register': {
                post: {
                    tags: ['Auth'],
                    summary: 'Register new user',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['username', 'email', 'password'],
                                    properties: {
                                        username: { type: 'string', example: 'johndoe' },
                                        email: { type: 'string', example: 'john@example.com' },
                                        password: { type: 'string', example: 'password123' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: { description: 'User registered successfully' },
                        400: { description: 'Validation error' }
                    }
                }
            },
            '/api/auth/login': {
                post: {
                    tags: ['Auth'],
                    summary: 'Login user',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password'],
                                    properties: {
                                        email: { type: 'string', example: 'john@example.com' },
                                        password: { type: 'string', example: 'password123' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Login successful' },
                        401: { description: 'Invalid credentials' }
                    }
                }
            },
            '/api/auth/me': {
                get: {
                    tags: ['Auth'],
                    summary: 'Get current user',
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: 'Current user data' },
                        401: { description: 'Not authenticated' }
                    }
                }
            },
            '/api/habits': {
                get: {
                    tags: ['Habits'],
                    summary: 'Get all habits',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'category', in: 'query', schema: { type: 'string' } },
                        { name: 'isActive', in: 'query', schema: { type: 'boolean' } }
                    ],
                    responses: {
                        200: { description: 'List of habits' }
                    }
                },
                post: {
                    tags: ['Habits'],
                    summary: 'Create new habit',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['name'],
                                    properties: {
                                        name: { type: 'string', example: 'Morning Meditation' },
                                        category: { type: 'string', example: 'Mindfulness' },
                                        difficulty: { type: 'string', example: 'medium' },
                                        icon: { type: 'string', example: '🧘' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: { description: 'Habit created' }
                    }
                }
            },
            '/api/habits/{id}': {
                get: {
                    tags: ['Habits'],
                    summary: 'Get habit by ID',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Habit details' } }
                },
                put: {
                    tags: ['Habits'],
                    summary: 'Update habit',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Habit updated' } }
                },
                delete: {
                    tags: ['Habits'],
                    summary: 'Delete habit',
                    security: [{ bearerAuth: [] }],
                    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                    responses: { 200: { description: 'Habit deleted' } }
                }
            },
            '/api/logs': {
                get: {
                    tags: ['Logs'],
                    summary: 'Get habit logs',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'habitId', in: 'query', schema: { type: 'string' } },
                        { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
                        { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } }
                    ],
                    responses: { 200: { description: 'List of logs' } }
                },
                post: {
                    tags: ['Logs'],
                    summary: 'Log habit completion',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['habitId', 'date', 'completed'],
                                    properties: {
                                        habitId: { type: 'string' },
                                        date: { type: 'string', format: 'date', example: '2024-01-15' },
                                        completed: { type: 'boolean', example: true },
                                        mood: { type: 'string', example: 'great' }
                                    }
                                }
                            }
                        }
                    },
                    responses: { 201: { description: 'Log created' } }
                }
            },
            '/api/logs/today': {
                get: {
                    tags: ['Logs'],
                    summary: "Get today's habits with completion status",
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'Today\'s habits' } }
                }
            },
            '/api/streaks': {
                get: {
                    tags: ['Streaks'],
                    summary: 'Get all streaks',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'List of streaks' } }
                }
            },
            '/api/analytics/overview': {
                get: {
                    tags: ['Analytics'],
                    summary: 'Get overview statistics',
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        { name: 'period', in: 'query', schema: { type: 'string', enum: ['week', 'month', 'year'] } }
                    ],
                    responses: { 200: { description: 'Overview stats' } }
                }
            },
            '/api/analytics/insights': {
                get: {
                    tags: ['Analytics'],
                    summary: 'Get user insights',
                    security: [{ bearerAuth: [] }],
                    responses: { 200: { description: 'List of insights' } }
                }
            },
            '/api/accountability/request': {
                post: {
                    tags: ['Accountability'],
                    summary: 'Send accountability partner request',
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        partnerEmail: { type: 'string' },
                                        partnerUsername: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: { 201: { description: 'Request sent' } }
                }
            }
        }
    },
    apis: []
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

module.exports = swaggerSpec;
