import { FastifyRequest, FastifyReply } from 'fastify';
export interface AuthUser {
    userId: string;
    email: string;
}
declare module 'fastify' {
    interface FastifyRequest {
        user?: AuthUser;
    }
}
/**
 * JWT Authentication middleware
 * Validates JWT token and attaches user info to request
 */
export declare function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
/**
 * Generate JWT token for user
 */
export declare function generateToken(user: AuthUser): string;
//# sourceMappingURL=auth.d.ts.map