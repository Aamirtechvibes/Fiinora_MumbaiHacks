"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesService = void 0;
class FilesService {
    constructor(fastify) {
        this.fastify = fastify;
    }
    s3Config() {
        return {
            endpoint: process.env.S3_ENDPOINT || undefined,
            region: process.env.S3_REGION || undefined,
            bucket: process.env.S3_BUCKET,
            credentials: process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY
                ? {
                    accessKeyId: process.env.S3_ACCESS_KEY,
                    secretAccessKey: process.env.S3_SECRET_KEY,
                }
                : undefined,
            forcePathStyle: !!process.env.S3_FORCE_PATH_STYLE,
            expiresIn: Number(process.env.S3_PRESIGN_EXPIRES || 900),
        };
    }
    async getUploadPresign(userId, filename, contentType) {
        const key = `uploads/${userId}/${Date.now()}_${filename}`;
        const cfg = this.s3Config();
        try {
            // dynamic require to make SDK optional in dev
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
            const client = new S3Client({
                region: cfg.region,
                credentials: cfg.credentials,
                endpoint: cfg.endpoint,
                forcePathStyle: cfg.forcePathStyle,
            });
            const command = new PutObjectCommand({
                Bucket: cfg.bucket,
                Key: key,
                ContentType: contentType || 'application/octet-stream',
            });
            const url = await getSignedUrl(client, command, { expiresIn: cfg.expiresIn });
            const expiresAt = new Date(Date.now() + cfg.expiresIn * 1000).toISOString();
            return { url, key, expiresAt };
        }
        catch (err) {
            this.fastify.log.warn('S3 presign failed, returning fake URL fallback');
            const expiresAt = new Date(Date.now() + this.s3Config().expiresIn * 1000).toISOString();
            return { url: `${process.env.S3_FAKE_URL || 'https://fake-s3'}/${key}`, key, expiresAt };
        }
    }
    async getDownloadPresign(userId, key) {
        if (!key.startsWith(`uploads/${userId}/`)) {
            throw new Error('FORBIDDEN');
        }
        const cfg = this.s3Config();
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
            const client = new S3Client({
                region: cfg.region,
                credentials: cfg.credentials,
                endpoint: cfg.endpoint,
                forcePathStyle: cfg.forcePathStyle,
            });
            const command = new GetObjectCommand({ Bucket: cfg.bucket, Key: key });
            const url = await getSignedUrl(client, command, { expiresIn: cfg.expiresIn });
            const expiresAt = new Date(Date.now() + cfg.expiresIn * 1000).toISOString();
            return { url, key, expiresAt };
        }
        catch (err) {
            this.fastify.log.warn('S3 presign failed (download), returning fake URL fallback');
            const expiresAt = new Date(Date.now() + this.s3Config().expiresIn * 1000).toISOString();
            return { url: `${process.env.S3_FAKE_URL || 'https://fake-s3'}/${key}`, key, expiresAt };
        }
    }
    async saveMetadata(userId, data) {
        // minimal validation
        if (!data.key || !data.filename)
            throw new Error('INVALID_DATA');
        const file = await this.fastify.prisma.file.create({
            data: {
                userId,
                key: data.key,
                filename: data.filename,
                size: data.size ?? null,
                mimeType: data.mimeType ?? null,
            },
        });
        return file;
    }
}
exports.FilesService = FilesService;
exports.default = FilesService;
