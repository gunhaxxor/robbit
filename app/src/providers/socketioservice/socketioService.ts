import { Injectable } from '@angular/core';
import { resolveDefinition } from '@angular/core/src/view/util';
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


// Triggering an error in the console:
// You have to use something like setTimeout(function() { notThere(); }, 0);

let timeout;

@Injectable()
export class SocketIOService {
  socket: SocketIOClient.Socket;
  constructor() { }
  setupSocketConnection(url?: string, query?: object) {
    console.log('inputs: url=', url, 'query=', query);
    const socketUrl = buildSocketUrl(url);
    const socketOptions = {
      query: {}
    };
    if (query) {
      socketOptions.query = query
    }
    else {
      socketOptions.query = {
        servername: process.env.TURN_USER,
        serverpassword: process.env.TURN_PASSWORD
      };
    }
    return new Promise((resolve, reject) => {
      console.log('entered promise');
      try {
        console.log('gonna build the socket. Calling io(socketUrl, socketOptions)');
        this.socket = io(socketUrl, socketOptions);
        console.log('socket:', this.socket);

        //Browser security will not allow us to catch name resolv error. So we call reject after certain amount of time
        timeout = setTimeout(() => {
          console.log('REJECTING from timeout');
          reject();
        }, 10000);

        this.socket.on('connect', () => {
          console.log('socket connected');
          clearTimeout(timeout);
          resolve();
        });
  
        this.socket.on('disconnect', (reason) => {
          console.log('socket disconnected');
          console.log(reason);
          reject();
        });
        this.socket.on('error', (err) => {
          console.error('socket error!');
          console.error(err);
          reject();
        });
      } catch (err) {
        console.log('catch in promise of setupSocketConnection');
        console.error(err);
        reject();
      }
    });
  }

  tearDown() {
    console.log('socketService tearDown called');
    clearTimeout(timeout);
    if (this.socket) {
      this.socket.removeAllListeners();
      return new Promise((resolve, reject) => {
        this.socket.on('disconnect', (reason) => {
          console.log('awaited disconnect triggered');
          console.log(reason);
        })
        resolve();
        this.socket.close();
        delete this.socket;
        this.socket = null;

      });
    }
    return Promise.resolve();
  }
}