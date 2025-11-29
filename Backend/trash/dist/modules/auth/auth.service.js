"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const uuid_1 = require("uuid");
const crypto_1 = __importDefault(require("crypto"));
const config_1 = __importDefault(require("../../config"));
const password_services_1 = require("../../services/password.services");
const jwt_service_1 = require("../../services/jwt.service");
const email_service_1 = require("../../services/email.service");
class AuthService {
    constructor(fastify) {
        this.fastify = fastify;
    }
    randomToken(len = 48) {
        return crypto_1.default.randomBytes(len).toString('hex');
    }
    async register(email, password, name) {
        const prisma = this.fastify.prisma;
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new Error('Email already exists');
        }
        const passwordHash = await (0, password_services_1.hashPassword)(password);
        const user = await prisma.user.create({
            data: { email, passwordHash, name }
        });
        // create email verification token
        const token = this.randomToken(32);
        const tokenHash = await (0, password_services_1.hashWithPepper)(token, config_1.default.refreshPepper);
        await prisma.emailVerification.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) // 24h
            }
        });
        // send email
        const verifyUrl = `${config_1.default.appUrl}/api/v1/auth/verify?token=${token}`;
        await (0, email_service_1.sendEmail)(email, 'Verify your Finora account', `<p>Click <a href="${verifyUrl}">here</a> to verify your email.</p>`);
        return { id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified };
    }
    async login(email, password) {
        const prisma = this.fastify.prisma;
        const user = await prisma.user.findUnique({ where: { email } });
        // Check lockout
        if (user && user.lockedUntil && user.lockedUntil > new Date()) {
            throw new Error('AccountLocked');
        }
        if (!user) {
            // to avoid user enumeration, still increment failure counter by email
            // use redis key scoped to email
            try {
                await this.fastify.redis.incr(`auth:fail:email:${email}`);
            }
            catch (e) { /* ignore */ }
            throw new Error('Invalid credentials');
        }
        const ok = await (0, password_services_1.verifyPassword)(user.passwordHash, password);
        if (!ok) {
            // increment failed attempt counter in redis for this user
            try {
                const key = `auth:fail:${user.id}`;
                const count = await this.fastify.redis.incr(key);
                if (count === 1)
                    await this.fastify.redis.expire(key, 30 * 60); // 30 minutes
                if (count >= 5) {
                    // lock account for 30 minutes
                    const lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
                    await prisma.user.update({ where: { id: user.id }, data: { lockedUntil } });
                    // send lockout notification email
                    try {
                        await (0, email_service_1.sendEmail)(user.email, 'Your account was locked', `<p>Your account has been locked for 30 minutes due to repeated failed login attempts.</p>`);
                    }
                    catch (e) { /* ignore email errors */ }
                }
            }
            catch (e) {
                this.fastify.log?.error?.(e);
            }
            throw new Error('Invalid credentials');
        }
        const accessToken = (0, jwt_service_1.signAccessToken)({ sub: user.id, role: user.role });
        const sessionId = (0, uuid_1.v4)();
        const refreshTokenRaw = this.randomToken(48);
        const refreshHash = await (0, password_services_1.hashWithPepper)(refreshTokenRaw, config_1.default.refreshPepper);
        const expiresAt = new Date(Date.now() + config_1.default.refreshExpiresDays * 24 * 60 * 60 * 1000);
        await prisma.session.create({
            data: { id: sessionId, userId: user.id, refreshHash, expiresAt }
        });
        // successful login: clear failure counter
        try {
            await this.fastify.redis.del(`auth:fail:${user.id}`);
        }
        catch (e) { /* ignore */ }
        return {
            accessToken,
            expiresIn: config_1.default.accessExpiresIn,
            refreshToken: refreshTokenRaw,
            sessionId,
            user: { id: user.id, email: user.email, name: user.name, emailVerified: user.emailVerified }
        };
    }
    async refresh(sessionId, refreshToken) {
        const prisma = this.fastify.prisma;
        const session = await prisma.session.findUnique({ where: { id: sessionId } });
        if (!session)
            throw new Error('Invalid session');
        // check expiry
        if (session.expiresAt < new Date()) {
            await prisma.session.delete({ where: { id: sessionId } });
            throw new Error('Session expired');
        }
        const ok = await (0, password_services_1.verifyWithPepper)(session.refreshHash, refreshToken, config_1.default.refreshPepper);
        if (!ok) {
            // Potential compromise → revoke session
            await prisma.session.delete({ where: { id: sessionId } });
            throw new Error('Invalid refresh token');
        }
        // rotate: create new session id & token; mark old as rotated
        const newSessionId = (0, uuid_1.v4)();
        const newRefreshToken = this.randomToken(48);
        const newRefreshHash = await (0, password_services_1.hashWithPepper)(newRefreshToken, config_1.default.refreshPepper);
        const expiresAt = new Date(Date.now() + config_1.default.refreshExpiresDays * 24 * 60 * 60 * 1000);
        await prisma.$transaction(async (tx) => {
            await tx.session.update({ where: { id: sessionId }, data: { rotated: true } });
            await tx.session.create({
                data: {
                    id: newSessionId,
                    userId: session.userId,
                    refreshHash: newRefreshHash,
                    expiresAt
                }
            });
        });
        const user = await prisma.user.findUnique({ where: { id: session.userId } });
        const accessToken = (0, jwt_service_1.signAccessToken)({ sub: session.userId, role: user?.role });
        return { accessToken, refreshToken: newRefreshToken, sessionId: newSessionId, expiresIn: config_1.default.accessExpiresIn };
    }
    async logout(sessionId) {
        const prisma = this.fastify.prisma;
        await prisma.session.deleteMany({ where: { id: sessionId } });
        return { ok: true };
    }
    async verifyEmail(token) {
        const prisma = this.fastify.prisma;
        const records = await prisma.emailVerification.findMany({
            where: { expiresAt: { gt: new Date() } }
        });
        // find matching by verifying hashes — avoid listing tokens
        for (const rec of records) {
            const ok = await (0, password_services_1.verifyWithPepper)(rec.tokenHash, token, config_1.default.refreshPepper);
            if (ok) {
                await prisma.user.update({ where: { id: rec.userId }, data: { emailVerified: true } });
                await prisma.emailVerification.delete({ where: { id: rec.id } });
                return { ok: true };
            }
        }
        throw new Error('Invalid or expired token');
    }
    async forgot(email) {
        const prisma = this.fastify.prisma;
        // rate-limit forgot password per email: max 5/hour
        try {
            const { incrAndCheck } = await Promise.resolve().then(() => __importStar(require('../../services/rateLimiter')));
            const { exceeded } = await incrAndCheck(this.fastify, `ratelimit:forgot:${email}`, 5, 60 * 60);
            if (exceeded)
                return { ok: false, error: 'Rate limit exceeded' };
        }
        catch (e) {
            this.fastify.log?.error?.(e);
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            return { ok: true }; // do not reveal existence
        // create token
        const token = this.randomToken(32);
        const tokenHash = await (0, password_services_1.hashWithPepper)(token, config_1.default.refreshPepper);
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
        await prisma.passwordReset.create({
            data: { userId: user.id, tokenHash, expiresAt }
        });
        const resetUrl = `${config_1.default.frontendUrl}/reset?token=${token}`;
        await (0, email_service_1.sendEmail)(email, 'Reset your password', `<p>Reset: <a href="${resetUrl}">reset</a></p>`);
        return { ok: true };
    }
    async resetPassword(token, password) {
        const prisma = this.fastify.prisma;
        const records = await prisma.passwordReset.findMany({
            where: { expiresAt: { gt: new Date() } }
        });
        for (const rec of records) {
            const ok = await (0, password_services_1.verifyWithPepper)(rec.tokenHash, token, config_1.default.refreshPepper);
            if (ok) {
                const passwordHash = await (0, password_services_1.hashPassword)(password);
                await prisma.user.update({ where: { id: rec.userId }, data: { passwordHash } });
                await prisma.passwordReset.delete({ where: { id: rec.id } });
                // revoke sessions
                await prisma.session.deleteMany({ where: { userId: rec.userId } });
                return { ok: true };
            }
        }
        throw new Error('Invalid or expired token');
    }
}
exports.AuthService = AuthService;
