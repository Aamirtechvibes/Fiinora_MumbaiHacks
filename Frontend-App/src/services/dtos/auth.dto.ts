import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.string().or(z.number()).optional(),
  refreshToken: z.string().optional(),
  sessionId: z.string().optional(),
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    emailVerified: z.boolean().optional(),
    role: z.string().optional(),
  }),
});

export const refreshSchema = z.object({
  refreshToken: z.string(),
  sessionId: z.string(),
});

export const forgotSchema = z.object({
  email: z.string().email(),
});

export const resetSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export const verifySchema = z.object({
  token: z.string(),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshDto = z.infer<typeof refreshSchema>;
