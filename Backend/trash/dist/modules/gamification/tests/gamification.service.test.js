"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const gamification_service_1 = __importDefault(require("../gamification.service"));
(0, globals_1.describe)('GamificationService', () => {
    let service;
    let mockFastify;
    let mockPrisma;
    let mockRedis;
    (0, globals_1.beforeEach)(() => {
        mockRedis = { get: globals_1.jest.fn(), setex: globals_1.jest.fn() };
        mockPrisma = {
            badge: {
                findMany: globals_1.jest.fn(),
                findUnique: globals_1.jest.fn(),
                count: globals_1.jest.fn(),
            },
            userBadge: {
                findMany: globals_1.jest.fn(),
                findUnique: globals_1.jest.fn(),
                create: globals_1.jest.fn(),
            },
            pointsTransaction: {
                findMany: globals_1.jest.fn(),
                create: globals_1.jest.fn(),
                groupBy: globals_1.jest.fn(),
            },
            challengeProgress: {
                findMany: globals_1.jest.fn(),
                findUnique: globals_1.jest.fn(),
                create: globals_1.jest.fn(),
                update: globals_1.jest.fn(),
            },
            challenge: {
                findUnique: globals_1.jest.fn(),
            },
        };
        mockFastify = { prisma: mockPrisma, redis: mockRedis, log: { warn: globals_1.jest.fn() } };
        service = new gamification_service_1.default(mockFastify);
    });
    (0, globals_1.it)('should get badges with pagination', async () => {
        mockPrisma.badge.findMany.mockResolvedValue([{ id: 'b1', name: 'First Badge' }]);
        mockPrisma.badge.count.mockResolvedValue(1);
        const result = await service.getBadges(1, 20);
        (0, globals_1.expect)(result.badges.length).toBe(1);
        (0, globals_1.expect)(result.pagination.page).toBe(1);
    });
    (0, globals_1.it)('should get user profile with badges and points', async () => {
        mockPrisma.userBadge.findMany.mockResolvedValue([{ badge: { id: 'b1', name: 'First Badge' }, earnedAt: new Date() }]);
        mockPrisma.pointsTransaction.findMany.mockResolvedValue([{ points: 10 }, { points: 5 }]);
        mockPrisma.challengeProgress.findMany.mockResolvedValue([]);
        const profile = await service.getUserProfile('u1');
        (0, globals_1.expect)(profile.userId).toBe('u1');
        (0, globals_1.expect)(profile.totalPoints).toBe(15);
    });
    (0, globals_1.it)('should award badge if not already earned', async () => {
        const badge = { id: 'b1', name: 'First Badge' };
        mockPrisma.badge.findUnique.mockResolvedValue(badge);
        mockPrisma.userBadge.findUnique.mockResolvedValue(null);
        mockPrisma.userBadge.create.mockResolvedValue({ userId: 'u1', badgeId: 'b1' });
        const result = await service.awardBadge('u1', 'First Badge');
        (0, globals_1.expect)(result).toHaveProperty('badgeId');
    });
    (0, globals_1.it)('should not duplicate badge award', async () => {
        const badge = { id: 'b1', name: 'First Badge' };
        mockPrisma.badge.findUnique.mockResolvedValue(badge);
        const existing = { userId: 'u1', badgeId: 'b1' };
        mockPrisma.userBadge.findUnique.mockResolvedValue(existing);
        const result = await service.awardBadge('u1', 'First Badge');
        (0, globals_1.expect)(result).toEqual(existing);
        (0, globals_1.expect)(mockPrisma.userBadge.create).not.toHaveBeenCalled();
    });
    (0, globals_1.it)('should award points to user', async () => {
        mockPrisma.pointsTransaction.create.mockResolvedValue({ id: 'pt1', userId: 'u1', points: 10, reason: 'TEST' });
        const result = await service.awardPoints('u1', 10, 'TEST');
        (0, globals_1.expect)(result.points).toBe(10);
    });
    (0, globals_1.it)('should update challenge progress and mark complete', async () => {
        const challenge = { id: 'ch1', name: 'First Transaction', target: 1 };
        mockPrisma.challenge.findUnique.mockResolvedValue(challenge);
        mockPrisma.challengeProgress.findUnique.mockResolvedValue(null);
        mockPrisma.challengeProgress.create.mockResolvedValue({ id: 'cp1', progress: 1 });
        const result = await service.updateChallengeProgress('u1', 'First Transaction', 1);
        (0, globals_1.expect)(result.progress).toBe(1);
    });
    (0, globals_1.it)('should return cached leaderboard if available', async () => {
        const cached = [{ userId: 'u1', points: 50 }];
        mockRedis.get.mockResolvedValue(JSON.stringify(cached));
        const result = await service.getWeeklyLeaderboard(10);
        (0, globals_1.expect)(result).toEqual(cached);
    });
});
