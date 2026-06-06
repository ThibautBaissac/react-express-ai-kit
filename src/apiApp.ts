import express, { type ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export const healthResponse = { status: "ok" } as const;

export function createApiApp() {
  const app = express();

  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json(healthResponse);
  });

  app.use(errorHandler);

  return app;
}

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Bad Request",
      issues: err.issues,
    });
    return;
  }

  const statusCode = getStatusCode(err);

  res.status(statusCode).json({
    error: statusCode >= 500 ? "Internal Server Error" : getErrorMessage(err),
  });
};

function getStatusCode(err: unknown) {
  if (typeof err !== "object" || err === null || !("statusCode" in err)) {
    return 500;
  }

  const { statusCode } = err;
  return typeof statusCode === "number" && statusCode >= 400 && statusCode < 600
    ? statusCode
    : 500;
}

function getErrorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Request failed";
}
