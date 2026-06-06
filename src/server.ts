import { createServer } from "node:http";
import { createApiApp } from "./apiApp";
import { env } from "./shared/lib/env";

const server = createServer(createApiApp());

server.on("error", (error) => {
  console.error("API failed to start", error);
  process.exitCode = 1;
});

server.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
