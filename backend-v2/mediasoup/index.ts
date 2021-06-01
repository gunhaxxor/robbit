process.env.DEBUG = 'mediasoup*';
// const mediasoup =  require('mediasoup');
import * as mediasoup from 'mediasoup';
import { types as mediasoupTypes } from 'mediasoup';
// const { Consumer } = require('mediasoup/lib/Consumer');
// const { Router } = require('mediasoup/lib/Router');
// const { WebRtcTransport } = require('mediasoup/lib/WebRtcTransport');
// const { Socket, Server } = require('socket.io');
import { Server } from 'socket.io';

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
io.on('connection', socket => {
  const peer = new Peer(socket);
  allPeers.set(socket.id, peer);

  socket.on('setName', (data, cb) => {
    peer.name = data.name;
    cb();
  });

  socket.on('createRoom', (data, cb: (response: SocketAck) => void) => {
    try{
      Room.createRoom(data.room, getMediasoupWorker(), io);
      // socket.join(data.room);
    }catch(err){
      cb({
        status: 'error',
        errorMessage: 'failed to create room',
      });
    }
  });

  socket.on('joinRoom', (data, cb: (response: SocketAck) => void) => {
    
    const room = allRooms.get(data.room);
    if(room){
      room.addPeer(peer);
      // socket.join(data.room);
      cb({status: 'success', message: `you successfully joined room ${data.room}`});
      return;
    }
    cb({status: 'error', errorMessage: `Failed to join room. No such room found: ${data.room}`});
  });

});

// /** @type {Router} */
// let singleRouter: mediasoupTypes.Router;
// /** @type {WebRtcTransport} */
// let sendingTransport: mediasoupTypes.WebRtcTransport;
// (async () => {
//   try{

//     const singleWorker = await mediasoup.createWorker({
//       logLevel: config.mediasoup.worker.logLevel,
//       logTags: config.mediasoup.worker.logTags,
//       rtcMinPort: config.mediasoup.worker.rtcMinPort,
//       rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
//     });

//     singleWorker.on('died', () => {
//       console.error('mediasoup worker died (this should never happen)');
//       process.exit(1);
//     });

//     console.log('created worker with PID:', singleWorker.pid);
//     const {mediaCodecs}: mediasoupTypes.RouterOptions = config.mediasoup.router;
//     singleRouter = await singleWorker.createRouter({mediaCodecs});
//     receivingTransport = await singleRouter.createWebRtcTransport(config.mediasoup.webRtcTransport);

//     sendingTransport = await singleRouter.createWebRtcTransport(config.mediasoup.webRtcTransport);
//     // console.log(await singleTransport.dump());
//   } catch(err) {
//     console.error({err});
//   }
  
// })();

// const io = new Server(httpServer, config.socketio);

// // require('./logging-observers');

// // const capabilities = mediasoup.getSupportedRtpCapabilities();
// // console.log(capabilities);



// io.on('connection', /**@param {Socket} socket*/ (socket ) => {
//   console.log('client connected: ', socket.id);
//   socket.on('disconnect', (reason) => console.log(`client disconnected: ${socket.id}. Reason: ${reason}`));
//   socket.onAny((eventName, data) => console.log(`event received from socket ${socket.id}. type: ${eventName}, data: ${data}`));

//   socket.on('getRtpCapabilities', (cb) => {
//     console.log('getRtpCapabilities requested');
//     const caps = singleRouter.rtpCapabilities;
//     console.log('caps are: ', caps);
//     cb(caps);
//     return;
//   });

//   socket.on('getSendTransportOptions', cb => {
//     console.log('getSendTransportOptions request received');
//     // console.log('transportOptions:', transportOptions);
//     const { id, iceParameters, iceCandidates, dtlsParameters } = receivingTransport;
//     const transportOptions = { id, iceParameters, iceCandidates, dtlsParameters };
//     console.log('transport options are:', transportOptions);
//     cb(transportOptions);
//     return;

//   });

//   socket.on('getReceiveTransportOptions', cb => {
//     console.log('getReceiveTransportOptions request received');
//     // console.log('transportOptions:', transportOptions);
//     const { id, iceParameters, iceCandidates, dtlsParameters } = sendingTransport;
//     const transportOptions = { id, iceParameters, iceCandidates, dtlsParameters };
//     console.log('transport options are:', transportOptions);
//     cb(transportOptions);
//     return;

//   });

//   socket.on('transportConnect', async (data, cb) => {
//     console.log('transport-connect requested with data:', data);
//     const  dtlsParameters  = data.dtlsParameters;
//     const clientDirection = data.direction;
//     console.log('calling connect with dtlsParameters:', dtlsParameters);
//     try {
//       if(clientDirection === 'sending'){
//         await receivingTransport.connect({ dtlsParameters });
//       }else {
//         await sendingTransport.connect({ dtlsParameters });
//       }
//       console.log('connect called without error');
//       cb({data: 'yaay'});
//     } catch (err) {
//       console.error(err);
//       cb({error: 'no bueno'});
//     }
//   });

//   let producer: mediasoupTypes.Producer;
//   socket.on('transportProduce', async (data, cb) => {
//     console.log('transportConsume requested with data:', data);
//     try {
//       const { kind, rtpParameters } = data;
  
//       if (!receivingTransport) {
//         console.error('transport-produce: server-side no transport exists');
//         cb({ error: 'transport-produce: server-side no transport exists'});
//         return;
//       }
  
//       producer = await receivingTransport.produce({
//         kind,
//         rtpParameters,
//         paused: false,
//       });
  
//       // if our associated transport closes, close ourself, too
//       producer.on('transportclose', () => {
//         console.log('producer\'s transport closed', producer.id);
//         producer.close();
//       });
  
//       cb({data: { producerId: producer.id } });
//     } catch (e) {
//       console.error(e);
//     }
//   });

//   /** @type { Consumer } */
//   let consumer: mediasoupTypes.Consumer;
//   socket.on('transportConsume', async (data, cb) => {
//     console.log('transportConsume requested with data:', data);
//     const { rtpCapabilities } = data;

//     // Should check if receiver can consume the used codecs with the router.canConsume function
//     // But for now, we trust it'll wotk.... hehe...

//     try{
//       consumer = await sendingTransport.consume({
//         producerId: producer.id,
//         rtpCapabilities,
//         paused: true, 
//       });

      

//       cb({
//         // producerId: producer.id,
//         producerId: consumer.producerId,
//         id: consumer.id,
//         kind: consumer.kind,
//         rtpParameters: consumer.rtpParameters,
//         type: consumer.type,
//         producerPaused: consumer.producerPaused,
//       });
//     }catch(err){
//       console.error(err);
//     }
//   });

//   socket.on('resumeConsumer', async (cb) => {
//     console.log('resumeConsumer requested');
//     try{
//       consumer.resume();
//       cb();
//     } catch (err) {
//       console.error(err);
//     }
//   });
// });


httpServer.listen(3030);
