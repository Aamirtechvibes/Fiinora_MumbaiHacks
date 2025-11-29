"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startNotificationsWorker = startNotificationsWorker;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const nodemailer_1 = __importDefault(require("nodemailer"));
// Minimal notification sender: email via SMTP and placeholder push
async function sendEmail(to, subject, html) {
    const transporter = nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: Number(process.env.SMTP_PORT || 1025),
        secure: false,
    });
    await transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@finora.local',
        to,
        subject,
        html,
    });
}
async function sendPush(userId, payload) {
    // Placeholder: integrate with push provider (FCM/APNs) in production
    console.log(`Push to ${userId}:`, payload);
}
function startNotificationsWorker() {
    const connection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
    const worker = new bullmq_1.Worker('emailQueue', async (job) => {
        const { userId, notificationId, channel, payload } = job.data;
        try {
            if (channel === 'email') {
                // Resolve user's email from DB (lightweight query)
                // Note: create a new Prisma client here to avoid depending on Fastify instance
                const { PrismaClient } = require('@prisma/client');
                const prisma = new PrismaClient();
                const user = await prisma.user.findUnique({ where: { id: userId } });
                if (user && user.email) {
                    await sendEmail(user.email, `Notification: ${payload.title || 'Alert'}`, payload.html || JSON.stringify(payload));
                }
                await prisma.$disconnect();
            }
            else if (channel === 'push') {
                await sendPush(userId, payload);
            }
            return { delivered: true };
        }
        catch (err) {
            console.error('Notification job failed', err);
            throw err;
        }
    }, { connection });
    worker.on('failed', (job, err) => {
        console.error('Job failed', job?.id, err?.message || err);
    });
    worker.on('completed', (job) => {
        console.log('Job completed', job.id);
    });
    return { worker, connection };
}
if (require.main === module) {
    // Allow running as node script: `node dist/queues/workers/notifications.worker.js`
    const { worker } = startNotificationsWorker();
    console.log('Notifications worker started');
}
