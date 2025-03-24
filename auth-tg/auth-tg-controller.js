import { sseClients, tgAuthSessions } from '../server.js';

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

function handleWorkerResponse(response, reply, phone) {
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

  tgAuthSessions.delete(phone);
  return reply.code(500).send({
    success: false,
    error: response.error || 'Failed to complete authentication',
  });
}

export function initWorkerMessageHandler(worker) {
  worker.on('message', (message) => {
    console.log('Получено сообщение от воркера:', message.type);

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

export async function createAuthSession(phone, password) {
  return {
    phone,
    password,
    status: 'INIT',
    created: Date.now(),
  };
}

export async function initAuth(req, reply) {
  const { phone, password } = req.body;
  const userId = req.user?.id || 1;
  const worker = req.server.worker;

  if (tgAuthSessions.has(phone)) {
    return reply.code(400).send({
      success: false,
      error: 'Auth already in progress',
    });
  }

  try {
    const authSession = await createAuthSession(phone, password);
    tgAuthSessions.set(phone, authSession);

    worker.postMessage({
      type: 'AUTH_INIT',
      phone,
      password,
    });

    const response = await createResponsePromise(worker, ['AUTH_CODE_REQUIRED', 'AUTH_ERROR']);
    return handleWorkerResponse(response, reply, phone);
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
  const userId = req.user?.id || 1;
  const worker = req.server.worker;

  if (!tgAuthSessions.has(phone)) {
    return reply.code(400).send({
      success: false,
      error: 'No ongoing authentication found',
    });
  }

  try {
    worker.postMessage({
      type: 'AUTH_SUBMIT_CODE',
      phone,
      code,
      userId,
    });

    const response = await createResponsePromise(worker, ['AUTH_COMPLETE', 'AUTH_ERROR']);
    tgAuthSessions.delete(phone);
    return handleWorkerResponse(response, reply, phone);
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

    const userId = request.user?.id || 1;

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
