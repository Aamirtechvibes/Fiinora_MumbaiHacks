"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const email_service_1 = require("../services/email.service");
const connection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
const worker = new bullmq_1.Worker('emailQueue', async (job) => {
    console.log('Processing job', job.name, job.data);
    if (job.name === 'sendEmail') {
        const { to, subject, html } = job.data;
        await (0, email_service_1.sendEmail)(to, subject, html);
    }
}, { connection });
worker.on('failed', (job, err) => {
    console.error('Job failed', job?.id, err);
});
console.log('Worker started');
