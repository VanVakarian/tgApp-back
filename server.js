import fastifyCompress from '@fastify/compress';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import fastifySSEPlugin from 'fastify-sse';
import { tgAuthRoutes } from './auth-tg/auth-tg-routes.js';
import { authRoutes } from './auth/auth-routes.js';
import { initDatabase } from './db/init.js';
import { APP_IP, APP_PORT } from './env.js';
import { swaggerConfig, swaggerUiConfig } from './swagger-config.js';

initDatabase();

const server = Fastify({ logger: true });

// Register plugins
server.register(fastifyCompress);
server.register(fastifySwagger, swaggerConfig);
server.register(fastifySwaggerUi, swaggerUiConfig);
server.register(cors, { origin: '*' });
server.register(fastifySSEPlugin);

// Register route groups
server.register(authRoutes, { prefix: '/api/auth' });
server.register(tgAuthRoutes, { prefix: '/api/auth-tg' });

server.listen({ port: APP_PORT, host: APP_IP }, (err, address) => {
  if (err) {
    server.log.debug(err);
    process.exit(1);
  }
  server.log.info(`server listening on ${address}`);
});
