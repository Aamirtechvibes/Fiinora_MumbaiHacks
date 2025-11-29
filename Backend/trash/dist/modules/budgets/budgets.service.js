"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetsService = void 0;
class BudgetsService {
    constructor(fastify) {
        this.fastify = fastify;
    }
    async createBudget(userId, data) {
        const budget = await this.fastify.prisma.budget.create({
            data: {
                userId,
                name: data.name,
                amount: data.amount,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                category: data.category || null,
            },
        });
        return this.formatBudget(budget);
    }
    async listBudgets(userId, query) {
        const { page, limit, archived } = query;
        const skip = (page - 1) * limit;
        const where = { userId };
        if (archived !== undefined)
            where.archived = archived;
        const [items, total] = await Promise.all([
            this.fastify.prisma.budget.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
            this.fastify.prisma.budget.count({ where }),
        ]);
        return {
            budgets: items.map((b) => this.formatBudget(b)),
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    }
    async getBudget(userId, id) {
        const budget = await this.fastify.prisma.budget.findFirst({ where: { id, userId } });
        if (!budget)
            throw new Error('BUDGET_NOT_FOUND');
        return this.formatBudget(budget);
    }
    async updateBudget(userId, id, data) {
        const existing = await this.fastify.prisma.budget.findFirst({ where: { id, userId } });
        if (!existing)
            throw new Error('BUDGET_NOT_FOUND');
        const updated = await this.fastify.prisma.budget.update({
            where: { id },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.amount !== undefined && { amount: data.amount }),
                ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
                ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
                ...(data.category !== undefined && { category: data.category }),
                ...(data.archived !== undefined && { archived: data.archived }),
            },
        });
        return this.formatBudget(updated);
    }
    async deleteBudget(userId, id) {
        const existing = await this.fastify.prisma.budget.findFirst({ where: { id, userId } });
        if (!existing)
            throw new Error('BUDGET_NOT_FOUND');
        await this.fastify.prisma.budget.delete({ where: { id } });
    }
    async getBudgetProgress(userId, id) {
        // Calculate progress by summing transactions in budget period matching category (if provided)
        const budget = await this.fastify.prisma.budget.findFirst({ where: { id, userId } });
        if (!budget)
            throw new Error('BUDGET_NOT_FOUND');
        const where = { userId, txnDate: { gte: budget.startDate, lte: budget.endDate } };
        if (budget.category)
            where.category = budget.category;
        const agg = await this.fastify.prisma.transaction.aggregate({
            where,
            _sum: { amount: true },
        });
        const spent = agg._sum.amount ? agg._sum.amount.toNumber ? agg._sum.amount.toNumber() : agg._sum.amount : 0;
        const progress = Math.min(100, (spent / Number(budget.amount)) * 100);
        return {
            budgetId: budget.id,
            name: budget.name,
            amount: Number(budget.amount),
            spent,
            progress,
        };
    }
    async simulateBudget(userId, dto) {
        // Simple simulation: project monthly spending based on historical average in same category
        const budget = await this.fastify.prisma.budget.findFirst({ where: { id: dto.budgetId, userId } });
        if (!budget)
            throw new Error('BUDGET_NOT_FOUND');
        // Calculate average monthly spend for the past 6 months in category
        const now = new Date();
        const past = new Date(now);
        past.setMonth(now.getMonth() - 6);
        const where = { userId, txnDate: { gte: past, lte: now } };
        if (budget.category)
            where.category = budget.category;
        const txn = await this.fastify.prisma.transaction.findMany({ where });
        const total = txn.reduce((s, t) => s + (t.amount.toNumber ? t.amount.toNumber() : t.amount), 0);
        const avgMonthly = total / 6;
        const months = dto.scenarioMonths || 6;
        const monthlyIncomeChange = dto.monthlyIncomeChangePercent || 0;
        const projection = [];
        for (let i = 0; i < months; i++) {
            const m = new Date(now);
            m.setMonth(now.getMonth() + i + 1);
            const factor = 1 + (monthlyIncomeChange / 100) * i;
            projection.push({ month: m.toISOString().slice(0, 7), expectedSpend: avgMonthly * factor });
        }
        return { budgetId: budget.id, avgMonthly, projection };
    }
    formatBudget(b) {
        return {
            id: b.id,
            name: b.name,
            amount: b.amount.toNumber ? b.amount.toNumber() : b.amount,
            startDate: b.startDate.toISOString(),
            endDate: b.endDate.toISOString(),
            category: b.category,
            archived: b.archived || false,
            createdAt: b.createdAt.toISOString(),
        };
    }
}
exports.BudgetsService = BudgetsService;
