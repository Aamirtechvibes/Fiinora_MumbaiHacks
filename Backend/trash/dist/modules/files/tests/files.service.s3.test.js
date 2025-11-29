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
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// This test mocks AWS SDK v3 modules to simulate presign behavior
(0, globals_1.describe)('FilesService with mocked S3 SDK', () => {
    (0, globals_1.beforeEach)(() => {
        globals_1.jest.resetModules();
    });
    (0, globals_1.it)('returns signed URL when AWS SDK provides getSignedUrl', async () => {
        globals_1.jest.doMock('@aws-sdk/client-s3', () => ({
            S3Client: class {
            },
            PutObjectCommand: class {
            },
            GetObjectCommand: class {
            },
        }), { virtual: true });
        globals_1.jest.doMock('@aws-sdk/s3-request-presigner', () => ({
            getSignedUrl: async () => 'https://signed.example/put',
        }), { virtual: true });
        const FilesService = (await Promise.resolve().then(() => __importStar(require('../files.service')))).default;
        const mockFastify = { log: { warn: globals_1.jest.fn() } };
        const svc = new FilesService(mockFastify);
        const up = await svc.getUploadPresign('u1', 'photo.jpg', 'image/jpeg');
        (0, globals_1.expect)(up).toHaveProperty('url');
        (0, globals_1.expect)(up.url).toBe('https://signed.example/put');
        (0, globals_1.expect)(up).toHaveProperty('expiresAt');
        const downloadKey = `uploads/u1/${Date.now()}_photo.jpg`;
        const down = await svc.getDownloadPresign('u1', downloadKey);
        (0, globals_1.expect)(down.url).toBe('https://signed.example/put');
        (0, globals_1.expect)(down).toHaveProperty('expiresAt');
    });
});
