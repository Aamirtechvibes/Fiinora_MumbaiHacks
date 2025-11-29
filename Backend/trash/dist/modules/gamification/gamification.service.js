"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamificationService = void 0;
class GamificationService {
    constructor(fastify) {
        this.fastify = fastify;
    }
    /**
     * Get all available badges with pagination.
     */
    async getBadges(page, limit) {
        const skip = (page - 1) * limit;
        const [badges, total] = await Promise.all([
            this.fastify.prisma.badge.findMany({ skip, take: limit, orderBy: { createdAt: 'asc' } }),
            this.fastify.prisma.badge.count(),
        ]);
        return {
            badges,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    }
    /**
     * Get user's profile: earned badges, points, progress on challenges.
     */
    async getUserProfile(userId) {
        const [userBadges, pointsTxns, challengeProgress] = await Promise.all([
            this.fastify.prisma.userBadge.findMany({
                where: { userId },
                include: { badge: true },
            }),
            this.fastify.prisma.pointsTransaction.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
            this.fastify.prisma.challengeProgress.findMany({
                where: { userId },
                include: { challenge: true },
            }),
        ]);
        const totalPoints = pointsTxns.reduce((sum, pt) => sum + pt.points, 0);
        return {
            userId,
            badges: userBadges.map((ub) => ({ ...ub.badge, earnedAt: ub.earnedAt })),
            totalPoints,
            challenges: challengeProgress.map((cp) => ({
                challengeId: cp.challenge.id,
                name: cp.challenge.name,
                progress: cp.progress,
                target: cp.challenge.target,
                completed: !!cp.completedAt,
                rewardPoints: cp.challenge.rewardPoints,
            })),
        };
    }
    /**
     * Get weekly leaderboard (cached for performance).
     * Calls leaderboard:compute job if cache miss.
     */
    async getWeeklyLeaderboard(limit) {
        const cacheKey = 'gamification:leaderboard:weekly';
        try {
            const cached = await this.fastify.redis.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        }
        catch (e) {
            this.fastify.log.warn('Redis cache miss or error', e);
        }
        // Compute fresh leaderboard
        const leaderboard = await this.computeWeeklyLeaderboard();
        const result = leaderboard.slice(0, limit);
        // Cache for 1 hour
        try {
            await this.fastify.redis.setex(cacheKey, 3600, JSON.stringify(result));
        }
        catch (e) {
            this.fastify.log.warn('Failed to cache leaderboard', e);
        }
        return result;
    }
    /**
     * Compute weekly leaderboard based on PointsTransaction created in the last 7 days.
     */
    async computeWeeklyLeaderboard() {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const points = await this.fastify.prisma.pointsTransaction.groupBy({
            by: ['userId'],
            where: { createdAt: { gte: sevenDaysAgo } },
            _sum: { points: true },
        });
        const ranked = points
            .map((p) => ({
            userId: p.userId,
            points: p._sum.points || 0,
        }))
            .sort((a, b) => b.points - a.points);
        return ranked;
    }
    /**
     * Award badge to user if not already earned.
     */
    async awardBadge(userId, badgeName) {
        const badge = await this.fastify.prisma.badge.findUnique({
            where: { name: badgeName },
        });
        if (!badge) {
            throw new Error('BADGE_NOT_FOUND');
        }
        // Avoid duplication
        const existing = await this.fastify.prisma.userBadge.findUnique({
            where: { userId_badgeId: { userId, badgeId: badge.id } },
        });
        if (existing) {
            return existing;
        }
        return this.fastify.prisma.userBadge.create({
            data: { userId, badgeId: badge.id },
        });
    }
    /**
     * Award points to user for an action (e.g., first transaction, login, goal created).
     * Creates a PointsTransaction record.
     */
    async awardPoints(userId, points, reason) {
        return this.fastify.prisma.pointsTransaction.create({
            data: { userId, points, reason },
        });
    }
    /**
     * Update progress on a challenge and mark complete if target reached.
     * Does NOT auto-award badge or points; callers should handle that.
     */
    async updateChallengeProgress(userId, challengeName, increment) {
        const challenge = await this.fastify.prisma.challenge.findUnique({
            where: { name: challengeName },
        });
        if (!challenge) {
            throw new Error('CHALLENGE_NOT_FOUND');
        }
        let progress = await this.fastify.prisma.challengeProgress.findUnique({
            where: { userId_challengeId: { userId, challengeId: challenge.id } },
        });
        if (!progress) {
            progress = await this.fastify.prisma.challengeProgress.create({
                data: { userId, challengeId: challenge.id, progress: increment },
            });
        }
        else {
            const newProgress = progress.progress + increment;
            const completed = newProgress >= challenge.target && !progress.completedAt;
            progress = await this.fastify.prisma.challengeProgress.update({
                where: { id: progress.id },
                data: {
                    progress: newProgress,
                    completedAt: completed ? new Date() : progress.completedAt,
                },
            });
        }
        return progress;
    }
    /**
     * Enqueue gamification:check job to award badges and points based on user activity.
     */
    async enqueueGamificationCheck(userId) {
        const queue = this.fastify.bullmq?.transactionQueue;
        if (!queue)
            return;
        await queue.add('gamification:check', { userId }, { attempts: 2, backoff: { type: 'exponential', delay: 1000 } });
    }
    /**
     * Enqueue leaderboard computation job.
     */
    async enqueueLeaderboardCompute() {
        const queue = this.fastify.bullmq?.transactionQueue;
        if (!queue)
            return;
        await queue.add('gamification:leaderboard', {}, { attempts: 1 });
    }
}
exports.GamificationService = GamificationService;
exports.default = GamificationService;
