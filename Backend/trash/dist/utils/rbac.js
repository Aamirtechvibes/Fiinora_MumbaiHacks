"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminRole = requireAdminRole;
const jwt_service_1 = require("../services/jwt.service");
async function requireAdminRole(request, reply) {
    const header = request.headers['authorization'];
    if (!header?.startsWith('Bearer '))
        return reply.status(401).send({ error: 'Unauthorized' });
    try {
        const payload = (0, jwt_service_1.verifyAccessToken)(header.split(' ')[1]);
        if (!payload || payload.role !== 'ADMIN')
            return reply.status(403).send({ error: 'Forbidden' });
        request.userId = payload.sub;
    }
    catch (e) {
        return reply.status(401).send({ error: 'Invalid token' });
    }
}
exports.default = requireAdminRole;
