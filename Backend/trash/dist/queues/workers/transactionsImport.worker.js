"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTransactionsImportWorker = startTransactionsImportWorker;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
/**
 * Minimal CSV import job worker.
 * Listens on the same queue name used by the service ('emailQueue')
 * and processes jobs with name 'csv-import'. Job data shape:
 * { userId: string, records: Array<{ accountId, amount, txnDate, merchant?, category? }> }
 */
function startTransactionsImportWorker() {
    const connection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
    const worker = new bullmq_1.Worker('transactionQueue', async (job) => {
        const { userId, records } = job.data;
        if (!records || !Array.isArray(records) || records.length === 0) {
            throw new Error('NO_RECORDS');
        }
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        try {
            // Normalize records for createMany
            const toInsert = records.map((r) => ({
                accountId: r.accountId,
                userId,
                amount: r.amount,
                txnDate: r.txnDate instanceof Date ? r.txnDate : new Date(r.txnDate),
                merchant: r.merchant || null,
                category: r.category || null,
                createdAt: new Date(),
            }));
            // Use createMany for speed; skipDuplicates to avoid obvious dupes (best-effort)
            await prisma.transaction.createMany({ data: toInsert, skipDuplicates: true });
            // Very small best-effort cache invalidation: delete wallet keys for the user
            try {
                const redis = require('ioredis');
                const r = new redis(process.env.REDIS_URL || 'redis://localhost:6379');
                const keys = await r.keys(`wallet:${userId}:*`);
                if (keys.length)
                    await r.del(...keys);
                await r.quit();
            }
            catch (e) {
                // ignore redis errors here
                console.warn('Failed to invalidate wallet cache', e?.message || e);
            }
            await prisma.$disconnect();
            return { imported: toInsert.length };
        }
        catch (err) {
            await prisma.$disconnect();
            console.error('Import job failed', err?.message || err);
            throw err;
        }
    }, { connection });
    worker.on('failed', (job, err) => {
        console.error('Import job failed', job?.id, err?.message || err);
    });
    worker.on('completed', (job) => {
        console.log('Import job completed', job.id);
    });
    return { worker, connection };
}
if (require.main === module) {
    startTransactionsImportWorker();
    console.log('Transactions import worker started');
}
