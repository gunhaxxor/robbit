<template>
  <q-page padding>
    <h3>
      Robbit!
    </h3>
    <h4>
      Vilken robbit vill du ansluta till?
    </h4>
    <q-input v-model="robbitName" rounded outlined />
  </q-page>
</template>

<script lang="ts">
import {
  defineComponent,
  ref
} from 'vue';

export default defineComponent({
  name: 'ClientHome',
  components: {},
  setup () {
    const robbitName = ref<string>('');

    window.localStorage.getItem('recent-connected-robots');

    // .then(robots => {
    //   if (robots === null) {
    //     console.log("key not found in storage: recent-connected-robots");
    //   } else {
    //     let parsedRobots = JSON.parse(robots);
    //     console.log(`got robot list from storage:`);
    //     console.log(robots);
    //     parsedRobots.sort((a, b) => {
    //       return a.date < b.date ? 1 : -1;
    //     });
    //     this.recentConnectedRobots = parsedRobots;
    //   }
    // })
    // .catch(err => {
    //   console.log(err);
    // });

    return {
      robbitName
    };
  }
});
</script>

<style scoped lang="scss">
</style>
