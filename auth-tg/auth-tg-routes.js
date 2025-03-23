import { authHeaderMiddleware, authQueryMiddleware } from '../auth/auth-controller.js';
import * as tgAuthController from './auth-tg-controller.js';

export async function tgAuthRoutes(fastify) {
  fastify.post(
    '/creds',
    {
      schema: {
        tags: ['auth-tg'],
        body: {
          type: 'object',
          required: ['phone', 'password'],
          properties: {
            phone: { type: 'string', minLength: 3 },
            password: { type: 'string', minLength: 1 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              requiresCode: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
      preHandler: authHeaderMiddleware,
    },
    tgAuthController.initAuth
  );

  fastify.post(
    '/code',
    {
      schema: {
        tags: ['auth-tg'],
        body: {
          type: 'object',
          required: ['code', 'phone'],
          properties: {
            code: { type: 'string', minLength: 1 },
            phone: { type: 'string', minLength: 3 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
      preHandler: authHeaderMiddleware,
    },
    tgAuthController.submitCode
  );

  fastify.get(
    '/sse',
    {
      schema: {
        tags: ['auth-tg'],
        description: 'SSE соединение для получения уведомлений об авторизации',
        querystring: {
          type: 'object',
          properties: {
            token: { type: 'string' },
          },
          required: ['token'],
        },
      },
      preHandler: authQueryMiddleware,
    },
    tgAuthController.getAuthEvents
  );
}
