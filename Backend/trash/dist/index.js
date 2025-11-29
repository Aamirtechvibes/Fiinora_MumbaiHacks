"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const secrets_service_1 = require("./services/secrets.service");
// Validate secrets on startup
const validator = new secrets_service_1.SecretsValidator([
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_ACCESS_TOKEN_SECRET',
    'JWT_REFRESH_TOKEN_SECRET',
], [
    'OPENROUTER_API_KEY',
    'OPENROUTER_BASE_URL',
    'OPENROUTER_MODEL',
    'SMTP_HOST',
    'AWS_ACCESS_KEY_ID',
]);
const validation = validator.validate();
if (!validation.valid) {
    console.error('❌ Secrets validation failed:');
    validation.errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
}
if (validation.warnings.length > 0) {
    console.warn('⚠️ Optional secrets missing:');
    validation.warnings.forEach(warn => console.warn(`  - ${warn}`));
}
const port = Number(process.env.PORT || config_1.default.port || 4000);
app_1.default.listen({ port }, (err, address) => {
    if (err) {
        app_1.default.log.error(err);
        process.exit(1);
    }
    app_1.default.log.info(`Server listening at ${address}`);
});
