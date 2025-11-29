"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentsService = void 0;
class InvestmentsService {
    constructor(fastify) {
        this.fastify = fastify;
    }
    async listInvestments(userId, query) {
        const { page, limit } = query;
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.fastify.prisma.investment.findMany({ where: { userId }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
            this.fastify.prisma.investment.count({ where: { userId } }),
        ]);
        return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }
    async getInvestment(userId, id) {
        const inv = await this.fastify.prisma.investment.findFirst({ where: { id, userId } });
        if (!inv)
            throw new Error('NOT_FOUND');
        return inv;
    }
    async createInvestment(userId, data) {
        const inv = await this.fastify.prisma.investment.create({
            data: { userId, symbol: data.symbol.toUpperCase(), name: data.name || null, quantity: data.quantity, avgCost: data.avgCost, currency: data.currency },
        });
        // Optionally enqueue price update job
        const queue = this.fastify.bullmq?.transactionQueue;
        if (queue)
            await queue.add('price:update', { symbol: inv.symbol }, { attempts: 2 });
        return inv;
    }
    async updateInvestment(userId, id, data) {
        const existing = await this.getInvestment(userId, id);
        const updated = await this.fastify.prisma.investment.update({ where: { id }, data });
        return updated;
    }
    async deleteInvestment(userId, id) {
        const existing = await this.getInvestment(userId, id);
        await this.fastify.prisma.investment.delete({ where: { id } });
    }
    /**
     * Simple recommendations stub: returns static suggestions based on holdings.
     */
    async getRecommendations(userId) {
        // Fetch user's investments and compute allocation
        const investments = await this.fastify.prisma.investment.findMany({ where: { userId } });
        // If no investments, suggest basic starter portfolio
        if (!investments || investments.length === 0) {
            return {
                suggestions: [
                    { symbol: 'VTI', reason: 'Broad US market ETF for diversified exposure' },
                    { symbol: 'BND', reason: 'Bond ETF for stability' },
                ],
            };
        }
        // Very naive rule: if user holds mostly one symbol, suggest diversification
        const unique = new Set(investments.map((i) => i.symbol));
        if (unique.size === 1) {
            return { suggestions: [{ symbol: 'VTI', reason: 'Diversify beyond single holding' }] };
        }
        // Otherwise, return a neutral message
        return { suggestions: [{ note: 'Portfolio looks diversified. Consider reviewing fees and tax-loss harvesting.' }] };
    }
}
exports.InvestmentsService = InvestmentsService;
exports.default = InvestmentsService;
