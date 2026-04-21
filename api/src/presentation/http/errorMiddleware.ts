import type express from "express";

export function errorMiddleware(
  err: unknown,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) {
  if (res.headersSent) {
    return;
  }
  const message = err instanceof Error ? err.message : "internal error";
  res.status(500).json({ error: message });
}
