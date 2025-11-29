"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
const transporter = nodemailer_1.default.createTransport({
    host: config_1.default.smtpHost,
    port: config_1.default.smtpPort,
    auth: config_1.default.smtpUser ? { user: config_1.default.smtpUser, pass: config_1.default.smtpPass } : undefined
});
const sendEmail = async (to, subject, html) => {
    if (!config_1.default.smtpHost) {
        logger_1.default.info('SMTP not configured - skipping email send', { to, subject });
        return;
    }
    await transporter.sendMail({
        from: config_1.default.smtpUser || 'no-reply@finora.test',
        to,
        subject,
        html
    });
};
exports.sendEmail = sendEmail;
