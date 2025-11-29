"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
class WalletService {
    constructor(fastify) {
        this.cacheKeyPrefix = 'wallet';
        this.cacheTTL = 60; // 60 seconds
        this.fastify = fastify;
    }
    getCacheKey(userId, type, params = '') {
        return `${this.cacheKeyPrefix}:${userId}:${type}${params ? ':' + params : ''}`;
    }
    async getSummary(userId, period = 'month') {
        const cacheKey = this.getCacheKey(userId, 'summary', period);
        // Try cache first
        const cached = await this.fastify.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        // Calculate period dates
        const now = new Date();
        const startDate = this.getPeriodStartDate(now, period);
        const prisma = this.fastify.prisma;
        // Get accounts and calculate net worth
        const accounts = await prisma.account.findMany({
            where: { userId },
        });
        const netWorth = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
        // Get transactions in period
        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                txnDate: { gte: startDate, lte: now },
            },
        });
        // Calculate income and expense
        const income = transactions
            .filter(t => Number(t.amount) > 0)
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const expense = transactions
            .filter(t => Number(t.amount) < 0)
            .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
        // Top categories
        const categorySpend = {};
        transactions.forEach(t => {
            const cat = t.category || 'Other';
            categorySpend[cat] = (categorySpend[cat] || 0) + Math.abs(Number(t.amount));
        });
        const topCategories = Object.entries(categorySpend)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([category, amount]) => ({ category, amount }));
        // Trend: last 6 months
        const trend = await this.calculateTrend(userId);
        const result = {
            netWorth,
            totalIncome: income,
            totalExpense: expense,
            topCategories,
            trend,
            period,
            generatedAt: new Date().toISOString(),
        };
        // Cache result
        await this.fastify.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(result));
        return result;
    }
    async getCashflow(userId, from, to) {
        const cacheKey = this.getCacheKey(userId, 'cashflow', `${from}_${to}`);
        const cached = await this.fastify.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const startDate = new Date(from);
        const endDate = new Date(to);
        const prisma = this.fastify.prisma;
        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
                txnDate: { gte: startDate, lte: endDate },
            },
            orderBy: { txnDate: 'asc' },
        });
        // Aggregate by day
        const dailyData = {};
        transactions.forEach(t => {
            const day = t.txnDate.toISOString().split('T')[0];
            if (!dailyData[day]) {
                dailyData[day] = { income: 0, expense: 0 };
            }
            const amount = Number(t.amount);
            if (amount > 0) {
                dailyData[day].income += amount;
            }
            else {
                dailyData[day].expense += Math.abs(amount);
            }
        });
        const result = Object.entries(dailyData).map(([date, data]) => ({
            date,
            ...data,
            net: data.income - data.expense,
        }));
        await this.fastify.redis.setex(cacheKey, this.cacheTTL, JSON.stringify(result));
        return result;
    }
    async getNetworth(userId, months = 12) {
        const cacheKey = this.getCacheKey(userId, 'networth', `${months}m`);
        const cached = await this.fastify.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const prisma = this.fastify.prisma;
        const points = [];
        // Generate monthly snapshots
        for (let i = months; i >= 0; i--) {
            const snapshotDate = new Date();
            snapshotDate.setMonth(snapshotDate.getMonth() - i);
            snapshotDate.setDate(1); // First of month
            const accounts = await prisma.account.findMany({
                where: { userId },
            });
            const netWorth = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
            points.push({
                date: snapshotDate.toISOString().split('T')[0],
                netWorth,
            });
        }
        await this.fastify.redis.setex(cacheKey, this.cacheTTL * 10, JSON.stringify(points)); // Longer cache for historical data
        return points;
    }
    getPeriodStartDate(now, period) {
        const start = new Date(now);
        switch (period) {
            case 'week':
                start.setDate(now.getDate() - 7);
                break;
            case 'month':
                start.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                start.setFullYear(now.getFullYear() - 1);
                break;
        }
        return start;
    }
    async calculateTrend(userId) {
        const prisma = this.fastify.prisma;
        const trend = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const month = date.toISOString().substring(0, 7);
            const transactions = await prisma.transaction.findMany({
                where: {
                    userId,
                    txnDate: {
                        gte: new Date(date.getFullYear(), date.getMonth(), 1),
                        lt: new Date(date.getFullYear(), date.getMonth() + 1, 1),
                    },
                },
            });
            const amount = transactions
                .filter(t => Number(t.amount) > 0)
                .reduce((sum, t) => sum + Number(t.amount), 0);
            trend.push({ month, amount });
        }
        return trend;
    }
    async invalidateCache(userId) {
        const pattern = `${this.cacheKeyPrefix}:${userId}:*`;
        const keys = await this.fastify.redis.keys(pattern);
        if (keys.length > 0) {
            await this.fastify.redis.del(...keys);
        }
    }
}
exports.WalletService = WalletService;
