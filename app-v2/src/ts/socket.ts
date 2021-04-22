import { io, Socket } from 'socket.io-client';

export let socket: Socket;

export function connectTo (url?: string): void {
  if (url) {
    socket = io(url);
  } else {
    socket = io();
  }

  socket.on('connect', () => {
    console.log('socket connected!', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.error(`socket disconnected ${reason}`);
  });
}
