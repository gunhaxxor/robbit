process.env.DEBUG = "mediasoup*";
const mediasoup =  require('mediasoup');
const { Socket, Server } = require('socket.io');

const httpServer = require('http').createServer();
const io = new Server(httpServer);

require('./logging-observers');

const capabilities = mediasoup.getSupportedRtpCapabilities();
console.log(capabilities);

io.on('connection', /**@param {Socket} socket*/ (socket ) => {
  console.log('client connected: ', socket.id);
  socket.onAny((eventName, data) => console.log(`event received from socket ${socket.id}. type: ${eventName}, data: ${data}`));
})

httpServer.listen(3000);