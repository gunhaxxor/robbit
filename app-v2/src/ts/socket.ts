import { io, Socket } from 'socket.io-client';

declare module 'socket.io-client' {
  interface Socket {
    request(ev: string | symbol, ...args: unknown[]): Promise<unknown>;
  }
}

export interface SocketResponse {
  data?: Record<string, unknown> | string | undefined;
  error?: unknown;
}

export let socket: Socket;

export function connectTo (url?: string): void {
  if (url) {
    socket = io(url);
  } else {
    socket = io();
  }
  // Wanted to add it to the "Socket class" prototype but that doesn't work because it's not there at runtime
  socket.request = function request (ev: string, ...data: unknown[]) {
    return new Promise((resolve) => {
      // if (data.length === 0) {
      //   socket.emit(ev, resolve);
      //   return;
      // }
      // if (data) { socket.emit(ev, data, resolve); } else { socket.emit(ev, resolve); }
      socket.emit(ev, ...data, resolve);
    });
  };

  socket.on('connect', () => {
    console.log('socket connected!', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.error(`socket disconnected ${reason}`);
  });

  // Adds support for Promise to socket.io-client
}
