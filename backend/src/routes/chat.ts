import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const chatMessageSchema = z.object({
  message: z.string().min(1),
});

/**
 * AI Fitness Coach Chat routes
 * Uses OpenAI API with chat history stored in MySQL
 */
export default async function chatRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', authenticate);

  // Get chat history
  fastify.get('/history', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const { limit = 50 } = request.query as { limit?: number };

      const messages = await prisma.chatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      reply.send({ messages: messages.reverse() });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Send message to AI coach
  fastify.post('/message', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.userId;
      const body = chatMessageSchema.parse(request.body);

      if (!OPENAI_API_KEY) {
        reply.code(500).send({ error: 'OpenAI API key not configured' });
        return;
      }

      // Get recent chat history (last 10 messages for context)
      const recentMessages = await prisma.chatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // Build conversation history for OpenAI
      const conversationHistory = recentMessages.reverse().map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

      // Add system prompt for injury-safe responses
      const systemPrompt = `You are Pulsely AI, a professional fitness coach. Your responses must:
1. Prioritize safety and injury prevention
2. Never recommend exercises that could cause harm
3. Suggest consulting healthcare professionals for medical concerns
4. Provide evidence-based fitness advice
5. Consider the user's workout history and goals
6. Be encouraging and supportive`;

      // Save user message
      await prisma.chatMessage.create({
        data: {
          userId,
          role: 'user',
          content: body.message,
        },
      });

      // Call OpenAI API
      try {
        // Try gpt-4 first, fallback to gpt-3.5-turbo if unavailable
        const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
        
        const response = await axios.post(
          OPENAI_API_URL,
          {
            model: model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...conversationHistory,
              { role: 'user', content: body.message },
            ],
            temperature: 0.7,
            max_tokens: 500,
          },
          {
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 second timeout
          }
        );

        if (!response.data?.choices?.[0]?.message?.content) {
          throw new Error('Invalid response format from OpenAI API');
        }

        const assistantMessage = response.data.choices[0].message.content;

        // Save assistant response
        const savedMessage = await prisma.chatMessage.create({
          data: {
            userId,
            role: 'assistant',
            content: assistantMessage,
          },
        });

        reply.send({ message: savedMessage });
      } catch (openaiError: any) {
        fastify.log.error('OpenAI API error:', {
          message: openaiError.message,
          response: openaiError.response?.data,
          status: openaiError.response?.status,
        });
        
        // Provide more helpful error messages
        let errorMessage = 'Failed to get AI response';
        if (openaiError.response?.status === 401) {
          errorMessage = 'Invalid OpenAI API key. Please check your configuration.';
        } else if (openaiError.response?.status === 429) {
          errorMessage = 'OpenAI API rate limit exceeded. Please try again later.';
        } else if (openaiError.response?.status === 404) {
          errorMessage = 'OpenAI model not found. Please check your model configuration.';
        } else if (openaiError.code === 'ECONNABORTED') {
          errorMessage = 'Request timeout. Please try again.';
        } else if (openaiError.response?.data?.error?.message) {
          errorMessage = openaiError.response.data.error.message;
        } else if (openaiError.message) {
          errorMessage = openaiError.message;
        }

        reply.code(500).send({
          error: errorMessage,
          details: openaiError.response?.data || openaiError.message,
        });
      }
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
