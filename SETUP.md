# Pulsely AI - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
# Root dependencies (Next.js frontend)
npm install

# Backend dependencies
cd backend
npm install
cd ..

# AI Service dependencies (Python)
cd ai-service
pip install -r requirements.txt
cd ..
```

### 2. Database Setup

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE pulsely_ai;
EXIT;

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed initial exercises
npm run db:seed
```

### 3. Environment Variables

Create `.env` file:

```env
DATABASE_URL="mysql://user:password@localhost:3306/pulsely_ai"
JWT_SECRET="your-super-secret-jwt-key"
OPENAI_API_KEY="sk-your-openai-api-key"
BACKEND_PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
AI_SERVICE_URL=http://localhost:8000
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000
```

### 4. Run All Services

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

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- AI Service: http://localhost:8000

## First Steps

1. Register a new account at http://localhost:3000/register
2. Login and explore the dashboard
3. Start a workout and test the camera-based pose detection
4. Log recovery data to see readiness scores
5. Chat with the AI coach

## Troubleshooting

### Database Connection Issues
- Ensure MySQL is running
- Check DATABASE_URL in .env matches your MySQL credentials
- Verify database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Camera Not Working
- Grant camera permissions in your browser
- Use HTTPS in production (required for camera access)
- Check browser console for errors

### AI Service Not Responding
- Ensure Python dependencies are installed
- Check if port 8000 is available
- Verify MediaPipe installation: `python -c "import mediapipe"`

### OpenAI API Errors
- Verify OPENAI_API_KEY is set correctly
- Check API key has sufficient credits
- Review backend logs for detailed error messages

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong JWT_SECRET
3. Configure proper CORS origins
4. Use HTTPS for camera access
5. Set up MySQL connection pooling
6. Configure environment-specific variables
