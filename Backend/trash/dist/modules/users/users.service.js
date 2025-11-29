"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
class UsersService {
    constructor(fastify) {
        this.fastify = fastify;
    }
    async getMe(userId) {
        return this.fastify.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } });
    }
}
exports.UsersService = UsersService;
