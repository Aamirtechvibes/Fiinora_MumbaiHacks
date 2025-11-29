"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startPriceWorker = startPriceWorker;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
function startPriceWorker() {
    const connection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
    const worker = new bullmq_1.Worker('transactionQueue', async (job) => {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        try {
            if (job.name === 'price:update') {
                const { symbol } = job.data;
                const PriceFetcher = require('../../services/price.fetcher').default;
                const price = await PriceFetcher.fetchPrice(symbol);
                await prisma.investment.updateMany({ where: { symbol }, data: { currentPrice: price } });
                return { updated: true, symbol, price };
            }
            throw new Error('Unknown job');
        }
        finally {
            await prisma.$disconnect();
        }
    }, { connection });
    worker.on('failed', (job, err) => console.error('Price job failed', job?.id, err?.message || err));
    worker.on('completed', (job) => console.log('Price job completed', job.id));
    return { worker, connection };
}
if (require.main === module) {
    startPriceWorker();
}
