// interface socketAck {
//   status: 'success' | 'error';
//   errorMessage?: string;
//   message?: string;
//   data?: unknown;
// }
// import ioServer from 'socket.io';

// import {Socket} from 'socket.io-client/build/socket';
// declare module 'socket.io-client' {
//   interface Socket {
//     request(ev: SocketEvent, ...args: unknown[]): Promise<SocketAck>;
//     // on(ev: string | SocketEvent, listener: (...args: any[]) => void): Socket
//   }
// } 

// declare module 'socket.io' {
//   interface Socket {
//     request(ev: SocketEvent, ...args: unknown[]): Promise<SocketAck>;
//     // on(ev: string | SocketEvent, listener: (...args: any[]) => void): Socket
//   }
// }


// interface SocketExt extends Socket {
//   on(ev: SocketEvent, listener: (...args: any[]) => void): SocketExt
//   request(ev: string | symbol, ...args: unknown[]): Promise<SocketAck>;
// }

type socketData = Record<string, unknown> | string;

interface socketSuccess {
  status: 'success';
  message?: string;
  data?: socketData;
} 

interface socketError{
  status: 'error';
  errorMessage: string;
  data?: socketData
}

type SocketAck = socketSuccess | socketError;
type AcknowledgeCallback = (ackResponse: SocketAck) => void;


type SocketPeerServerEvent = 'setName' | 'setRtpCapabilities' | 'createRoom' | 'joinRoom' | 'createSendTransport' | 'createReceiveTransport' | 'connectTransport' | 'createProducer' | 'createConsumer';
type SocketRoomServerEvent = 'getRouterRtpCapabilities';

type SocketServerEventBuiltIn = 'disconnect' | 'disconnecting';
type SocketServerEvent = SocketServerEventBuiltIn | SocketPeerServerEvent  | SocketRoomServerEvent;

type SocketPeerClientEvent = 'roomClosed';

type SocketClientEventBuiltIn = 'connect' | 'disconnect' | 'connect_error';
type SocketClientEvent = SocketClientEventBuiltIn | SocketPeerClientEvent;

type SocketEvent = SocketServerEvent | SocketClientEvent;