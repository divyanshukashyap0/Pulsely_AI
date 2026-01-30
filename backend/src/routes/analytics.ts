import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

/**
 * Analytics routes for workout statistics and progress tracking
 */
export default async function analyticsRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);

  // Get workout statistics
  fastify.get('/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { startDate, endDate } = request.query as {
        startDate?: string;
        endDate?: string;
      };

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();

      // Total workouts
      const totalWorkouts = await prisma.workout.count({
        where: {
          userId,
          startedAt: { gte: start, lte: end },
          completedAt: { not: null },
        },
      });

      // Total volume (sum of weight * reps)
      const sets = await prisma.workoutSet.findMany({
        where: {
          userId,
          completedAt: { gte: start, lte: end },
          weight: { not: null },
          reps: { not: null },
        },
        select: {
          weight: true,
          reps: true,
        },
      });

      const totalVolume = sets.reduce((sum, set) => {
        return sum + (set.weight || 0) * (set.reps || 0);
      }, 0);

      // Workout frequency by day
      const workoutFrequency = await prisma.workout.groupBy({
        by: ['startedAt'],
        where: {
          userId,
          startedAt: { gte: start, lte: end },
        },
        _count: true,
      });

      // Muscle group distribution (from exercises)
      const exercises = await prisma.workoutExercise.findMany({
        where: {
          workout: {
            userId,
            startedAt: { gte: start, lte: end },
          },
        },
        include: {
          exercise: true,
        },
      });

      const muscleGroups: Record<string, number> = {};
      exercises.forEach((we) => {
        try {
          const groups = JSON.parse(we.exercise.muscleGroups || '[]') as string[];
          groups.forEach((group) => {
            muscleGroups[group] = (muscleGroups[group] || 0) + 1;
          });
        } catch {
          // Ignore parse errors
        }
      });

      reply.send({
        totalWorkouts,
        totalVolume,
        workoutFrequency: workoutFrequency.map((w) => ({
          date: w.startedAt,
          count: w._count,
        })),
        muscleGroups,
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get progress over time
  fastify.get('/progress', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { exerciseId, days = 30 } = request.query as {
        exerciseId?: string;
        days?: number;
      };

      const startDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

      const sets = await prisma.workoutSet.findMany({
        where: {
          userId,
          completedAt: { gte: startDate },
          ...(exerciseId && {
            workoutExercise: {
              exerciseId,
            },
          }),
        },
        include: {
          workoutExercise: {
            include: {
              exercise: true,
            },
          },
        },
        orderBy: { completedAt: 'asc' },
      });

      // Group by date and calculate daily stats
      const dailyStats: Record<string, { volume: number; maxWeight: number; totalReps: number }> = {};

      sets.forEach((set) => {
        const date = set.completedAt.toISOString().split('T')[0];
        if (!dailyStats[date]) {
          dailyStats[date] = { volume: 0, maxWeight: 0, totalReps: 0 };
        }

        const volume = (set.weight || 0) * (set.reps || 0);
        dailyStats[date].volume += volume;
        dailyStats[date].maxWeight = Math.max(dailyStats[date].maxWeight, set.weight || 0);
        dailyStats[date].totalReps += set.reps || 0;
      });

      reply.send({
        progress: Object.entries(dailyStats).map(([date, stats]) => ({
          date,
          ...stats,
        })),
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Internal server error' });
    }
  });
}
