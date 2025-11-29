"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetsController = void 0;
const dto_1 = require("./dto");
class BudgetsController {
    async create(req, reply, service) {
        try {
            const body = dto_1.createBudgetSchema.parse(req.body);
            const userId = req.userId;
            const b = await service.createBudget(userId, body);
            return reply.status(201).send(b);
        }
        catch (err) {
            if (err.issues)
                return reply.status(400).send({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: err.issues });
            throw err;
        }
    }
    async list(req, reply, service) {
        try {
            const q = dto_1.listBudgetsQuerySchema.parse(req.query);
            const userId = req.userId;
            const res = await service.listBudgets(userId, q);
            return reply.send(res);
        }
        catch (err) {
            if (err.issues)
                return reply.status(400).send({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: err.issues });
            throw err;
        }
    }
    async get(req, reply, service) {
        try {
            const { id } = req.params;
            const userId = req.userId;
            const b = await service.getBudget(userId, id);
            return reply.send(b);
        }
        catch (err) {
            if (err.message === 'BUDGET_NOT_FOUND')
                return reply.status(404).send({ error: 'Budget not found', code: 'BUDGET_NOT_FOUND' });
            throw err;
        }
    }
    async update(req, reply, service) {
        try {
            const { id } = req.params;
            const body = dto_1.updateBudgetSchema.parse(req.body);
            const userId = req.userId;
            const updated = await service.updateBudget(userId, id, body);
            return reply.send(updated);
        }
        catch (err) {
            if (err.issues)
                return reply.status(400).send({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: err.issues });
            if (err.message === 'BUDGET_NOT_FOUND')
                return reply.status(404).send({ error: 'Budget not found', code: 'BUDGET_NOT_FOUND' });
            throw err;
        }
    }
    async remove(req, reply, service) {
        try {
            const { id } = req.params;
            const userId = req.userId;
            await service.deleteBudget(userId, id);
            return reply.status(204).send();
        }
        catch (err) {
            if (err.message === 'BUDGET_NOT_FOUND')
                return reply.status(404).send({ error: 'Budget not found', code: 'BUDGET_NOT_FOUND' });
            throw err;
        }
    }
    async progress(req, reply, service) {
        try {
            const { id } = req.params;
            const userId = req.userId;
            const res = await service.getBudgetProgress(userId, id);
            return reply.send(res);
        }
        catch (err) {
            if (err.message === 'BUDGET_NOT_FOUND')
                return reply.status(404).send({ error: 'Budget not found', code: 'BUDGET_NOT_FOUND' });
            throw err;
        }
    }
    async simulate(req, reply, service) {
        try {
            const body = dto_1.simulateBudgetSchema.parse(req.body);
            const userId = req.userId;
            const res = await service.simulateBudget(userId, body);
            return reply.send(res);
        }
        catch (err) {
            if (err.issues)
                return reply.status(400).send({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: err.issues });
            if (err.message === 'BUDGET_NOT_FOUND')
                return reply.status(404).send({ error: 'Budget not found', code: 'BUDGET_NOT_FOUND' });
            throw err;
        }
    }
}
exports.BudgetsController = BudgetsController;
