import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const AuthUserSchema = z
  .object({
    id: z.string().uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
    email: z.string().email().openapi({ example: 'owner@oprino.com' }),
    name: z.string().min(1).openapi({ example: 'Acme Operations Manager' }),
    emailVerified: z.boolean().openapi({ example: true }),
    image: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'https://cdn.oprino.com/avatars/user1.png' }),
  })
  .openapi('AuthUser');

export const SignUpRequestSchema = z
  .object({
    email: z.string().email().openapi({ example: 'owner@oprino.com' }),
    password: z.string().min(8).openapi({ example: 'SecurePassword123!' }),
    name: z.string().min(1).openapi({ example: 'Acme Owner' }),
  })
  .openapi('SignUpRequest');

export const SignInRequestSchema = z
  .object({
    email: z.string().email().openapi({ example: 'owner@oprino.com' }),
    password: z.string().min(1).openapi({ example: 'SecurePassword123!' }),
  })
  .openapi('SignInRequest');

export const AuthResponseSchema = z
  .object({
    token: z.string().openapi({ example: 'oprino_session_tok_abc123' }),
    user: AuthUserSchema,
    activeWorkspaceId: z
      .string()
      .uuid()
      .nullable()
      .optional()
      .openapi({ example: 'w1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
  })
  .openapi('AuthResponse');

export const SignOutResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
  })
  .openapi('SignOutResponse');

export type AuthUser = z.infer<typeof AuthUserSchema>;
export type SignUpRequest = z.infer<typeof SignUpRequestSchema>;
export type SignInRequest = z.infer<typeof SignInRequestSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type SignOutResponse = z.infer<typeof SignOutResponseSchema>;
