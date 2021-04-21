process.env.DEBUG = "mediasoup*";
const mediasoup =  require('mediasoup');

require('./logging-observers');

const capabilities = mediasoup.getSupportedRtpCapabilities();
console.log(capabilities);