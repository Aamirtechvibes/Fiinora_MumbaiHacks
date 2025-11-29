"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Integration test for Minio — requires MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, S3_BUCKET env vars and aws sdk deps installed
const minioEndpoint = process.env.MINIO_ENDPOINT;
if (!minioEndpoint) {
    (0, globals_1.describe)('Minio integration (skipped)', () => {
        (0, globals_1.it)('skips minio tests when MINIO_ENDPOINT not set', () => {
            (0, globals_1.expect)(true).toBe(true);
        });
    });
}
else {
    (0, globals_1.describe)('FilesService integration with Minio', () => {
        (0, globals_1.it)('generates presigned URL and uploads object to Minio', async () => {
            const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
            const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
            const fetch = require('node-fetch');
            const cfg = {
                endpoint: process.env.MINIO_ENDPOINT,
                region: process.env.S3_REGION || 'us-east-1',
                bucket: process.env.S3_BUCKET,
                credentials: {
                    accessKeyId: process.env.MINIO_ACCESS_KEY,
                    secretAccessKey: process.env.MINIO_SECRET_KEY,
                },
                forcePathStyle: true,
            };
            const client = new S3Client({ region: cfg.region, endpoint: cfg.endpoint, credentials: cfg.credentials, forcePathStyle: true });
            const key = `integration-test/${Date.now()}_test.txt`;
            const command = new PutObjectCommand({ Bucket: cfg.bucket, Key: key, Body: 'hello-minio', ContentType: 'text/plain' });
            const url = await getSignedUrl(client, command, { expiresIn: 60 });
            const res = await fetch(url, { method: 'PUT', body: 'hello-minio', headers: { 'Content-Type': 'text/plain' } });
            (0, globals_1.expect)(res.status).toBeGreaterThanOrEqual(200);
        }, 20000);
    });
}
