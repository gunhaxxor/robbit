import * as mediasoupClient from 'mediasoup-client';
import { types as mediasoupTypes } from 'mediasoup-client';
import { socket, SocketResponse } from 'ts/socket';

// eslint-disable-next-line no-unused-vars

export let device: mediasoupTypes.Device;
export let sendTransport: mediasoupTypes.Transport;
export let receiveTransport: mediasoupTypes.Transport;

export function initDevice () {
  try {
    device = new mediasoupClient.Device();
  } catch (error) {
    if (error instanceof mediasoupTypes.UnsupportedError && error.name === 'UnsupportedError') {
      console.warn('browser not supported');
    } else {
      console.error(error);
    }
  }
}

export async function loadDevice (routerRtpCapabilities: mediasoupTypes.RtpCapabilities) {
  console.log('loading device with routerCaps:', routerRtpCapabilities);
  await device.load({ routerRtpCapabilities });

  try {
    const canSendVideo = device.canProduce('video');
    console.log('can produce video:', canSendVideo);
  } catch (err) {
    console.error(err);
  }
  // device.createSendTransport();
}

export function createSendTransport (transportOptions : mediasoupTypes.TransportOptions) {
  // transportOptions.id = 'coolcat';
  console.log('creating transport with following options:', transportOptions);
  sendTransport = device.createSendTransport(transportOptions);

  console.log('sendTransport created:', sendTransport);

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  sendTransport.on('connect', async ({ dtlsParameters } : Record<string, unknown>, callback, errback) => {
    console.log('transport connect event. Sending connect request to server');
    // Signal local DTLS parameters to the server side transport.

    try {
      const response: SocketResponse = await socket.request(
        'transportConnect',
        {
          transportId: sendTransport.id,
          dtlsParameters,
          direction: 'sending',
        }) as SocketResponse;
      if (response.error) {
        throw Error('fuck you');
      }

      console.log('connect request successful. Response:', response);

      // Tell the transport that parameters were transmitted.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      callback();
    } catch (error) {
      // Tell the transport that something was wrong.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      errback(error);
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  sendTransport.on('produce', async (input: Record<string, unknown>, callback, errback) => {
    console.log('transport produce event with input:', input);
    const { kind, rtpParameters } = input;

    // tell the server what it needs to know from us in order to set
    // up a server-side producer object, and get back a
    // producer.id. call callback() on success or errback() on
    // failure.
    const response : SocketResponse = await socket.request('transportProduce', {
      kind,
      rtpParameters,
    }) as SocketResponse;

    const { error, data } = response;
    if (error) {
      console.error('error setting up server-side producer', error);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      errback(error);
      return;
    }
    console.log('produce request successful. Response:', response);
    if (data instanceof Object) {
      console.log('producer created on server-side. Response:', data);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, node/no-callback-literal
      callback({ id: data.producerId });
    }
  });

  sendTransport.on('connectionstatechange', (state: unknown) => {
    console.log('transport connectionstatechange: ', state);
  });
}

export function createReceiveTransport (transportOptions : mediasoupTypes.TransportOptions) {
  // transportOptions.id = 'coolcat';
  console.log('creating transport with following options:', transportOptions);
  receiveTransport = device.createRecvTransport(transportOptions);

  console.log('receiveTransport created:', receiveTransport);

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  receiveTransport.on('connect', async ({ dtlsParameters } : Record<string, unknown>, callback, errback) => {
    console.log('transport connect event. Sending connect request to server');
    // Signal local DTLS parameters to the server side transport.

    try {
      const response: SocketResponse = await socket.request(
        'transportConnect',
        {
          transportId: receiveTransport.id,
          dtlsParameters,
          direction: 'receive',
        }) as SocketResponse;
      if (response.error) {
        throw Error('fuck you');
      }

      console.log('connect request successful. Response:', response);

      // Tell the transport that parameters were transmitted.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      callback();
    } catch (error) {
      // Tell the transport that something was wrong.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      errback(error);
    }
  });

  receiveTransport.on('connectionstatechange', (state: unknown) => {
    console.log('receiveTransport connectionstatechange: ', state);
  });
}
