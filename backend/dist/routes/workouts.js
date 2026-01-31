import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
// Validation schemas
const createWorkoutSchema = z.object({
    name: z.string().min(1),
    type: z.string(),
    notes: z.string().optional(),
});
const addExerciseSchema = z.object({
    exerciseId: z.string().uuid(),
    order: z.number().int().optional(),
    notes: z.string().optional(),
});
const addSetSchema = z.object({
    workoutExerciseId: z.string().uuid(),
    setNumber: z.number().int(),
    reps: z.number().int().optional(),
    weight: z.number().optional(),
    duration: z.number().int().optional(),
    distance: z.number().optional(),
    restSeconds: z.number().int().optional(),
    poseScore: z.number().min(0).max(100).optional(),
    repCount: z.number().int().optional(),
});
/**
 * Workout routes for managing workout sessions
 */
export default async function workoutRoutes(fastify) {
    // Apply auth to all routes
    fastify.addHook('onRequest', authenticate);
    // Get all workouts for user
    fastify.get('/', async (request, reply) => {
        try {
            const userId = request.user.userId;
            const { limit = 50, offset = 0 } = request.query;
            const workouts = await prisma.workout.findMany({
                where: { userId },
                include: {
                    exercises: {
                        include: {
                            exercise: true,
                            sets: {
                                orderBy: { setNumber: 'asc' },
                            },
                        },
                        orderBy: { order: 'asc' },
                    },
                },
                orderBy: { startedAt: 'desc' },
                take: limit,
                skip: offset,
            });
            reply.send({ workouts });
        }
        catch (error) {
            fastify.log.error(error);
            reply.code(500).send({ error: 'Internal server error' });
        }
    });
    // Get single workout
    fastify.get('/:id', async (request, reply) => {
        try {
            const userId = request.user.userId;
            const { id } = request.params;
            const workout = await prisma.workout.findFirst({
                where: { id, userId },
                include: {
                    exercises: {
                        include: {
                            exercise: true,
                            sets: {
                                orderBy: { setNumber: 'asc' },
                            },
                        },
                        orderBy: { order: 'asc' },
                    },
                },
            });
            if (!workout) {
                reply.code(404).send({ error: 'Workout not found' });
                return;
            }
            reply.send({ workout });
        }
        catch (error) {
            fastify.log.error(error);
            reply.code(500).send({ error: 'Internal server error' });
        }
    });
    // Create new workout
    fastify.post('/', async (request, reply) => {
        try {
            const userId = request.user.userId;
            const body = createWorkoutSchema.parse(request.body);
            const workout = await prisma.workout.create({
                data: {
                    userId,
                    name: body.name,
                    type: body.type,
                    notes: body.notes,
                },
            });
            reply.code(201).send({ workout });
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
    // Complete workout
    fastify.patch('/:id/complete', async (request, reply) => {
        try {
            const userId = request.user.userId;
            const { id } = request.params;
            const workout = await prisma.workout.findFirst({
                where: { id, userId },
            });
            if (!workout) {
                reply.code(404).send({ error: 'Workout not found' });
                return;
            }
            const duration = Math.floor((new Date().getTime() - workout.startedAt.getTime()) / 60000);
            const updated = await prisma.workout.update({
                where: { id },
                data: {
                    completedAt: new Date(),
                    duration,
                },
            });
            reply.send({ workout: updated });
        }
        catch (error) {
            fastify.log.error(error);
            reply.code(500).send({ error: 'Internal server error' });
        }
    });
    // Add exercise to workout
    fastify.post('/:workoutId/exercises', async (request, reply) => {
        try {
            const userId = request.user.userId;
            const { workoutId } = request.params;
            const body = addExerciseSchema.parse(request.body);
            // Verify workout belongs to user
            const workout = await prisma.workout.findFirst({
                where: { id: workoutId, userId },
            });
            if (!workout) {
                reply.code(404).send({ error: 'Workout not found' });
                return;
            }
            const workoutExercise = await prisma.workoutExercise.create({
                data: {
                    workoutId,
                    exerciseId: body.exerciseId,
                    order: body.order ?? 0,
                    notes: body.notes,
                },
                include: {
                    exercise: true,
                },
            });
            reply.code(201).send({ workoutExercise });
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
    // Add set to workout exercise
    fastify.post('/sets', async (request, reply) => {
        try {
            const userId = request.user.userId;
            const body = addSetSchema.parse(request.body);
            // Verify workout exercise exists and belongs to user's workout
            const workoutExercise = await prisma.workoutExercise.findFirst({
                where: {
                    id: body.workoutExerciseId,
                    workout: { userId },
                },
            });
            if (!workoutExercise) {
                reply.code(404).send({ error: 'Workout exercise not found' });
                return;
            }
            const set = await prisma.workoutSet.create({
                data: {
                    workoutExerciseId: body.workoutExerciseId,
                    userId,
                    setNumber: body.setNumber,
                    reps: body.reps,
                    weight: body.weight,
                    duration: body.duration,
                    distance: body.distance,
                    restSeconds: body.restSeconds,
                    poseScore: body.poseScore,
                    repCount: body.repCount,
                },
            });
            reply.code(201).send({ set });
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
//# sourceMappingURL=workouts.js.map