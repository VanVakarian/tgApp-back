import fastifyCompress from '@fastify/compress';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import fastifySSEPlugin from 'fastify-sse';
import path from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';
import { initWorkerMessageHandler } from './auth-tg/auth-tg-controller.js';
import { tgAuthRoutes } from './auth-tg/auth-tg-routes.js';
import { authRoutes } from './auth/auth-routes.js';
import { initDatabase } from './db/init.js';
import { APP_IP, APP_PORT } from './env.js';
import { swaggerConfig, swaggerUiConfig } from './swagger-config.js';

export const tgAuthSessions = new Map();

export const sseClients = new Map();

initDatabase();

const server = Fastify({ logger: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workerPath = path.resolve(__dirname, 'tg/tg-worker.js');
export const worker = new Worker(workerPath);

initWorkerMessageHandler(worker);

server.decorate('worker', worker);

server.addHook('onClose', async () => {
  worker.terminate();
  console.log('Worker terminated');
});

server.register(fastifyCompress);
server.register(fastifySwagger, swaggerConfig);
server.register(fastifySwaggerUi, swaggerUiConfig);
server.register(cors, { origin: '*' });
server.register(fastifySSEPlugin);

server.register(authRoutes, { prefix: '/api/auth' });
server.register(tgAuthRoutes, { prefix: '/api/auth-tg' });

server.listen({ port: APP_PORT, host: APP_IP }, (err, address) => {
  if (err) {
    server.log.debug(err);
    process.exit(1);
  }
  server.log.info(`server listening on ${address}`);
});
