import debug from 'debug';

// export const log = debug('demo-app');
// log.log = console.log.bind(console);
// export const warn = debug('demo-app:WARN');
// export const err = debug('demo-app:ERROR');

if (process.env.DEBUGGING) {
  debug.enable('mediasoup*');
}
