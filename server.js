import fastifyCompress from '@fastify/compress';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import fastifySSEPlugin from 'fastify-sse';
import { initDatabase } from './db/init.js';
import { APP_IP, APP_PORT } from './env.js';
import { login } from './login.js';
import { getClient } from './messages.js';
import { swaggerConfig, swaggerUiConfig } from './swagger-config.js';

initDatabase();

const server = Fastify({ logger: true });

server.register(fastifyCompress);
server.register(fastifySwagger, swaggerConfig);
server.register(fastifySwaggerUi, swaggerUiConfig);
server.register(cors, { origin: '*' });
server.register(fastifySSEPlugin);

server.get('/api/auth/request', async (request, reply) => {
  reply.sse({ event: 'request_credentials', data: 'Enter phone and password' });
});

server.post('/api/auth/credentials', async (request, reply) => {
  const { phone, password } = request.body;
  try {
    const client = await login(phone, password);
    if (client.needCode) {
      reply.sse({ event: 'request_code', data: 'Enter code' });
    } else {
      reply.sse({ event: 'auth_status', data: 'success' });
    }
  } catch (error) {
    server.log.error(error);
    reply.sse({ event: 'auth_status', data: `failure: ${error.message}` });
  }
});

server.post('/api/auth/code', async (request, reply) => {
  const { code } = request.body;
  try {
    const client = await getClient();
    await client.start({ code });
    reply.sse({ event: 'auth_status', data: 'success' });
  } catch (error) {
    server.log.error(error);
    reply.sse({ event: 'auth_status', data: `failure: ${error.message}` });
  }
});

server.listen({ port: APP_PORT, host: APP_IP }, (err, address) => {
  if (err) {
    server.log.debug(err);
    process.exit(1);
  }
  server.log.info(`server listening on ${address}`);
});
