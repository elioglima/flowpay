import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { errorMiddleware } from "./errorMiddleware.js";

describe("errorMiddleware", () => {
  it("sends 500 json with error message", () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const res = {
      headersSent: false,
      status,
      json,
    } as unknown as Response;
    errorMiddleware(new Error("boom"), {} as Request, res, vi.fn() as NextFunction);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: "boom" });
  });

  it("uses generic message for non-Error", () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const res = {
      headersSent: false,
      status,
      json,
    } as unknown as Response;
    errorMiddleware("x", {} as Request, res, vi.fn() as NextFunction);
    expect(json).toHaveBeenCalledWith({ error: "internal error" });
  });

  it("returns early when headers already sent", () => {
    const json = vi.fn();
    const status = vi.fn();
    const res = {
      headersSent: true,
      status,
      json,
    } as unknown as Response;
    errorMiddleware(new Error("late"), {} as Request, res, vi.fn() as NextFunction);
    expect(status).not.toHaveBeenCalled();
    expect(json).not.toHaveBeenCalled();
  });
});
