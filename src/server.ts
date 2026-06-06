import express from "express";
import { createServer } from "node:http";
import { env } from "./shared/lib/env";

const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

const server = createServer(app);

server.on("error", (error) => {
  console.error("API failed to start", error);
  process.exitCode = 1;
});

server.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
