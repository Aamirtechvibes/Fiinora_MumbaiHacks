"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = filesRoutes;
const files_service_1 = __importDefault(require("./files.service"));
async function filesRoutes(fastify) {
    const filesService = new files_service_1.default(fastify);
    // Auth middleware (simple bearer token -> userId)
    const authMiddleware = async (request, reply) => {
        const auth = request.headers['authorization'];
        if (!auth?.startsWith('Bearer ')) {
            return reply.status(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        }
        const token = auth.split(' ')[1];
        try {
            const payload = require('jsonwebtoken').verify(token, process.env.JWT_ACCESS_TOKEN_SECRET || 'dev_access_secret');
            request.userId = payload.sub;
        }
        catch (e) {
            return reply.status(401).send({ error: 'Invalid token', code: 'INVALID_TOKEN' });
        }
    };
    // POST /presign - request an upload presigned URL
    fastify.post('/presign', {
        onRequest: authMiddleware,
        schema: {
            summary: 'Get upload presigned URL',
            body: { type: 'object', required: ['filename'], properties: { filename: { type: 'string' }, contentType: { type: 'string' } } },
            response: { 200: { type: 'object', properties: { url: { type: 'string' }, key: { type: 'string' }, expiresAt: { type: 'string' } } } },
        },
    }, async (request, reply) => {
        try {
            const { filename, contentType } = request.body;
            if (!filename) {
                return reply.status(400).send({ error: 'filename is required', code: 'MISSING_FILENAME' });
            }
            const result = await filesService.getUploadPresign(request.userId, filename, contentType);
            return reply.send(result);
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
        }
    });
    // GET /presign?key=... - request a download presigned URL
    fastify.get('/presign', { onRequest: authMiddleware, schema: { querystring: { type: 'object', properties: { key: { type: 'string' } } } } }, async (request, reply) => {
        try {
            const { key } = request.query;
            if (!key) {
                return reply.status(400).send({ error: 'key is required', code: 'MISSING_KEY' });
            }
            const result = await filesService.getDownloadPresign(request.userId, key);
            return reply.send(result);
        }
        catch (error) {
            if (error.message === 'FORBIDDEN') {
                return reply.status(403).send({ error: 'Forbidden', code: 'FORBIDDEN' });
            }
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
        }
    });
    // POST / - save file metadata after upload
    fastify.post('/', {
        onRequest: authMiddleware,
        schema: {
            summary: 'Save file metadata',
            body: {
                type: 'object',
                required: ['key', 'filename'],
                properties: { key: { type: 'string' }, filename: { type: 'string' }, size: { type: 'number' }, mimeType: { type: 'string' } },
            },
        },
    }, async (request, reply) => {
        try {
            const body = request.body;
            if (!body.key || !body.filename) {
                return reply.status(400).send({ error: 'key and filename required', code: 'INVALID_DATA' });
            }
            const file = await filesService.saveMetadata(request.userId, {
                key: body.key,
                filename: body.filename,
                size: body.size,
                mimeType: body.mimeType,
            });
            return reply.status(201).send(file);
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
        }
    });
}
