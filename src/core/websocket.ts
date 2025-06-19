import { WebSocketServer, WebSocket, RawData } from 'ws';
import { Server as HttpServer } from 'http';
import logger from './logger.js';

export interface SocketContext {
  socket: WebSocket;
  broadcast: (event: string, data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string) => void;
  send: (event: string, data: any) => void;
}

export abstract class EnduranceWebSocket {
  abstract onConnection(ctx: SocketContext): void;
}

export function setupWebSocketSupport(server: HttpServer, handlers: EnduranceWebSocket[], path = '/ws') {
  const wss = new WebSocketServer({ server, path });
  logger.info(`[ws] WebSocket server started at ${path}`);

  wss.on('connection', (socket: WebSocket) => {
    // eslint-disable-next-line func-call-spacing
    const listeners = new Map<string, (data: any) => void>();

    const ctx: SocketContext = {
      socket,
      broadcast: (event, data) => {
        wss.clients.forEach((client: WebSocket) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ event, data }));
          }
        });
      },
      send: (event, data) => {
        socket.send(JSON.stringify({ event, data }));
      },
      on: (event, cb) => {
        listeners.set(event, cb);
      },
      off: (event) => {
        listeners.delete(event);
      }
    };

    socket.on('message', (msg: RawData) => {
      try {
        const parsed = JSON.parse(msg.toString());
        const handler = listeners.get(parsed.event);
        if (handler) handler(parsed.data);
      } catch (e) {
        logger.warn('[ws] Invalid message format');
      }
    });

    handlers.forEach(handler => {
      handler.onConnection(ctx);
    });
  });
}
