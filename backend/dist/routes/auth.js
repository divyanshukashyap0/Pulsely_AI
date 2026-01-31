import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { generateToken } from '../middleware/auth.js';
// Validation schemas
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().optional(),
});
const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
/**
 * Auth routes for user registration and login
 */
export default async function authRoutes(fastify) {
    // Register new user
    fastify.post('/register', async (request, reply) => {
        try {
            const body = registerSchema.parse(request.body);
            // Check if user exists
            const existingUser = await prisma.user.findUnique({
                where: { email: body.email },
            });
            if (existingUser) {
                reply.code(400).send({ error: 'User with this email already exists' });
                return;
            }
            // Hash password
            const passwordHash = await bcrypt.hash(body.password, 10);
            // Create user
            const user = await prisma.user.create({
                data: {
                    email: body.email,
                    passwordHash,
                    name: body.name,
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    createdAt: true,
                },
            });
            // Generate token
            const token = generateToken({ userId: user.id, email: user.email });
            reply.code(201).send({
                user,
                token,
            });
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                reply.code(400).send({ error: 'Validation error', details: error.errors });
                return;
            }
            fastify.log.error(error);
            reply.code(500).send({ error: 'Internal server error' });
        }
    });
    // Login
    fastify.post('/login', async (request, reply) => {
        try {
            const body = loginSchema.parse(request.body);
            // Find user
            const user = await prisma.user.findUnique({
                where: { email: body.email },
            });
            if (!user) {
                reply.code(401).send({ error: 'Invalid email or password' });
                return;
            }
            // Verify password
            const isValid = await bcrypt.compare(body.password, user.passwordHash);
            if (!isValid) {
                reply.code(401).send({ error: 'Invalid email or password' });
                return;
            }
            // Generate token
            const token = generateToken({ userId: user.id, email: user.email });
            reply.send({
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
                token,
            });
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                reply.code(400).send({ error: 'Validation error', details: error.errors });
                return;
            }
            fastify.log.error(error);
            reply.code(500).send({ error: 'Internal server error' });
        }
    });
}
//# sourceMappingURL=auth.js.map