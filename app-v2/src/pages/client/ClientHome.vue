<template>
  <q-page padding>
    <h3>
      Hello {{ person }}!
    </h3>
    <q-input v-model="person" />
  </q-page>
</template>

<script lang="ts">
import {
  defineComponent,
  ref
} from 'vue'

export default defineComponent({
  name: 'ClientHome',
  components: {},
  setup () {
    const person = ref<string>('stranger')

    return {
      person
    }
  }
})
</script>

<style scoped lang="scss">
</style>
