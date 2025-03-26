import * as authController from './auth-controller.js';

export async function authRoutes(fastify) {
  fastify.post(
    '/login',
    {
      schema: { tags: ['auth'] },
    },
    authController.login
  );
  fastify.post(
    '/refresh',
    {
      schema: { tags: ['auth'] },
    },
    authController.refresh
  );
}
