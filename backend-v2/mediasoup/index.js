process.env.DEBUG = "mediasoup*";
const mediasoup =  require('mediasoup');
const { Consumer } = require('mediasoup/lib/Consumer');
const { Router } = require('mediasoup/lib/Router');
const { WebRtcTransport } = require('mediasoup/lib/WebRtcTransport');
const { Socket, Server } = require('socket.io');

const mediasoupConfig = require('./mediasoupConfig');

const httpServer = require('http').createServer();

let config = {
  httpIp: "0.0.0.0",
  httpPort: 3000,
  mediasoup: mediasoupConfig,
  socketio: {},
}
if(process.env.DEVELOPMENT){
  console.log('RUNNING SIGNALING SERVER IN DEVELOPMENT MODE');
  console.log('settting cors for localhost:8080');
  config.socketio['cors'] = {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"],
  }
}

/** @type {Router} */
let singleRouter;
/** @type {WebRtcTransport} */
let receivingTransport;
/** @type {WebRtcTransport} */
let sendingTransport;
(async () => {
  try{

    const singleWorker = await mediasoup.createWorker({
      logLevel: config.mediasoup.worker.logLevel,
      logTags: config.mediasoup.worker.logTags,
      rtcMinPort: config.mediasoup.worker.rtcMinPort,
      rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
    });

    singleWorker.on('died', () => {
      console.error('mediasoup worker died (this should never happen)');
      process.exit(1);
    });

    console.log('created worker with PID:', singleWorker.pid);
    singleRouter = await singleWorker.createRouter({mediaCodecs} = config.mediasoup.router);
    receivingTransport = await singleRouter.createWebRtcTransport(config.mediasoup.webRtcTransport);

    sendingTransport = await singleRouter.createWebRtcTransport(config.mediasoup.webRtcTransport);
    // console.log(await singleTransport.dump());
  } catch(err) {
    console.error({err});
  }
  
})();

const io = new Server(httpServer, config.socketio);

// require('./logging-observers');

// const capabilities = mediasoup.getSupportedRtpCapabilities();
// console.log(capabilities);



io.on('connection', /**@param {Socket} socket*/ (socket ) => {
  console.log('client connected: ', socket.id);
  socket.on('disconnect', (reason) => console.log(`client disconnected: ${socket.id}. Reason: ${reason}`));
  socket.onAny((eventName, data) => console.log(`event received from socket ${socket.id}. type: ${eventName}, data: ${data}`));

  socket.on('getRtpCapabilities', (cb) => {
    console.log('getRtpCapabilities requested');
    let caps = singleRouter.rtpCapabilities
    console.log('caps are: ', caps);
    cb(caps);
    return;
  })

  socket.on('getSendTransportOptions', cb => {
    console.log('getSendTransportOptions request received');
    // console.log('transportOptions:', transportOptions);
    const { id, iceParameters, iceCandidates, dtlsParameters } = receivingTransport;
    const transportOptions = { id, iceParameters, iceCandidates, dtlsParameters };
    console.log('transport options are:', transportOptions);
    cb(transportOptions);
    return;

  })

  socket.on('getReceiveTransportOptions', cb => {
    console.log('getReceiveTransportOptions request received');
    // console.log('transportOptions:', transportOptions);
    const { id, iceParameters, iceCandidates, dtlsParameters } = sendingTransport;
    const transportOptions = { id, iceParameters, iceCandidates, dtlsParameters };
    console.log('transport options are:', transportOptions);
    cb(transportOptions);
    return;

  })

  socket.on('transportConnect', async (data, cb) => {
    console.log('transport-connect requested with data:', data);
    const  dtlsParameters  = data.dtlsParameters;
    const clientDirection = data.direction;
    console.log('calling connect with dtlsParameters:', dtlsParameters);
    try {
      if(clientDirection === 'sending'){
        await receivingTransport.connect({ dtlsParameters });
      }else {
        await sendingTransport.connect({ dtlsParameters });
      }
      console.log('connect called without error');
      cb({data: 'yaay'});
    } catch (err) {
      console.error(err);
      cb({error: 'no bueno'});
    }
  });

  let producer;
  socket.on('transportProduce', async (data, cb) => {
    console.log('transportConsume requested with data:', data);
    try {
      let { kind, rtpParameters } = data;
  
      if (!receivingTransport) {
        err(`transport-produce: server-side no transport exists`);
        cb({ error: `transport-produce: server-side no transport exists`});
        return;
      }
  
      producer = await receivingTransport.produce({
        kind,
        rtpParameters,
        paused: false
      });
  
      // if our associated transport closes, close ourself, too
      producer.on('transportclose', () => {
        log('producer\'s transport closed', producer.id);
        producer.close();
      });
  
      cb({data: { producerId: producer.id } });
    } catch (e) {
    }
  })

  /** @type { Consumer } */
  let consumer;
  socket.on('transportConsume', async (data, cb) => {
    console.log('transportConsume requested with data:', data);
    let { rtpCapabilities } = data;

    // Should check if receiver can consume the used codecs with the router.canConsume function
    // But for now, we trust it'll wotk.... hehe...

    try{
      consumer = await sendingTransport.consume({
        producerId: producer.id,
        rtpCapabilities,
        paused: true, 
      });

      

      cb({
        // producerId: producer.id,
        producerId: consumer.producerId,
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerPaused: consumer.producerPaused
      });
    }catch(err){
      console.error(err);
    }
  })

  socket.on('resumeConsumer', async (cb) => {
    console.log('resumeConsumer requested');
    try{
      consumer.resume();
      cb();
    } catch (err) {
      console.error(err);
    }
  })
})


httpServer.listen(3030);
