
// Hello there! The purpose of this file is to augment the types of the socket.io-client.
// You should not be required to import this file. Typescript compiler seems to pick it up automatically

import { Server, Socket } from 'socket.io';
// import { Socket } from 'socket.io-client/build/socket';

// import {Socket} from 'socket.io-client';
// const Socket = require('socket.io-client/build/socket');

declare module 'socket.io' {
// declare module 'socket.io-client/build/socket' {
  // interface Socket {
  //   request(ev: SocketEvent, ...args: unknown[]): Promise<SocketAck>;
  // }

  interface ServerExt extends Omit<Server, 'on'>{
    // on(ev: 'connection', listener: (socket: SocketExt) => void): void;
    // on(ev: 'connection', listener: (socket: SocketExt) => void): Server;

    on(ev: 'connection' | 'connect', listener: (socket: SocketExt) => void): Server;
  }

  interface SocketExt extends Omit<Socket, 'on'> {
    // request(ev: SocketEvent, ...args: unknown[]): Promise<SocketAck>;
    on(ev: SocketServerEvent, listener: (...args: any[]) => void): SocketExt;
    on(ev: 'disconnect', listener: (reason: string) => void): SocketExt;
    on(ev: 'disconnecting', listener: (reason: string) => void): SocketExt;

    // on(ev: 'disconnect', listener: (reason: Socket.DisconnectReason) => void): Socket;
  }
}

// This prototype addition doesn't work for me. Instead I had to add to function to the socket instance directly after it's created (after the call to the io-function)
// Socket.prototype.request = function (ev: SocketEvent, ...data: unknown[]): Promise<SocketAck> {
//   return new Promise((resolve) => {
//     this.emit(ev, ...data, resolve);
//   });
// };
