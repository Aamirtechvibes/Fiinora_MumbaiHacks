"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
class TransactionsService {
    constructor(fastify) {
        this.fastify = fastify;
    }
    async createTransaction(userId, data) {
        // Verify account belongs to user
        const account = await this.fastify.prisma.account.findFirst({
            where: { id: data.accountId, userId },
        });
        if (!account) {
            throw new Error('ACCOUNT_NOT_FOUND');
        }
        const transaction = await this.fastify.prisma.transaction.create({
            data: {
                accountId: data.accountId,
                userId,
                txnDate: new Date(data.txnDate),
                amount: data.amount,
                category: data.category || null,
                merchant: data.merchant || null,
            },
        });
        // Invalidate wallet cache for this user
        await this.invalidateWalletCache(userId);
        return this.formatTransaction(transaction);
    }
    async listTransactions(userId, query) {
        const { page, limit, category, merchant, fromDate, toDate, minAmount, maxAmount, } = query;
        const skip = (page - 1) * limit;
        const where = { userId };
        if (category)
            where.category = category;
        if (merchant)
            where.merchant = { contains: merchant, mode: 'insensitive' };
        if (fromDate || toDate) {
            where.txnDate = {};
            if (fromDate)
                where.txnDate.gte = new Date(fromDate);
            if (toDate)
                where.txnDate.lte = new Date(toDate);
        }
        if (minAmount !== undefined || maxAmount !== undefined) {
            where.amount = {};
            if (minAmount !== undefined)
                where.amount.gte = minAmount;
            if (maxAmount !== undefined)
                where.amount.lte = maxAmount;
        }
        const [transactions, total] = await Promise.all([
            this.fastify.prisma.transaction.findMany({
                where,
                skip,
                take: limit,
                orderBy: { txnDate: 'desc' },
            }),
            this.fastify.prisma.transaction.count({ where }),
        ]);
        return {
            transactions: transactions.map((t) => this.formatTransaction(t)),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async updateTransaction(userId, transactionId, data) {
        // Verify transaction belongs to user
        const existing = await this.fastify.prisma.transaction.findFirst({
            where: { id: transactionId, userId },
        });
        if (!existing) {
            throw new Error('TRANSACTION_NOT_FOUND');
        }
        const updated = await this.fastify.prisma.transaction.update({
            where: { id: transactionId },
            data: {
                ...(data.amount !== undefined && { amount: data.amount }),
                ...(data.txnDate !== undefined && { txnDate: new Date(data.txnDate) }),
                ...(data.category !== undefined && { category: data.category }),
                ...(data.merchant !== undefined && { merchant: data.merchant }),
            },
        });
        // Invalidate wallet cache
        await this.invalidateWalletCache(userId);
        return this.formatTransaction(updated);
    }
    async deleteTransaction(userId, transactionId) {
        // Verify transaction belongs to user
        const existing = await this.fastify.prisma.transaction.findFirst({
            where: { id: transactionId, userId },
        });
        if (!existing) {
            throw new Error('TRANSACTION_NOT_FOUND');
        }
        await this.fastify.prisma.transaction.delete({
            where: { id: transactionId },
        });
        // Invalidate wallet cache
        await this.invalidateWalletCache(userId);
    }
    async enqueueCsvImportJob(userId, fileStream) {
        return new Promise((resolve, reject) => {
            let csvContent = '';
            const records = [];
            fileStream.on('data', (chunk) => {
                csvContent += chunk.toString();
            });
            fileStream.on('end', async () => {
                try {
                    const lines = csvContent.split('\n').filter((line) => line.trim());
                    if (lines.length < 2) {
                        reject(new Error('INVALID_CSV'));
                        return;
                    }
                    // Parse CSV manually (skip header)
                    for (let i = 1; i < lines.length; i++) {
                        const values = lines[i].split(',').map((v) => v.trim());
                        if (values.length < 5)
                            continue;
                        const [merchant, category, amount, txnDate, accountId] = values;
                        // Validate required fields
                        if (!amount || !txnDate || !accountId) {
                            continue;
                        }
                        records.push({
                            merchant: merchant || null,
                            category: category || null,
                            amount: parseFloat(amount),
                            txnDate: new Date(txnDate),
                            accountId,
                        });
                    }
                    if (records.length === 0) {
                        reject(new Error('INVALID_CSV'));
                        return;
                    }
                    // Enqueue BullMQ job using dedicated transactionQueue
                    const jobQueue = this.fastify.bullmq?.transactionQueue;
                    if (!jobQueue) {
                        reject(new Error('QUEUE_NOT_AVAILABLE'));
                        return;
                    }
                    const job = await jobQueue.add('csv-import', {
                        userId,
                        records,
                    }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
                    resolve({ id: job.id || 'unknown' });
                }
                catch (error) {
                    reject(error);
                }
            });
            fileStream.on('error', (_err) => {
                reject(new Error('INVALID_CSV'));
            });
        });
    }
    formatTransaction(txn) {
        return {
            id: txn.id,
            accountId: txn.accountId,
            amount: txn.amount.toNumber ? txn.amount.toNumber() : txn.amount,
            txnDate: txn.txnDate.toISOString(),
            category: txn.category,
            merchant: txn.merchant,
            createdAt: txn.createdAt.toISOString(),
        };
    }
    async invalidateWalletCache(userId) {
        // Invalidate wallet cache patterns
        const patterns = [
            `wallet:${userId}:summary:week`,
            `wallet:${userId}:summary:month`,
            `wallet:${userId}:summary:year`,
            `wallet:${userId}:cashflow*`,
            `wallet:${userId}:networth*`,
        ];
        for (const pattern of patterns) {
            try {
                const keys = await this.fastify.redis.keys(pattern);
                if (keys.length > 0) {
                    await this.fastify.redis.del(...keys);
                }
            }
            catch (e) {
                this.fastify.log.warn(`Failed to invalidate cache key ${pattern}`);
            }
        }
    }
}
exports.TransactionsService = TransactionsService;
