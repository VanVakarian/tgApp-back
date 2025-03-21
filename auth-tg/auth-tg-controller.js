import * as tgAuthService from './auth-tg-service.js';

export async function requestAuth(request, reply) {
  try {
    const response = await tgAuthService.startAuth();
    reply.sse(response);
  } catch (error) {
    reply.sse({
      event: 'auth_status',
      data: `failure: ${error.message}`,
    });
  }
}

export async function submitCredentials(request, reply) {
  const { phone, password } = request.body;
  const userId = request.user.id; // Assuming user is authenticated

  try {
    const response = await tgAuthService.submitCredentials(phone, password, userId);
    reply.sse(response);
  } catch (error) {
    reply.sse({
      event: 'auth_status',
      data: `failure: ${error.message}`,
    });
  }
}

export async function submitCode(request, reply) {
  const { code } = request.body;
  const userId = request.user.id; // Assuming user is authenticated

  try {
    const response = await tgAuthService.submitCode(code, userId);
    reply.sse(response);
  } catch (error) {
    reply.sse({
      event: 'auth_status',
      data: `failure: ${error.message}`,
    });
  }
}
