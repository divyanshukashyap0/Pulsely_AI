# Pulsely AI - AI-Powered Fitness Tracker

A production-ready full-stack fitness tracking application with AI-powered pose detection, workout planning, and coaching.

## 🚀 Features

- **Camera-based Workout Tracking**: Real-time pose detection using MediaPipe for exercise detection and rep counting
- **AI Workout Planner**: Generates personalized workout plans based on your history and goals
- **Recovery & Readiness Score**: Tracks sleep, fatigue, and calculates daily readiness (0-100)
- **AI Fitness Coach Chat**: OpenAI-powered coaching with chat history stored in MySQL
- **Analytics Dashboard**: Workout history, progress charts, and muscle group heatmaps

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Recharts
- **Backend**: Node.js + Fastify + Prisma (MySQL)
- **AI Service**: Python + FastAPI + MediaPipe
- **Database**: MySQL 8.0
- **Auth**: JWT

## 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- MySQL 8.0
- OpenAI API key (for AI Coach feature)

## 🏗️ Setup Instructions

### 1. Database Setup

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE pulsely_ai;

# Update .env with your database URL
DATABASE_URL="mysql://user:password@localhost:3306/pulsely_ai"
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install AI service dependencies
cd ../ai-service
pip install -r requirements.txt
```

### 3. Database Migration

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed initial exercises
# You can add a seed script to populate exercises table
```

### 4. Environment Variables

Create `.env` file in the root directory:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/pulsely_ai"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# OpenAI API (for AI Coach)
OPENAI_API_KEY="sk-your-openai-api-key"

# Backend API
BACKEND_PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001

# AI Service (Python FastAPI)
AI_SERVICE_URL=http://localhost:8000
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000
```

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - AI Service:**
```bash
cd ai-service
python -m uvicorn main:app --reload --port 8000
```

**Terminal 3 - Frontend:**
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- AI Service: http://localhost:8000

## 📁 Project Structure

```
pulsely-ai/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Main dashboard
│   ├── workout/           # Workout tracking with camera
│   ├── analytics/         # Analytics and charts
│   ├── coach/             # AI coach chat
│   └── login/             # Authentication
├── backend/               # Fastify backend
│   └── src/
│       ├── routes/        # API routes
│       ├── middleware/    # Auth middleware
│       └── server.ts      # Server entry
├── ai-service/            # Python FastAPI service
│   └── main.py           # Pose detection service
├── components/            # React components
│   ├── dashboard/        # Dashboard components
│   ├── workout/         # Workout components
│   └── analytics/       # Chart components
├── prisma/               # Prisma schema and migrations
│   └── schema.prisma    # Database schema
└── hooks/               # React hooks
```

## 🗄️ Database Schema

The application uses a comprehensive MySQL schema with the following main tables:

- **users**: User accounts and authentication
- **workouts**: Workout sessions
- **exercises**: Exercise master data
- **workout_exercises**: Exercises in a workout
- **workout_sets**: Sets performed with reps, weight, pose scores
- **recovery_data**: Sleep, fatigue, stress tracking
- **readiness_scores**: Calculated readiness scores
- **chat_messages**: AI coach conversation history
- **workout_plans**: AI-generated workout plans
- **goals**: User fitness goals

All tables include proper indexes for optimized queries.

## 🔐 Authentication

The app uses JWT-based authentication. Tokens are stored in localStorage and sent with each API request via the `Authorization` header.

## 📊 API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login

### Workouts
- `GET /api/workouts` - Get all workouts
- `POST /api/workouts` - Create workout
- `GET /api/workouts/:id` - Get workout details
- `PATCH /api/workouts/:id/complete` - Complete workout
- `POST /api/workouts/sets` - Add set to workout

### Analytics
- `GET /api/analytics/stats` - Get workout statistics
- `GET /api/analytics/progress` - Get progress over time

### Recovery
- `GET /api/recovery/data` - Get recovery data
- `POST /api/recovery/data` - Add/update recovery data
- `GET /api/recovery/readiness` - Get readiness scores

### Chat
- `GET /api/chat/history` - Get chat history
- `POST /api/chat/message` - Send message to AI coach

### Plans
- `GET /api/plans` - Get workout plans
- `POST /api/plans/generate` - Generate AI workout plan

## 🤖 AI Service Endpoints

- `POST /analyze-pose` - Analyze pose from image (base64)
- `POST /reset-detector` - Reset rep counter
- `GET /supported-exercises` - Get supported exercises

## 🎯 Key Features Explained

### Pose Detection
Uses MediaPipe Pose to detect body landmarks and calculate angles for exercise detection. Currently supports:
- Squats
- Push-ups
- Bicep curls

### Progressive Overload
The AI workout planner analyzes your workout history and automatically increases weight (2.5%) or reps (+1) for progressive overload.

### Readiness Score
Calculates a 0-100 score based on:
- Sleep quality (40% weight)
- Fatigue level (30% weight)
- Previous day workout strain (30% weight)

## 🚧 Development Notes

- The backend uses ES modules (`type: "module"` in package.json)
- CORS is configured for localhost development
- All API routes require JWT authentication except `/api/auth/*`
- The AI service processes images in base64 format
- MediaPipe requires camera permissions in the browser

## 📝 License

This project is for educational purposes. Please ensure you have proper licenses for production use.

## 🤝 Contributing

This is a production-ready starter template. Feel free to extend and customize for your needs!
