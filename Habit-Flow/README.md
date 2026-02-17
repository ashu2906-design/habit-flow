# HabitFlow API 🎯

A Smart Habit Tracker API with Behavioral Psychology, built with Node.js, Express, and MongoDB.

## Features

- **Smart Streak Management** - Track streaks with a forgiveness system
- **Habit Stacking** - Link habits together for better consistency
- **Pattern Recognition** - AI-powered insights based on your behavior
- **Adaptive Difficulty** - Auto-adjust habit difficulty based on performance
- **Accountability Partners** - Share habits and stay accountable
- **Beautiful UI** - Glassmorphism black & white design

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, JWT
- **Frontend**: Vanilla HTML/CSS/JS with Glassmorphism design
- **Scheduled Jobs**: Node-cron for daily/weekly tasks

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your MongoDB URI

# Start development server
npm run dev
```

### Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/habitflow
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
ENABLE_CRON_JOBS=true
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Habits
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/habits` | Get all habits |
| POST | `/api/habits` | Create habit |
| PUT | `/api/habits/:id` | Update habit |
| DELETE | `/api/habits/:id` | Delete habit |
| PATCH | `/api/habits/:id/pause` | Pause habit |
| PATCH | `/api/habits/:id/resume` | Resume habit |

### Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/logs` | Log habit completion |
| GET | `/api/logs/today` | Get today's logs |
| POST | `/api/logs/:id/forgive` | Apply forgiveness |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/overview` | Get overview stats |
| GET | `/api/analytics/patterns` | Get patterns |
| GET | `/api/analytics/insights` | Get insights |

## Project Structure

```
habitflow-api/
├── src/
│   ├── config/       # Database & constants
│   ├── controllers/  # Route handlers
│   ├── middleware/   # Auth & validation
│   ├── models/       # Mongoose schemas
│   ├── routes/       # API routes
│   ├── services/     # Business logic
│   ├── jobs/         # Cron jobs
│   └── utils/        # Helpers
├── public/           # Frontend files
└── server.js         # Entry point
```

## License

MIT
