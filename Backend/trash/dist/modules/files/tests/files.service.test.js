"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const files_service_1 = __importDefault(require("../files.service"));
(0, globals_1.describe)('FilesService', () => {
    let service;
    let mockFastify;
    (0, globals_1.beforeEach)(() => {
        mockFastify = { log: { warn: jest.fn() } };
        service = new files_service_1.default(mockFastify);
    });
    (0, globals_1.it)('returns fake presign URL when AWS SDK not present', async () => {
        const res = await service.getUploadPresign('u1', 'test.png', 'image/png');
        (0, globals_1.expect)(res).toHaveProperty('url');
        (0, globals_1.expect)(res.url).toMatch(/fake-s3|S3_FAKE_URL/);
        (0, globals_1.expect)(res).toHaveProperty('key');
    });
    (0, globals_1.it)('download presign rejects when key not owned', async () => {
        await (0, globals_1.expect)(service.getDownloadPresign('u1', 'uploads/otherUser/file.png')).rejects.toThrow('FORBIDDEN');
    });
});
