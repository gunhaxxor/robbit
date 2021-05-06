<template>
  <q-page padding>
    <h3>
      Mediasoup trök<kbd /> test
    </h3>
    <q-btn v-if="!activated" color="primary" label="Visa Toves roliga text" @click="activated = true" />
    <h1 v-if="activated">
      bajsbajsbajsbasjbajsjadgkbajbbajajhehehehehehehelpmehehehehehe
    </h1>
    <h4>
      Gunnar är bäst
    </h4>
    <q-form @submit="requestMedia(selectedDeviceId)">
      <!-- <q-select v-model="selectedDeviceId" :options="devices" outlined /> -->
      <select v-model="selectedDeviceId">
        <option v-for="device in devices" :key="device.deviceId" :value="device.deviceId">
          {{ device.label }}
        </option>
      </select>
      <q-btn color="primary" label="video" type="submit" />
    </q-form>
    <video ref="receivingVideo" autoplay />
    <video v-if="true || localStream" ref="videoelement" />
    <q-btn color="primary" label="do it!!" @click="initializeMediasoup" />
  </q-page>
</template>

<script lang="ts">
import { socket, connectTo } from 'ts/socket';
import { device, initDevice, loadDevice, createSendTransport, createReceiveTransport, sendTransport, receiveTransport } from 'ts/mediasoup-utils';
import {
  defineComponent,
  ref,
} from 'vue';

import { types as mediasoupTypes } from 'mediasoup-client';
import { ConsumerOptions } from 'mediasoup-client/lib/Consumer';

export default defineComponent({
  name: 'MediasoupTest',
  components: {},
  setup () {
    const selectedDeviceId = ref<string>();
    const devices = ref<Array<MediaDeviceInfo>>([]);
    const localStream = ref<MediaStream>();
    const videoelement = ref<HTMLVideoElement | null>(null);

    const receivingVideo = ref<HTMLVideoElement | null>(null);

    async function requestMedia (deviceId: string) {
      // eslint-disable-next-line no-undef
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId,
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStream.value = stream;
      if (videoelement.value) {
        videoelement.value.srcObject = stream;
        void videoelement.value.play();
      }
    }

    connectTo('localhost:3030');

    async function initializeMediasoup () {
      // socket.emit('getRtpCapabilities', (answer: unknown) => console.log(answer));
      initDevice();

      const caps: mediasoupTypes.RtpCapabilities = (await socket.request('getRtpCapabilities')) as mediasoupTypes.RtpCapabilities;
      console.log('recevied capabilities from server:', caps);

      await loadDevice(caps);
      const sendTransportOptions: mediasoupTypes.TransportOptions = (await socket.request('getSendTransportOptions')) as mediasoupTypes.TransportOptions;
      console.log('sendTransportOptions', sendTransportOptions);
      createSendTransport(sendTransportOptions);
      console.log('transport connectionState:', sendTransport.connectionState);

      const receiveTransportOptions: mediasoupTypes.TransportOptions = (await socket.request('getReceiveTransportOptions')) as mediasoupTypes.TransportOptions;
      console.log('receiveTransportOptions', receiveTransportOptions);
      createReceiveTransport(receiveTransportOptions);
      console.log('transport connectionState:', sendTransport.connectionState);

      const videoTrack = localStream.value?.getVideoTracks()[0];
      if (videoTrack !== undefined) {
        const encodings =
        [
          { maxBitrate: 96000, scaleResolutionDownBy: 4 },
          { maxBitrate: 3000000, scaleResolutionDownBy: 1 },
        ];

        try {
          await sendTransport.produce({
            track: videoTrack,
            encodings: encodings,
            codecOptions: {
              videoGoogleStartBitrate: 1000,
            },
            appData: {
              isCool: true,
            },
          });

          const response: ConsumerOptions = (await socket.request('transportConsume', { rtpCapabilities: device.rtpCapabilities })) as ConsumerOptions;

          const consumer = await receiveTransport.consume(response);

          // Might need to check if connected here!

          await socket.request('resumeConsumer');
          consumer.resume();

          if (receivingVideo.value) {
            console.log('receiving video tag:', receivingVideo.value);
            receivingVideo.value.srcObject = new MediaStream([consumer.track.clone()]);
          } else {
            console.error('no receiving vide ref!!!');
          }
          // consumer.track
        } catch (err: unknown) {
          console.error({ err });
        }
      }

      // }
    }

    void (async () => {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      console.log(mediaDevices);
      devices.value = mediaDevices.filter(dev => dev.kind === 'videoinput');
      console.log(devices.value);
    })();

    return {
      devices,
      selectedDeviceId,
      requestMedia,
      localStream,
      videoelement,
      receivingVideo,
      initializeMediasoup,
    };
  },
  data () {
    return {
      activated: false,
    };
  },
});
</script>

<style scoped lang="scss">
</style>
