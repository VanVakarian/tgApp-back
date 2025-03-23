import { sseClients, tgAuthSessions } from '../server.js';
import { completeAuthWithCode, createAuthSession, initiateAuth } from './auth-tg-service.js';

export async function initAuth(req, reply) {
  const { phone, password } = req.body;

  if (tgAuthSessions.has(phone)) {
    return reply.code(400).send({
      success: false,
      error: 'Auth already in progress',
    });
  }

  try {
    const authSession = await createAuthSession(phone, password);
    tgAuthSessions.set(phone, authSession);

    const result = await initiateAuth(phone, password, authSession);

    return reply.send({
      success: true,
      requiresCode: true,
      message: 'Code required',
    });
  } catch (error) {
    tgAuthSessions.delete(phone);
    return reply.code(500).send({
      success: false,
      error: error.message || 'Failed to start authentication',
    });
  }
}

export async function submitCode(req, reply) {
  const { phone, code } = req.body;
  const userId = req.user?.id;

  if (!tgAuthSessions.has(phone)) {
    return reply.code(400).send({
      success: false,
      error: 'No ongoing authentication found',
    });
  }

  const authSession = tgAuthSessions.get(phone);

  try {
    const result = await completeAuthWithCode(code, authSession, userId);
    tgAuthSessions.delete(phone);

    return reply.send({
      success: true,
      message: 'Authentication completed successfully',
    });
  } catch (error) {
    tgAuthSessions.delete(phone);
    return reply.code(500).send({
      success: false,
      error: error.message || 'Failed to complete authentication',
    });
  }
}

export async function getAuthEvents(request, reply) {
  try {
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');

    const userId = request.user.id;

    const sendMessage = (data) => {
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    sseClients.set(userId, sendMessage);

    sendMessage({ event: 'connected', data: 'SSE connected' });

    request.raw.on('close', () => {
      sseClients.delete(userId);
      request.log.info(`SSE connection closed for user ${userId}`);
    });
  } catch (error) {
    request.log.error(`SSE error: ${error.message}`);
    reply.status(500).send({ error: 'Failed to setup SSE' });
  }
}
