process.env.DEBUG = 'mediasoup*';
// const mediasoup =  require('mediasoup');
import * as mediasoup from 'mediasoup';
import { types as mediasoupTypes } from 'mediasoup';
// const { Consumer } = require('mediasoup/lib/Consumer');
// const { Router } = require('mediasoup/lib/Router');
// const { WebRtcTransport } = require('mediasoup/lib/WebRtcTransport');
// const { Socket, Server } = require('socket.io');
import { Server, SocketExt } from 'socket.io';

// const mediasoupConfig = require('./mediasoupConfig');
import mediasoupConfig from './mediasoupConfig';

// const httpServer = require('http').createServer();
import http from 'http';
import Peer from './Peer';
import Room from './Room';
const httpServer = http.createServer();

const config = {
  httpIp: '0.0.0.0',
  httpPort: 3000,
  mediasoup: mediasoupConfig,
  socketio: {},
};
if(process.env.DEVELOPMENT){
  console.log('RUNNING SIGNALING SERVER IN DEVELOPMENT MODE');
  console.log('settting cors for localhost:8080');
  Object.assign(config.socketio, {
    cors: {
      origin: 'http://localhost:8080',
      methods: ['GET', 'POST'],
    },
  });
  console.log('application config after setting cors:', config);
}

const workers: mediasoupTypes.Worker[] = [];
async function createWorkers(): Promise<void> {
  const {
    numWorkers,
  } = config.mediasoup;

  for (let i = 0; i < numWorkers; i++) {
    const worker = await mediasoup.createWorker({
      logLevel: config.mediasoup.worker.logLevel,
      logTags: config.mediasoup.worker.logTags,
      rtcMinPort: config.mediasoup.worker.rtcMinPort,
      rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
    });

    worker.on('died', () => {
      console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
      setTimeout(() => process.exit(1), 2000);
    });

    
    workers.push(worker);

    // log worker resource usage
    /*setInterval(async () => {
          const usage = await worker.getResourceUsage();

          console.info('mediasoup Worker resource usage [pid:%d]: %o', worker.pid, usage);
      }, 120000);*/
  }
}

createWorkers();

/**
 * Get next mediasoup Worker.
 */
let nextMediasoupWorkerIdx = 0;
function getMediasoupWorker() {
  const worker = workers[nextMediasoupWorkerIdx];

  if (++nextMediasoupWorkerIdx === workers.length)
    nextMediasoupWorkerIdx = 0;

  return worker;
}

const io = new Server(httpServer, config.socketio);

const allRooms: Map<string, Room> = new Map();
const allPeers: Map<string, Peer> = new Map();

// TODO: move socket event handlers into Peer class!!!
io.on('connection', (newSocket) => {
  const socket: SocketExt = newSocket;
  const peer = new Peer(socket);
  allPeers.set(socket.id, peer);

  socket.on('disconnect', (reason) => {
    console.log(`socket ${socket.id} disconnected. Reason: ${reason}`);
    //TODO: Remove peer from potential rooms
  });
  socket.on('disconnecting', (reason) => {
    console.log(`socket ${socket.id} disconnecting. Reason ${reason}`);
  });

  socket.on('setName', (data, cb: (response: SocketAck) => void) => {
    peer.name = data.name;
    cb({status: 'success', message: 'Successfully set name for peer'});
  });

  socket.on('setRtpCapabilities', (data, cb: AcknowledgeCallback) => {
    peer.setRtpCapabilities(data);
    cb({status: 'success', message: 'Successfully set peer rtpCapabilities on server side'});
  }
  );

  socket.on('createRoom', async (roomName, cb: (response: SocketAck) => void) => {
    try{
      if(allRooms.has(roomName)){
        cb({status: 'error', errorMessage: 'room name already in use'});
        return;
      }
      const createdRoom = await Room.createRoom(roomName, getMediasoupWorker(), io);
      allRooms.set(roomName, createdRoom);
      cb({status: 'success', message: `you successfully created room: ${roomName}`});
      // socket.join(data.room);
    }catch(err){
      cb({
        status: 'error',
        errorMessage: 'failed to create room',
      });
    }
  });

  socket.on('joinRoom', async (roomName , cb: (response: SocketAck) => void) => {
    
    console.log(`received request to join room: ${roomName}`);
    const room = allRooms.get(roomName);
    console.log(`found room: ${room}`);
    if(room){
    //   room.addPeer(peer);
    //   cb({status: 'success', message: `you successfully joined room ${roomName}`});
    //   return;
      try {
        await peer.joinRoom(room);
        cb({status: 'success', message: 'Successfully joined room'});
      } catch( err){
        cb({status: 'error', errorMessage: 'Failed to join the room'});
        return;
      }
    }
    
    cb({status: 'error', errorMessage: `Failed to join room. No such room found: ${roomName}`});
  });

  socket.on('getRouterRtpCapabilities', (cb: (response : SocketAck) => void ) =>{
    if(peer.room){
      const capabilities = peer.room.getRtpCapabilities();
      cb({status: 'success', data: capabilities});
      return;
    }
    cb({status: 'error', errorMessage: 'You need to be in a room to get RtpCapabilities. The capabilities are linked to the router and thus each room has its own set of rtp capabilities'});
  });

  socket.on('createReceiveTransport', async (cb: AcknowledgeCallback) => {
    try{
      const transportOptions = await peer.createWebRtcTransport(true);
      cb({status: 'success', message: 'transports created', data: transportOptions});
    } catch( err){
      cb({status: 'error', errorMessage: 'Failed to create transports'});
    }

  });

  socket.on('createSendTransport', async (cb: AcknowledgeCallback) => {
    try{
      const transportOptions = await peer.createWebRtcTransport(false);
      cb({status: 'success', message: 'transports created', data: transportOptions});
    } catch( err){
      cb({status: 'error', errorMessage: 'Failed to create transports'});
    }
  });

  socket.on('connectTransport', async (data, cb: AcknowledgeCallback) => {
    try {
      const { id, dtlsParameters } = data;
      await peer.connectTransport(id, dtlsParameters);
      cb({status: 'success', message: 'Succefully connected transport'});
    } catch(err){
      // TODO. make sure if it works to send an error object in the data field
      cb({status: 'error', errorMessage: 'Failed to connect transport', data: err});
    }
  });

  socket.on('createProducer', async ( data, cb: AcknowledgeCallback)  => {
    try {

      const producer = await peer.createProducer(data.rtpParameters, data.kind);
      console.log(`producer created: ${producer}`);
      cb({status: 'success', message: 'producer created', data: {id: producer.id}});
    } catch( err) {
      cb({status: 'error', errorMessage: 'Failed to create producer'});
    }
  });

  socket.on('createConsumer', async (data, cb: AcknowledgeCallback) => {
    try {
      const consumerOptions = await peer.createConsumer(data.producerId);
      // const ackResponse = { 
      //   id: consumer.id,
      //   producerId: consumer.producerId , 
      //   kind: consumer.kind, 
      //   rtpParameters: consumer.rtpParameters,
      // };
      cb({status: 'success', message: 'Consumer created', data: consumerOptions});
    } catch (err) {
      cb({status: 'error', errorMessage: err});
    }
  });

});

httpServer.listen(config.httpPort);
