import { sseClients, tgAuthSessions } from '../server.js';
import { clearTelegramSession, getTelegramSession } from './auth-tg-db.js';

function createResponsePromise(worker, expectedTypes) {
  return new Promise((resolve, reject) => {
    const handleResponse = (response) => {
      if (expectedTypes.includes(response.type)) {
        worker.removeListener('message', handleResponse);
        resolve(response);
      }
    };
    worker.on('message', handleResponse);
    setTimeout(() => {
      worker.removeListener('message', handleResponse);
      reject(new Error('Timeout waiting for worker response'));
    }, 30000);
  });
}

function handleTgWorkerResponse(response, reply, userId) {
  if (response.success) {
    const successResponse = {
      success: true,
      message: response.type === 'AUTH_CODE_REQUIRED' ? 'Code required' : 'Authentication completed successfully',
    };
    if (response.type === 'AUTH_CODE_REQUIRED') {
      successResponse.requiresCode = true;
    }
    return reply.send(successResponse);
  }

  tgAuthSessions.delete(userId);
  return reply.code(500).send({
    success: false,
    error: response.error || 'Failed to complete authentication',
  });
}

export function initTgWorkerMessageHandler(worker) {
  worker.on('message', (message) => {
    console.log('Received message from worker:', message.type);

    const sseClient = sseClients.get(1);
    if (sseClient) {
      sseClient({
        event: message.type.toLowerCase(),
        data: {
          success: message.success,
          requiresCode: message.type === 'AUTH_CODE_REQUIRED',
          error: message.error,
        },
      });
    }
  });
}

export async function createTgAuthSession(phone, password, userId) {
  return {
    userId,
    phone,
    password,
    status: 'INIT',
    created: Date.now(),
  };
}

export async function initTgAuth(req, reply) {
  const { phone, password } = req.body;
  const userId = req.user.id;
  const worker = req.server.worker;

  if (tgAuthSessions.has(userId)) {
    return reply.code(400).send({
      success: false,
      error: 'Auth already in progress',
    });
  }

  try {
    const authSession = await createTgAuthSession(phone, password, userId);
    tgAuthSessions.set(userId, authSession);

    worker.postMessage({
      type: 'AUTH_INIT',
      phone,
      password,
    });

    const response = await createResponsePromise(worker, ['AUTH_CODE_REQUIRED', 'AUTH_ERROR']);
    return handleTgWorkerResponse(response, reply, userId);
  } catch (error) {
    tgAuthSessions.delete(userId);
    return reply.code(500).send({
      success: false,
      error: error.message || 'Failed to start authentication',
    });
  }
}

export async function submitTgCode(req, reply) {
  const { code } = req.body;
  const userId = req.user.id;
  const worker = req.server.worker;

  if (!tgAuthSessions.has(userId)) {
    return reply.code(400).send({
      success: false,
      error: 'No ongoing authentication found',
    });
  }

  const session = tgAuthSessions.get(userId);

  try {
    worker.postMessage({
      type: 'AUTH_SUBMIT_CODE',
      phone: session.phone,
      code,
      userId,
    });

    const response = await createResponsePromise(worker, ['AUTH_COMPLETE', 'AUTH_ERROR']);
    tgAuthSessions.delete(userId);
    return handleTgWorkerResponse(response, reply, userId);
  } catch (error) {
    tgAuthSessions.delete(userId);
    return reply.code(500).send({
      success: false,
      error: error.message || 'Failed to complete authentication',
    });
  }
}

export async function clearTgAuth(req, reply) {
  const userId = req.user.id;
  const worker = req.server.worker;

  try {
    const result = await clearTelegramSession(userId);

    worker.postMessage({
      type: 'AUTH_CANCEL',
    });

    if (result) {
      return reply.send({
        success: true,
        message: 'Telegram session cleared successfully',
      });
    } else {
      return reply.code(500).send({
        success: false,
        error: 'Failed to clear Telegram session',
      });
    }
  } catch (error) {
    return reply.code(500).send({
      success: false,
      error: error.message || 'Failed to clear authentication',
    });
  }
}

export async function getTgAuthEvents(request, reply) {
  try {
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');

    const userId = request.user.id;

    const sendMessage = (data) => {
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    sseClients.set(userId, sendMessage);

    const tgSession = await getTelegramSession(userId);

    sendMessage({
      event: 'auth_status',
      data: {
        isTgAuthenticated: Boolean(tgSession),
      },
    });

    request.raw.on('close', () => {
      sseClients.delete(userId);
      request.log.info(`SSE connection closed for user ${userId}`);
    });
  } catch (error) {
    request.log.error(`SSE error: ${error.message}`);
    reply.status(500).send({ error: 'Failed to setup SSE' });
  }
}
