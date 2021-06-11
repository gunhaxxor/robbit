
// Hello there! The purpose of this file is to augment the types of the socket.io-client.
// You should not be required to import this file. Typescript compiler seems to pick it up automatically

import { Socket } from 'socket.io-client';
// import { Socket } from 'socket.io-client/build/socket';

// import {Socket} from 'socket.io-client';
// const Socket = require('socket.io-client/build/socket');

declare module 'socket.io-client' {
// declare module 'socket.io-client/build/socket' {
  interface Socket {
    request(ev: SocketEvent, ...args: unknown[]): Promise<SocketAck>;
  }

  interface SocketExt extends Omit<Socket, 'on'> {
    request(ev: SocketEvent, ...args: unknown[]): Promise<SocketAck>;
    on(ev: SocketClientEvent, listener: (...args: unknown[]) => void): Socket;
    on(ev: 'roomState', listener: (data: RoomState) => void): Socket;
    on(ev: 'disconnect', listener: (reason: Socket.DisconnectReason) => void): Socket;
  }
}

// This prototype addition doesn't work for me. Instead I had to add to function to the socket instance directly after it's created (after the call to the io-function)
Socket.prototype.request = function (ev: SocketEvent, ...data: unknown[]): Promise<SocketAck> {
  return new Promise((resolve) => {
    this.emit(ev, ...data, resolve);
  });
};
