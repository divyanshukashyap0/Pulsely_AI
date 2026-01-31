import Fastify from 'fastify';
import cors from '@fastify/cors';
import authRoutes from './routes/auth.js';
import workoutRoutes from './routes/workouts.js';
import analyticsRoutes from './routes/analytics.js';
import chatRoutes from './routes/chat.js';
import recoveryRoutes from './routes/recovery.js';
import planRoutes from './routes/plans.js';
const fastify = Fastify({
    logger: true,
});
/* -----------------------------------
   CORS (CRITICAL FOR VERCEL)
----------------------------------- */
await fastify.register(cors, {
    origin: (origin, cb) => {
        const allowedOrigins = [
            'http://localhost:3000',
            process.env.FRONTEND_URL, // Vercel URL
        ].filter(Boolean);
        // Allow server-to-server / Postman / curl
        if (!origin)
            return cb(null, true);
        if (allowedOrigins.includes(origin)) {
            cb(null, true);
        }
        else {
            cb(new Error('CORS not allowed'), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
});
/* -----------------------------------
   Health Check
----------------------------------- */
fastify.get('/health', async () => {
    return {
        status: 'ok',
        timestamp: new Date().toISOString(),
    };
});
/* -----------------------------------
   Routes
----------------------------------- */
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(workoutRoutes, { prefix: '/api/workouts' });
await fastify.register(analyticsRoutes, { prefix: '/api/analytics' });
await fastify.register(chatRoutes, { prefix: '/api/chat' });
await fastify.register(recoveryRoutes, { prefix: '/api/recovery' });
await fastify.register(planRoutes, { prefix: '/api/plans' });
/* -----------------------------------
   Start Server
----------------------------------- */
const start = async () => {
    try {
        const port = Number(process.env.BACKEND_PORT) || 3001;
        await fastify.listen({
            port,
            host: '0.0.0.0',
        });
        console.log(`🚀 Backend running on port ${port}`);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
/* -----------------------------------
   Graceful Shutdown
----------------------------------- */
process.on('SIGTERM', async () => {
    fastify.log.info('SIGTERM received. Shutting down...');
    await fastify.close();
    const prisma = (await import('./lib/prisma.js')).default;
    await prisma.$disconnect();
});
start();
//# sourceMappingURL=server.js.map