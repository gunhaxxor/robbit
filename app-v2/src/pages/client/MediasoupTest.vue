<template>
  <q-page padding>
    <h3>
      Mediasoup test
    </h3>
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
    <video v-if="true || localStream" ref="videoelement" />
    <q-btn color="primary" label="emit to socket" @click="emitRandomNumber" />
  </q-page>
</template>

<script lang="ts">
import { socket, connectTo } from 'ts/socket';
import {
  defineComponent,
  ref,
} from 'vue';

export default defineComponent({
  name: 'MediasoupTest',
  components: {},
  setup () {
    const selectedDeviceId = ref<string>();
    const devices = ref<Array<MediaDeviceInfo>>([]);
    const localStream = ref<MediaStream>();
    const videoelement = ref<HTMLVideoElement | null>(null);

    void (async () => {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      console.log(mediaDevices);
      devices.value = mediaDevices.filter(dev => dev.kind === 'videoinput');
      console.log(devices.value);
    })();

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

    connectTo('localhost:3000');

    function emitRandomNumber () {
      socket.emit('number', Math.random() * 1000);
    }

    return {
      devices,
      selectedDeviceId,
      requestMedia,
      localStream,
      videoelement,
      emitRandomNumber,
    };
  },
});
</script>

<style scoped lang="scss">
</style>
