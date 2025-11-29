"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// worker runs separately in Docker worker container
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const connection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
const transporter = nodemailer_1.default.createTransport({
    // Example using SMTP; use SES/Sendgrid in prod
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});
new bullmq_1.Worker("sendVerification", async (job) => {
    const { to, token } = job.data;
    const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify?token=${token}`;
    const html = `<p>Verify your email <a href="${verifyUrl}">Verify</a></p>`;
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject: "Verify your email", html });
}, { connection });
new bullmq_1.Worker("sendReset", async (job) => {
    const { to, token } = job.data;
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset?token=${token}`;
    const html = `<p>Reset your password <a href="${resetUrl}">Reset</a></p>`;
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject: "Reset password", html });
}, { connection });
console.log("Workers started");
