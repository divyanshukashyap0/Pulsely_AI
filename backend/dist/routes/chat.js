import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
});
const chatMessageSchema = z.object({
    message: z.string().min(1),
});
export default async function chatRoutes(fastify) {
    fastify.addHook('onRequest', authenticate);
    /* ---------------- CHAT HISTORY ---------------- */
    fastify.get('/history', async (request, reply) => {
        try {
            const userId = request.user.userId;
            const { limit = 50 } = request.query;
            const messages = await prisma.chatMessage.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
            });
            reply.send({ messages: messages.reverse() });
        }
        catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal server error' });
        }
    });
    /* ---------------- SEND MESSAGE ---------------- */
    fastify.post('/message', async (request, reply) => {
        try {
            const userId = request.user.userId;
            const body = chatMessageSchema.parse(request.body);
            // Fetch recent messages for context
            const recentMessages = await prisma.chatMessage.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 10,
            });
            const conversation = recentMessages
                .reverse()
                .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
                .join('\n');
            const systemPrompt = `
You are Pulsely AI, a professional fitness coach.

Rules:
- Prioritize safety and injury prevention
- Never recommend harmful exercises
- Suggest medical professionals for health issues
- Use evidence-based fitness guidance
- Be supportive, encouraging, and clear

Conversation:
${conversation}

USER: ${body.message}
ASSISTANT:
      `.trim();
            // Save user message
            await prisma.chatMessage.create({
                data: {
                    userId,
                    role: 'user',
                    content: body.message,
                },
            });
            /* ----------- GEMINI CALL ----------- */
            const result = await model.generateContent(systemPrompt);
            const assistantText = result.response.text();
            if (!assistantText) {
                throw new Error('Empty response from Gemini');
            }
            const savedMessage = await prisma.chatMessage.create({
                data: {
                    userId,
                    role: 'assistant',
                    content: assistantText,
                },
            });
            reply.send({ message: savedMessage });
        }
        catch (err) {
            fastify.log.error('Gemini error:', err);
            let errorMessage = 'Failed to get AI response';
            if (err.message?.includes('API key')) {
                errorMessage = 'Invalid Gemini API key';
            }
            else if (err.message?.includes('quota')) {
                errorMessage = 'Gemini quota exceeded';
            }
            reply.code(500).send({
                error: errorMessage,
                details: err.message,
            });
        }
    });
}
//# sourceMappingURL=chat.js.map