"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingsService = void 0;
class EmbeddingsService {
    constructor(fastify, dim = 1536) {
        this.fastify = fastify;
        this.dim = dim;
    }
    // Create embedding for a text. In prod this should call an embeddings provider (OpenAI, Cohere, etc.).
    // For tests this method will be mocked.
    async createEmbedding(text) {
        // Simple deterministic fallback: hash chars to floats (only used when no external provider configured)
        if (!text)
            return [];
        const seed = Array.from(text).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        const out = new Array(this.dim).fill(0).map((_, i) => {
            const v = Math.sin(seed + i) * 0.5 + 0.5;
            return Number((v % 1).toFixed(6));
        });
        return out;
    }
    // Store embedding in the chosen backend (pgvector by default, Pinecone when USE_PINECONE=1)
    async storeEmbedding(userId, content, embedding, metadata) {
        if (process.env.USE_PINECONE === '1' || process.env.USE_PINECONE === 'true') {
            // Pinecone storage path. The Pinecone client can be attached to fastify via plugin in production.
            const pinecone = this.fastify.pineconeClient;
            const indexName = process.env.PINECONE_INDEX || 'finora-ai-context';
            if (!pinecone)
                throw new Error('Pinecone client not configured');
            // upsert vector
            await pinecone.upsert({ index: indexName, id: `${userId}:${Date.now()}:${Math.random()}`, values: embedding, metadata: { userId, content, ...metadata } });
            return;
        }
        // pgvector storage: insert into AiContext using raw SQL. We inline the vector as '[0.1,0.2]'::vector
        const embStr = '[' + embedding.join(',') + ']';
        const metadataJson = metadata ? JSON.stringify(metadata) : null;
        const sql = `INSERT INTO "AiContext" (id, user_id, content, embedding, metadata, created_at) VALUES (gen_random_uuid(), $1::uuid, $2::text, $3::vector, $4::jsonb, now())`;
        // embedding value must be provided as a string like '[0.1,0.2]'
        await this.fastify.prisma.$executeRawUnsafe(sql.replace('$3', `'${embStr}'`), userId, content, metadataJson);
    }
    // Query similar contexts for a user using pgvector or Pinecone
    async querySimilar(userId, embedding, limit = 5) {
        if (process.env.USE_PINECONE === '1' || process.env.USE_PINECONE === 'true') {
            const pinecone = this.fastify.pineconeClient;
            const indexName = process.env.PINECONE_INDEX || 'finora-ai-context';
            if (!pinecone)
                throw new Error('Pinecone client not configured');
            const res = await pinecone.query({ index: indexName, vector: embedding, topK: limit, filter: { userId } });
            return res.matches.map((m) => ({ id: m.id, score: m.score, content: m.metadata?.content, metadata: m.metadata }));
        }
        const embStr = '[' + embedding.join(',') + ']';
        const sql = `SELECT id, user_id as "userId", content, metadata, created_at as "createdAt", embedding <-> $1::vector as distance FROM "AiContext" WHERE user_id = $2::uuid ORDER BY embedding <-> $1::vector LIMIT $3`;
        // We replace $1 with the emb string since parameterizing vector is tricky with prisma client
        const finalSql = sql.replace('$1', `'${embStr}'`);
        const rows = await this.fastify.prisma.$queryRawUnsafe(finalSql.replace('$2', `'${userId}'`).replace('$3', String(limit)));
        return rows.map(r => ({ id: r.id, content: r.content, metadata: r.metadata, distance: r.distance }));
    }
}
exports.EmbeddingsService = EmbeddingsService;
exports.default = EmbeddingsService;
