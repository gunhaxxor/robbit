import * as mediasoupClient from 'mediasoup-client';
import { UnsupportedError } from 'mediasoup-client/lib/errors';
import { RtpCapabilities } from 'mediasoup-client/lib/RtpParameters';

export let device: mediasoupClient.Device;

export function initDevice () {
  try {
    device = new mediasoupClient.Device();
  } catch (error) {
    if (error instanceof UnsupportedError && error.name === 'UnsupportedError') {
      console.warn('browser not supported');
    } else {
      console.error(error);
    }
  }
}

export async function loadDevice (capabilities: RtpCapabilities) {
  await device.load({ routerRtpCapabilities: capabilities });
}
