import * as authService from './auth-service.js';

export async function login(request, reply) {
  const { username, password } = request.body;
  try {
    const tokens = await authService.login(username, password);
    return reply.send(tokens);
  } catch (error) {
    return reply.code(401).send({ detail: error.message });
  }
}

export async function refresh(request, reply) {
  const { refreshToken } = request.body;
  try {
    const tokens = await authService.refreshToken(refreshToken);
    return reply.send(tokens);
  } catch (error) {
    return reply.code(401).send({ detail: error.message });
  }
}

export async function authMiddleware(request, reply) {
  try {
    const token = request.headers.authorization.split(' ')[1];
    const decoded = await authService.verifyToken(token);
    request.user = decoded;
  } catch (error) {
    // console.log('error', error);
    return reply.code(401).send({ detail: 'Invalid token' });
  }
}
