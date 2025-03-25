import { authHeaderMiddleware, authQueryMiddleware } from '../auth/auth-controller.js';
import * as tgAuthController from './auth-tg-controller.js';

const credsSchema = {
  tags: ['auth-tg'],
  body: {
    type: 'object',
    required: ['phone', 'password'],
    properties: {
      phone: { type: 'string' },
      password: { type: 'string' },
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
};

const codeSchema = {
  tags: ['auth-tg'],
  body: {
    type: 'object',
    required: ['code'],
    properties: {
      code: { type: 'string' },
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
};

const sseSchema = {
  tags: ['auth-tg'],
  description: 'SSE connection for receiving authorization notifications',
  querystring: {
    type: 'object',
    properties: {
      token: { type: 'string' },
    },
    required: ['token'],
  },
};

export async function tgAuthRoutes(fastify) {
  fastify.post('/creds', { schema: credsSchema, preHandler: authHeaderMiddleware }, tgAuthController.initTgAuth);
  fastify.post('/code', { schema: codeSchema, preHandler: authHeaderMiddleware }, tgAuthController.submitTgCode);
  fastify.get('/sse', { schema: sseSchema, preHandler: authQueryMiddleware }, tgAuthController.getTgAuthEvents);
}
