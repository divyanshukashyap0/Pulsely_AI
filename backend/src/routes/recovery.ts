import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const recoveryDataSchema = z.object({
  date: z.string().optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  sleepQuality: z.number().int().min(1).max(10).optional(),
  fatigueLevel: z.number().int().min(1).max(10).optional(),
  stressLevel: z.number().int().min(1).max(10).optional(),
  soreness: z.number().int().min(1).max(10).optional(),
  notes: z.string().optional(),
});

export default async function recoveryRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);

  // GET recovery data
  fastify.get('/data', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { startDate, endDate } = request.query as {
        startDate?: string;
        endDate?: string;
      };

      const where: any = { userId };

      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
      }

      const recoveryData = await prisma.recoveryData.findMany({
        where,
        orderBy: { date: 'desc' },
      });

      reply.send({ recoveryData });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // CREATE or UPDATE recovery data
  fastify.post('/data', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const body = recoveryDataSchema.parse(request.body);

      const date = body.date ? new Date(body.date) : new Date();
      date.setHours(0, 0, 0, 0);

      const existing = await prisma.recoveryData.findFirst({
        where: { userId, date },
      });

      const recoveryData = existing
        ? await prisma.recoveryData.update({
            where: { id: existing.id },
            data: {
              sleepHours: body.sleepHours,
              sleepQuality: body.sleepQuality,
              fatigueLevel: body.fatigueLevel,
              stressLevel: body.stressLevel,
              soreness: body.soreness,
              notes: body.notes,
            },
          })
        : await prisma.recoveryData.create({
            data: {
              userId,
              date,
              sleepHours: body.sleepHours,
              sleepQuality: body.sleepQuality,
              fatigueLevel: body.fatigueLevel,
              stressLevel: body.stressLevel,
              soreness: body.soreness,
              notes: body.notes,
            },
          });

      await calculateReadinessScore(userId, date);

      reply.send({ recoveryData });
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.code(400).send({ error: 'Validation error', details: error.errors });
        return;
      }
      fastify.log.error(error);
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // GET readiness scores
  fastify.get('/readiness', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { days = 30 } = request.query as { days?: number };

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(days));

      const scores = await prisma.readinessScore.findMany({
        where: {
          userId,
          date: { gte: startDate },
        },
        orderBy: { date: 'desc' },
      });

      reply.send({ scores });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Internal server error' });
    }
  });
}

/**
 * Calculate readiness score (0–100)
 */
async function calculateReadinessScore(userId: string, date: Date): Promise<void> {
  const recovery = await prisma.recoveryData.findFirst({
    where: { userId, date },
  });

  if (!recovery) return;

  // Sleep score
  let sleepScore = 50;
  if (recovery.sleepHours) {
    if (recovery.sleepHours >= 7 && recovery.sleepHours <= 9) sleepScore = 80;
    else if (recovery.sleepHours >= 6 && recovery.sleepHours <= 10) sleepScore = 60;
    else sleepScore = 40;
  }

  if (recovery.sleepQuality) {
    sleepScore = (sleepScore + recovery.sleepQuality * 10) / 2;
  }

  // Fatigue score
  let fatigueScore = 50;
  if (recovery.fatigueLevel) {
    fatigueScore = 100 - (recovery.fatigueLevel - 1) * 10;
  }

  // Previous day strain
  const previousDate = new Date(date);
  previousDate.setDate(previousDate.getDate() - 1);

  const workouts = await prisma.workout.findMany({
    where: {
      userId,
      startedAt: {
        gte: new Date(previousDate.setHours(0, 0, 0, 0)),
        lt: new Date(previousDate.setHours(23, 59, 59, 999)),
      },
    },
    include: { sets: true },
  });

  let totalVolume = 0;
  workouts.forEach((w) =>
    w.sets.forEach((s) => {
      totalVolume += (s.weight || 0) * (s.reps || 0);
    })
  );

  let strainScore = 100;
  if (totalVolume > 10000) strainScore = 60;
  else if (totalVolume > 5000) strainScore = 80;

  const overallScore = Math.round(
    sleepScore * 0.4 + fatigueScore * 0.3 + strainScore * 0.3
  );

  const existingScore = await prisma.readinessScore.findFirst({
    where: { userId, date },
  });

  if (existingScore) {
    await prisma.readinessScore.update({
      where: { id: existingScore.id },
      data: {
        score: overallScore,
        sleepScore,
        fatigueScore,
        strainScore,
        factors: JSON.stringify({
          sleepHours: recovery.sleepHours,
          sleepQuality: recovery.sleepQuality,
          fatigueLevel: recovery.fatigueLevel,
          previousDayVolume: totalVolume,
        }),
      },
    });
  } else {
    await prisma.readinessScore.create({
      data: {
        userId,
        date,
        score: overallScore,
        sleepScore,
        fatigueScore,
        strainScore,
        factors: JSON.stringify({
          sleepHours: recovery.sleepHours,
          sleepQuality: recovery.sleepQuality,
          fatigueLevel: recovery.fatigueLevel,
          previousDayVolume: totalVolume,
        }),
      },
    });
  }
}
