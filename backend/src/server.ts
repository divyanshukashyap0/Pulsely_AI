import Fastify from 'fastify';
import authRoutes from './routes/auth.js';
import workoutRoutes from './routes/workouts.js';
import analyticsRoutes from './routes/analytics.js';
import chatRoutes from './routes/chat.js';
import recoveryRoutes from './routes/recovery.js';
import planRoutes from './routes/plans.js';

const fastify = Fastify({ logger: true });

// CORS configuration
fastify.addHook('onRequest', async (request, reply) => {
  reply.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  reply.header('Access-Control-Allow-Credentials', 'true');
  
  if (request.method === 'OPTIONS') {
    reply.code(200).send();
  }
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(workoutRoutes, { prefix: '/api/workouts' });
await fastify.register(analyticsRoutes, { prefix: '/api/analytics' });
await fastify.register(chatRoutes, { prefix: '/api/chat' });
await fastify.register(recoveryRoutes, { prefix: '/api/recovery' });
await fastify.register(planRoutes, { prefix: '/api/plans' });

// Graceful shutdown
const start = async () => {
  try {
    const port = Number(process.env.BACKEND_PORT) || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Backend server running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Handle shutdown
process.on('SIGTERM', async () => {
  await fastify.close();
  const prisma = (await import('./lib/prisma.js')).default;
  await prisma.$disconnect();
});

start();
