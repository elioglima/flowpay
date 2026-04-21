import type { Response } from "express";

const clients = new Set<Response>();

export function subscribeSseClient(res: Response) {
  clients.add(res);
}

export function unsubscribeSseClient(res: Response) {
  clients.delete(res);
}

export function broadcastSse(payload: unknown) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) {
    res.write(data);
  }
}
