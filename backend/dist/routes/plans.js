import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
const createPlanSchema = z.object({
    name: z.string().min(1),
    goal: z.string().optional(),
    planData: z.record(z.any()),
});
/**
 * AI Workout Planner routes
 */
export default async function planRoutes(fastify) {
    fastify.addHook('onRequest', authenticate);
    // Get all workout plans
    fastify.get('/', async (request, reply) => {
        try {
            const userId = request.user.userId;
            const plans = await prisma.workoutPlan.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
            reply.send({ plans });
        }
        catch (error) {
            fastify.log.error(error);
            reply.code(500).send({ error: 'Internal server error' });
        }
    });
    // Generate AI workout plan
    fastify.post('/generate', async (request, reply) => {
        try {
            const userId = request.user.userId;
            const { goal, daysPerWeek = 3, focus } = request.query;
            // Get recent workouts
            const recentWorkouts = await prisma.workout.findMany({
                where: {
                    userId,
                    startedAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
                include: {
                    exercises: {
                        include: {
                            exercise: true,
                            sets: true,
                        },
                    },
                },
                orderBy: { startedAt: 'desc' },
                take: 10,
            });
            const exerciseFrequency = {};
            const maxWeights = {};
            const avgRepsAccumulator = {};
            const avgReps = {};
            recentWorkouts.forEach((workout) => {
                workout.exercises.forEach((we) => {
                    const name = we.exercise.name;
                    exerciseFrequency[name] = (exerciseFrequency[name] || 0) + 1;
                    we.sets.forEach((set) => {
                        if (typeof set.weight === 'number') {
                            maxWeights[name] = Math.max(maxWeights[name] || 0, set.weight);
                        }
                        if (typeof set.reps === 'number') {
                            const current = avgRepsAccumulator[name] || { sum: 0, count: 0 };
                            avgRepsAccumulator[name] = {
                                sum: current.sum + set.reps,
                                count: current.count + 1,
                            };
                        }
                    });
                });
            });
            Object.keys(avgRepsAccumulator).forEach((ex) => {
                const data = avgRepsAccumulator[ex];
                avgReps[ex] = Math.round(data.sum / data.count);
            });
            const availableExercises = await prisma.exercise.findMany({
                where: {
                    category: focus || undefined,
                },
                take: 50,
            });
            const plan = generateWorkoutPlan(availableExercises, exerciseFrequency, maxWeights, avgReps, Number(daysPerWeek), goal || 'general_fitness');
            const savedPlan = await prisma.workoutPlan.create({
                data: {
                    userId,
                    name: `AI Generated Plan - ${new Date().toLocaleDateString()}`,
                    goal: goal || 'general_fitness',
                    planData: JSON.stringify(plan),
                },
            });
            reply.send({ plan: savedPlan });
        }
        catch (error) {
            fastify.log.error(error);
            reply.code(500).send({ error: 'Internal server error' });
        }
    });
    // Create custom plan
    fastify.post('/', async (request, reply) => {
        try {
            const userId = request.user.userId;
            const body = createPlanSchema.parse(request.body);
            const plan = await prisma.workoutPlan.create({
                data: {
                    userId,
                    name: body.name,
                    goal: body.goal,
                    planData: JSON.stringify(body.planData),
                },
            });
            reply.code(201).send({ plan });
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
/**
 * Generate workout plan with progressive overload
 */
function generateWorkoutPlan(exercises, frequency, maxWeights, avgReps, daysPerWeek, goal) {
    const plan = {
        daysPerWeek,
        goal,
        workouts: [],
    };
    const sortedExercises = [...exercises].sort((a, b) => {
        return (frequency[a.name] || 0) - (frequency[b.name] || 0);
    });
    for (let day = 1; day <= daysPerWeek; day++) {
        const workout = {
            day,
            exercises: [],
        };
        const exercisesForDay = sortedExercises.slice((day - 1) * 5, day * 5);
        exercisesForDay.forEach((exercise) => {
            const currentMax = maxWeights[exercise.name] || 0;
            const currentReps = avgReps[exercise.name] || 8;
            const newWeight = currentMax > 0 ? currentMax * 1.025 : 20;
            const newReps = Math.min(currentReps + 1, 12);
            workout.exercises.push({
                exerciseId: exercise.id,
                exerciseName: exercise.name,
                sets: 3,
                reps: newReps,
                weight: Math.round(newWeight * 2) / 2,
                restSeconds: 60,
            });
        });
        plan.workouts.push(workout);
    }
    return plan;
}
//# sourceMappingURL=plans.js.map