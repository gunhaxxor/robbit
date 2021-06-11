<template>
  <q-page padding>
    <h3>
      Mediasoup test
    </h3>
    <q-form>
      <!-- <q-select v-model="selectedDeviceId" :options="devices" outlined /> -->
      <select v-model="selectedDeviceId">
        <option v-for="device in devices" :key="device.deviceId" :value="device.deviceId">
          {{ device.label }}
        </option>
      </select>
      <q-btn color="primary" label="request device" @click="getLocalStream(selectedDeviceId)" />
      <q-btn color="accent" label="send video" @click="sendVideo" />
      <q-input v-model="userName" outlined dense label="username" />
      <q-btn color="primary" label="set username" @click="setName(userName)" />
      <q-input v-model="roomName" label="room name" outlined dense />
      <q-btn color="primary" type="submit" label="create room" @click="createRoom(roomName)" />
      <q-btn color="primary" label="join room" @click="joinRoom(roomName)" />
      <template v-for="peer in roomState" :key="peer.peerId">
        <q-btn v-for="producer in peer.producersData" :key="producer.producerId" :label="producer.producerId" @click="getRemoteTrack(producer.producerId)" />
      </template>
    </q-form>
    <video ref="localVideo" autoplay />
    <video ref="receivingVideo" autoplay />
    <pre>
      {{ roomState }}
    </pre>
    <!-- <q-btn color="primary" label="do it!!" @click="initializeMediasoup" /> -->
  </q-page>
</template>

<script lang="ts">
// import { socket, connectTo } from 'ts/socket';
// import { initDevice, loadDevice } from 'ts/mediasoup-utils';
import {
  defineComponent,
  ref,
  // computed,
} from 'vue';

// import PeerClient from 'ts/PeerClient';

// import { useTestStore } from 'src/store/useTestStore';
import usePeerClient from 'ts/usePeerClient';

// import { types as mediasoupTypes } from 'mediasoup-client';
// import { ConsumerOptions } from 'mediasoup-client/lib/Consumer';

export default defineComponent({
  name: 'MediasoupTest',
  components: {},
  setup () {
    const { roomState, requestMedia, startProducing, consume, setName, createRoom, joinRoom } = usePeerClient();
    // const testStore = useTestStore();
    const selectedDeviceId = ref<string>('');
    // const devices = ref<Array<MediaDeviceInfo>>([]);
    // const roomName = ref<string>('');
    // const userName = ref<string>('');
    const localStream = ref<MediaStream>();
    const localVideo = ref<HTMLVideoElement>();
    const receivingVideo = ref<HTMLVideoElement>();

    async function getRemoteTrack (producerId: string) {
      const track = await consume(producerId);
      if (receivingVideo.value) {
        const stream = new MediaStream([track]);
        receivingVideo.value.srcObject = stream;
      }
    }

    async function getLocalStream (deviceId: string) {
      const stream = await requestMedia(deviceId);
      localStream.value = stream;
      if (localVideo.value) {
        localVideo.value.srcObject = stream;
      }
    }
    async function sendVideo () {
      if (!localStream.value) {
        console.error('no localstream present');
        return;
      }
      const producerId = await startProducing(localStream.value);
      console.log('started producing!. producerId: ', producerId);
    }
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

    // void (async () => {
    //   const mediaDevices = await navigator.mediaDevices.enumerateDevices();
    //   console.log(mediaDevices);
    //   devices.value = mediaDevices.filter(dev => dev.kind === 'videoinput');
    //   console.log(devices.value);
    // })();

    const data = {
      roomState,
      selectedDeviceId,
      localVideo,
      receivingVideo,
      getLocalStream,
      getRemoteTrack,
      requestMedia,
      sendVideo,
      startProducing,
      consume,
      setName,
      joinRoom,
      createRoom,
    };

    return data;
  },
  data: () => ({
    userName: '',
    roomName: '',
    devices: [] as Array<MediaDeviceInfo>,
  }),
  async mounted () {
    const mediaDevices = await navigator.mediaDevices.enumerateDevices();
    console.log(mediaDevices);
    this.devices = mediaDevices.filter(dev => dev.kind === 'videoinput');
    console.log(this.devices);
  },
  methods: {
    // async requestDevice (deviceId: string) {
    //   // console.log('requesting local stream');
    //   const localStream = await this.requestMedia(deviceId);
    //   const videoElement = this.$refs.localVideo as HTMLVideoElement;
    //   videoElement.srcObject = localStream;
    // },
    // sendVideo(){
    //   this.startProducing(this.lo)
    // }
  },
});
</script>

<style scoped lang="scss">
</style>
