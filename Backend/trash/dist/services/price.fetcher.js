"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PriceFetcher {
    static async fetchPrice(symbol) {
        // Minimal placeholder: return a pseudo-random price for demo/testing.
        // Replace with real provider (AlphaVantage, IEX, Yahoo) in production.
        const base = 100 + (symbol.charCodeAt(0) % 50);
        const fluct = Math.round((Math.random() - 0.5) * 200) / 100;
        return Math.max(0.01, base + fluct);
    }
    static async updateInvestmentPrice(prisma, symbol) {
        const price = await PriceFetcher.fetchPrice(symbol);
        // update all investments with this symbol
        await prisma.investment.updateMany({ where: { symbol }, data: { currentPrice: price } });
        return price;
    }
}
exports.default = PriceFetcher;
