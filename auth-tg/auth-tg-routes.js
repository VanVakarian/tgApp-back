import { authMiddleware } from '../auth/auth-controller.js';
import * as tgAuthController from './auth-tg-controller.js';

export async function tgAuthRoutes(fastify) {
  // All routes require authentication
  const preValidation = [authMiddleware];

  fastify.get(
    '/request',
    {
      schema: { tags: ['auth-tg'] },
      preValidation,
    },
    tgAuthController.requestAuth
  );

  fastify.post(
    '/credentials',
    {
      schema: { tags: ['auth-tg'] },
      preValidation,
    },
    tgAuthController.submitCredentials
  );

  fastify.post(
    '/code',
    {
      schema: { tags: ['auth-tg'] },
      preValidation,
    },
    tgAuthController.submitCode
  );
}
