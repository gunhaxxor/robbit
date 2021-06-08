<template>
  <q-page padding>
    <h3>
      Mediasoup test
    </h3>
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
    <!-- <q-btn color="primary" label="do it!!" @click="initializeMediasoup" /> -->
  </q-page>
</template>

<script lang="ts">
// import { socket, connectTo } from 'ts/socket';
// import { initDevice, loadDevice } from 'ts/mediasoup-utils';
import {
  defineComponent,
  ref,
} from 'vue';

import PeerClient from 'ts/PeerClient';

// import { types as mediasoupTypes } from 'mediasoup-client';
// import { ConsumerOptions } from 'mediasoup-client/lib/Consumer';

export default defineComponent({
  name: 'MediasoupTest',
  components: {},
  setup () {
    const selectedDeviceId = ref<string>('');
    const devices = ref<Array<MediaDeviceInfo>>([]);
    const localStream = ref<MediaStream>();
    const videoelement = ref<HTMLVideoElement>();
    const receivingVideo = ref<HTMLVideoElement>();

    // if (receivingVideo.value) { // <---- I don't want to be forced to write this every time I use the ref.
    //   receivingVideo.value.srcObject = new MediaStream();
    // }

    const peer: PeerClient = new PeerClient('localhost:3000');

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
      const track = stream.getVideoTracks()[0];
      const producerId = await peer.produce(track);
      const consumer = await peer.consume(producerId);
      const remoteStream: MediaStream = new MediaStream([consumer.track]);
      if (receivingVideo.value) {
        receivingVideo.value.srcObject = remoteStream;
      }
    }

    // connectTo('localhost:3000');

    void (async function () {
      await peer.awaitConnection();
      console.log('connect promise resolved!');
      const nameResponse = await peer.setName('bajskorv');
      console.log(nameResponse);

      const createResponse = await peer.createRoom('rummet');
      console.log(createResponse);

      const joinResponse = await peer.joinRoom('rummet');
      console.log(joinResponse);

      // TODO (I think)
      // getRouterCapabilities
      const response = await peer.getRouterCapabilities();
      console.log(response);
      // Load mediasoup device providing received capabilities
      await peer.loadMediasoupDevice(response);
      await peer.sendRtpCapabilities();
      // Create transports (receive and/or send)
      await peer.createSendTransport();
      await peer.createReceiveTransport();
      //
    })();

    // async function initializeMediasoup () {
    //   // socket.emit('getRtpCapabilities', (answer: unknown) => console.log(answer));
    //   initDevice();

    //   // const caps: mediasoupTypes.RtpCapabilities = (await socket.request('getRtpCapabilities')) as mediasoupTypes.RtpCapabilities;
    //   // console.log('recevied capabilities from server:', caps);

    //   // await loadDevice(caps);
    //   // const sendTransportOptions: mediasoupTypes.TransportOptions = (await socket.request('getSendTransportOptions')) as mediasoupTypes.TransportOptions;
    //   // console.log('sendTransportOptions', sendTransportOptions);
    //   // createSendTransport(sendTransportOptions);
    //   // console.log('transport connectionState:', sendTransport.connectionState);

    //   // const receiveTransportOptions: mediasoupTypes.TransportOptions = (await socket.request('getReceiveTransportOptions')) as mediasoupTypes.TransportOptions;
    //   // console.log('receiveTransportOptions', receiveTransportOptions);
    //   // createReceiveTransport(receiveTransportOptions);
    //   // console.log('transport connectionState:', sendTransport.connectionState);

    //   const videoTrack = localStream.value?.getVideoTracks()[0];
    //   if (videoTrack !== undefined) {
    //     // const encodings =
    //     // [
    //     //   { maxBitrate: 96000, scaleResolutionDownBy: 4 },
    //     //   { maxBitrate: 3000000, scaleResolutionDownBy: 1 },
    //     // ];

    //     // try {
    //     //   await sendTransport.produce({
    //     //     track: videoTrack,
    //     //     encodings: encodings,
    //     //     codecOptions: {
    //     //       videoGoogleStartBitrate: 1000,
    //     //     },
    //     //     appData: {
    //     //       isCool: true,
    //     //     },
    //     //   });

    //     //   const response: ConsumerOptions = (await socket.request('transportConsume', { rtpCapabilities: device.rtpCapabilities })) as ConsumerOptions;

    //     //   const consumer = await receiveTransport.consume(response);

    //     //   // Might need to check if connected here!

    //     //   await socket.request('resumeConsumer');
    //     //   consumer.resume();

    //     //   if (receivingVideo.value) {
    //     //     console.log('receiving video tag:', receivingVideo.value);
    //     //     receivingVideo.value.srcObject = new MediaStream([consumer.track.clone()]);
    //     //   } else {
    //     //     console.error('no receiving vide ref!!!');
    //     //   }
    //     //   // consumer.track
    //     // } catch (err: unknown) {
    //     //   console.error({ err });
    //     // }
    //   }

    //   // }
    // }

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
      // initializeMediasoup,
    };
  },
  data () {
    return {
    };
  },
});
</script>

<style scoped lang="scss">
</style>
