"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGamificationWorker = startGamificationWorker;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
/**
 * Gamification worker: processes badge awarding and leaderboard computation jobs.
 * Listens on the `transactionQueue` for:
 * - gamification:check — award badges and points to user
 * - gamification:leaderboard — compute and cache weekly leaderboard
 */
function startGamificationWorker() {
    const connection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
    const worker = new bullmq_1.Worker('transactionQueue', async (job) => {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
        try {
            if (job.name === 'gamification:check') {
                // Check if user qualifies for badges
                const { userId } = job.data;
                // Award "First Transaction" badge if user has any transaction
                const txnCount = await prisma.transaction.count({ where: { userId } });
                if (txnCount === 1) {
                    const badge = await prisma.badge.findUnique({ where: { name: 'First Transaction' } });
                    if (badge) {
                        await prisma.userBadge.upsert({
                            where: { userId_badgeId: { userId, badgeId: badge.id } },
                            create: { userId, badgeId: badge.id },
                            update: {},
                        });
                        await prisma.pointsTransaction.create({ data: { userId, points: 10, reason: 'Badge: First Transaction' } });
                    }
                }
                // Award "Goal Setter" if user has created a budget/goal
                const goalCount = await prisma.budget.count({ where: { userId } }).catch(() => 0);
                if (goalCount >= 1) {
                    const badge = await prisma.badge.findUnique({ where: { name: 'Goal Setter' } });
                    if (badge) {
                        await prisma.userBadge.upsert({
                            where: { userId_badgeId: { userId, badgeId: badge.id } },
                            create: { userId, badgeId: badge.id },
                            update: {},
                        });
                    }
                }
                return { awarded: true };
            }
            else if (job.name === 'gamification:leaderboard') {
                // Compute weekly leaderboard
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                const points = await prisma.pointsTransaction.groupBy({
                    by: ['userId'],
                    where: { createdAt: { gte: sevenDaysAgo } },
                    _sum: { points: true },
                });
                const ranked = points
                    .map((p) => ({ userId: p.userId, points: p._sum.points || 0 }))
                    .sort((a, b) => b.points - a.points);
                // Cache for 1 hour
                await redis.setex('gamification:leaderboard:weekly', 3600, JSON.stringify(ranked));
                return { computed: true, count: ranked.length };
            }
            throw new Error('Unknown job type');
        }
        catch (err) {
            console.error('Gamification job failed', err?.message || err);
            throw err;
        }
        finally {
            await prisma.$disconnect();
            await redis.quit();
        }
    }, { connection });
    worker.on('failed', (job, err) => {
        console.error('Gamification job failed', job?.id, err?.message || err);
    });
    worker.on('completed', (job) => {
        console.log('Gamification job completed', job.id, job.name);
    });
    return { worker, connection };
}
if (require.main === module) {
    startGamificationWorker();
    console.log('Gamification worker started');
}
