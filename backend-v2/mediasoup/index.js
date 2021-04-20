const mediasoup =  require('mediasoup');

const capabilities = mediasoup.getSupportedRtpCapabilities();
console.log(capabilities);