import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';


function buildSocketUrl(url?: string): string {
  let socketUrl = '';
  let backendHostName = '';
  if (url) {
    backendHostName = url;
  } else {
    backendHostName = process.env.BACKEND_SERVER;
  }

  if (process.env.SIGNALING_PORT) {
    socketUrl = `${process.env.BACKEND_SERVER_PROTOCOL}://${backendHostName}:${process.env.SIGNALING_PORT}/`
  } else {
    socketUrl = `${process.env.BACKEND_SERVER_PROTOCOL}://${backendHostName}/`
  }

  return socketUrl;
  // return 'http://213.21.96.155:3000'
  // return 'localhost:3000';
}
// const socketConfig: SocketIoConfig = {
//   url: socketUrl,
//   options: {}
// };
// console.log('socketConfig is: ');
// console.log(socketConfig);

@Injectable()
export class SocketIOService {
  socket: SocketIOClient.Socket;
  constructor() { }
  setupSocketConnection(url?: string) {
    const socketUrl = buildSocketUrl(url);
    this.socket = io(socketUrl);
    console.log('socket:', this.socket);

    return new Promise((resolve, reject) => {
      this.socket.on('connect', () => {
        console.log('socket connected');
        resolve();
      });

      this.socket.on('disconnect', () => {
        console.log('socket disconnected');
        reject();
      });
      this.socket.on('error', (err) => {
        console.error('socket error!');
        console.error(err);
        reject();
      });
    });

  }

  tearDown() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}