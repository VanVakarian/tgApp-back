import fastifyCompress from "@fastify/compress";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import Fastify from "fastify";

import { APP_IP, APP_PORT } from "./env.js";
import { swaggerConfig, swaggerUiConfig } from "./swagger-config.js";

const server = Fastify({ logger: true });

server.register(fastifyCompress);
server.register(fastifySwagger, swaggerConfig);
server.register(fastifySwaggerUi, swaggerUiConfig);

server.listen({ port: APP_PORT, host: APP_IP }, (err, address) => {
  if (err) {
    server.log.debug(err);
    process.exit(1);
  }
  server.log.info(`server listening on ${address}`);
});
