import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const createPlanSchema = z.object({
  name: z.string().min(1),
  goal: z.string().optional(),
  planData: z.record(z.any()), // JSON object with workout plan structure
});

/**
 * AI Workout Planner routes
 * Generates and manages workout plans based on user history and goals
 */
export default async function planRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);

  // Get all workout plans
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;

      const plans = await prisma.workoutPlan.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      reply.send({ plans });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Generate AI workout plan
  fastify.post('/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { goal, daysPerWeek = 3, focus } = request.query as {
        goal?: string;
        daysPerWeek?: number;
        focus?: string;
      };

      // Get user's workout history for progressive overload
      const recentWorkouts = await prisma.workout.findMany({
        where: {
          userId,
          startedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
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

      // Analyze workout patterns
      const exerciseFrequency: Record<string, number> = {};
      const maxWeights: Record<string, number> = {};
      const avgReps: Record<string, number> = {};

      recentWorkouts.forEach((workout) => {
        workout.exercises.forEach((we) => {
          const exerciseName = we.exercise.name;
          exerciseFrequency[exerciseName] = (exerciseFrequency[exerciseName] || 0) + 1;

          we.sets.forEach((set) => {
            if (set.weight) {
              maxWeights[exerciseName] = Math.max(
                maxWeights[exerciseName] || 0,
                set.weight
              );
            }
            if (set.reps) {
              const current = avgReps[exerciseName] || { sum: 0, count: 0 };
              avgReps[exerciseName] = {
                sum: current.sum + set.reps,
                count: current.count + 1,
              };
            }
          });
        });
      });

      // Calculate averages
      Object.keys(avgReps).forEach((ex) => {
        const data = avgReps[ex];
        avgReps[ex] = Math.round(data.sum / data.count);
      });

      // Get available exercises
      const availableExercises = await prisma.exercise.findMany({
        where: {
          category: focus || undefined,
        },
        take: 50,
      });

      // Generate workout plan using progressive overload logic
      const plan = generateWorkoutPlan(
        availableExercises,
        exerciseFrequency,
        maxWeights,
        avgReps,
        Number(daysPerWeek),
        goal || 'general_fitness'
      );

      // Save plan
      const savedPlan = await prisma.workoutPlan.create({
        data: {
          userId,
          name: `AI Generated Plan - ${new Date().toLocaleDateString()}`,
          goal: goal || 'general_fitness',
          planData: JSON.stringify(plan),
        },
      });

      reply.send({ plan: savedPlan });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Create custom plan
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
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
    } catch (error) {
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
function generateWorkoutPlan(
  exercises: any[],
  frequency: Record<string, number>,
  maxWeights: Record<string, number>,
  avgReps: Record<string, number>,
  daysPerWeek: number,
  goal: string
): any {
  const plan: any = {
    daysPerWeek,
    goal,
    workouts: [],
  };

  // Select exercises based on frequency (prefer less frequent for variety)
  const sortedExercises = exercises.sort((a, b) => {
    const freqA = frequency[a.name] || 0;
    const freqB = frequency[b.name] || 0;
    return freqA - freqB;
  });

  // Create workouts for each day
  for (let day = 1; day <= daysPerWeek; day++) {
    const workout: any = {
      day,
      exercises: [],
    };

    // Select 4-6 exercises per workout
    const exercisesForDay = sortedExercises.slice((day - 1) * 5, day * 5);

    exercisesForDay.forEach((exercise) => {
      const currentMax = maxWeights[exercise.name] || 0;
      const currentReps = avgReps[exercise.name] || 8;

      // Progressive overload: increase weight by 2.5-5% or reps by 1-2
      const newWeight = currentMax > 0 ? currentMax * 1.025 : 20; // 2.5% increase
      const newReps = currentReps + 1; // Add 1 rep

      workout.exercises.push({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sets: 3,
        reps: Math.min(newReps, 12), // Cap at 12 reps
        weight: Math.round(newWeight * 2) / 2, // Round to nearest 0.5kg
        restSeconds: 60,
      });
    });

    plan.workouts.push(workout);
  }

  return plan;
}
