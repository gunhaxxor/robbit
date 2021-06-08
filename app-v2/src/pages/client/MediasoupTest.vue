<template>
  <q-page padding>
    <h3>
      Mediasoup test {{ testValue }}
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
  computed,
} from 'vue';

// import PeerClient from 'ts/PeerClient';

import { useTestStore } from 'src/store/useTestStore';
import usePeerClient from 'ts/usePeerClient';

// import { types as mediasoupTypes } from 'mediasoup-client';
// import { ConsumerOptions } from 'mediasoup-client/lib/Consumer';

export default defineComponent({
  name: 'MediasoupTest',
  components: {},
  setup () {
    const { requestMedia, setName, createRoom } = usePeerClient();
    const testStore = useTestStore();
    const selectedDeviceId = ref<string>('');
    const devices = ref<Array<MediaDeviceInfo>>([]);
    const localStream = ref<MediaStream>();
    const videoelement = ref<HTMLVideoElement>();
    const receivingVideo = ref<HTMLVideoElement>();

    // const peer: PeerClient = new PeerClient('localhost:3000');

    // async function requestMedia (deviceId: string) {
    //   // eslint-disable-next-line no-undef
    //   const constraints: MediaStreamConstraints = {
    //     video: {
    //       deviceId: deviceId,
    //     },
    //   };
    //   const stream = await navigator.mediaDevices.getUserMedia(constraints);
    //   localStream.value = stream;
    //   if (videoelement.value) {
    //     videoelement.value.srcObject = stream;
    //     void videoelement.value.play();
    //   }
    //   const track = stream.getVideoTracks()[0];
    //   const producerId = await peer.produce(track);
    //   const consumer = await peer.consume(producerId);
    //   const remoteStream: MediaStream = new MediaStream([consumer.track]);
    //   if (receivingVideo.value) {
    //     receivingVideo.value.srcObject = remoteStream;
    //   }
    // }

    // connectTo('localhost:3000');

    // void (async function () {
    //   await peer.awaitConnection();
    //   console.log('connect promise resolved!');
    //   const nameResponse = await peer.setName('bajskorv');
    //   console.log(nameResponse);

    //   const createResponse = await peer.createRoom('rummet');
    //   console.log(createResponse);

    //   const joinResponse = await peer.joinRoom('rummet');
    //   console.log(joinResponse);

    //   // TODO (I think)
    //   // getRouterCapabilities
    //   const response = await peer.getRouterCapabilities();
    //   console.log(response);
    //   // Load mediasoup device providing received capabilities
    //   await peer.loadMediasoupDevice(response);
    //   await peer.sendRtpCapabilities();
    //   // Create transports (receive and/or send)
    //   await peer.createSendTransport();
    //   await peer.createReceiveTransport();
    //   //
    // })();

    void (async () => {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      console.log(mediaDevices);
      devices.value = mediaDevices.filter(dev => dev.kind === 'videoinput');
      console.log(devices.value);
    })();

    return {
      devices,
      selectedDeviceId,
      // requestMedia,
      localStream,
      videoelement,
      receivingVideo,
      testValue: computed(() => testStore.testValue),
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
