"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = usersRoutes;
async function usersRoutes(fastify) {
    fastify.get('/me', async (req, reply) => {
        // naive auth: expect Authorization: Bearer <jwt>
        const auth = req.headers['authorization'];
        if (!auth?.startsWith('Bearer '))
            return reply.code(401).send({ error: 'Unauthorized' });
        const token = auth.split(' ')[1];
        // verify token
        try {
            const payload = require('jsonwebtoken').verify(token, process.env.JWT_ACCESS_TOKEN_SECRET || 'dev_access_secret');
            const user = await fastify.prisma.user.findUnique({ where: { id: payload.sub } });
            if (!user)
                return reply.code(404).send({ error: 'User not found' });
            reply.send({ id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified, role: user.role });
        }
        catch (err) {
            reply.code(401).send({ error: 'Invalid token' });
        }
    });
}
