<template>
  <q-page padding>
    <h3>
      Robbit!
    </h3>
    <h4>
      Vilken robbit vill du ansluta till?
    </h4>
    <q-form @submit="onFormSubmit">
      <q-input v-model="robbitName" rounded outlined />
      <q-btn :label="'Ring upp ' + robbitName" type="submit" />
    </q-form>
    <q-list>
      <q-item v-for="robot in recentConnectedRobots" :key="robot.name">
        {{ robot.name }}
      </q-item>
    </q-list>
  </q-page>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
} from 'vue';

import { useQuasar } from 'quasar';

interface RecentRobot {
  name: string;
  date: Date;
}

export default defineComponent({
  name: 'ClientHome',
  components: {},
  setup () {
    const $q = useQuasar();
    console.log($q.platform);
    const robbitName = ref<string>('');
    const recentConnectedRobots = ref<Array<RecentRobot>>([]);

    const storageResponse = window.localStorage.getItem('recent-connected-robots');
    if (storageResponse) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parsedRobots: Array<RecentRobot> = JSON.parse(storageResponse);
      console.log('got robot list from storage:');
      console.log(storageResponse);
      parsedRobots.sort((a: RecentRobot, b: RecentRobot) => {
        return a.date < b.date ? 1 : -1;
      });

      recentConnectedRobots.value = parsedRobots;
    }

    function onFormSubmit () {
      console.log('form submitted');
    }

    return {
      robbitName,
      recentConnectedRobots,
      onFormSubmit,
    };
  },
});
</script>

<style scoped lang="scss">
</style>
