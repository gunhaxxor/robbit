import { defineStore } from 'pinia';

export const useTestStore = defineStore({
  id: 'testStore',
  state () {
    return {
      testValue: 'hello' as string,
      secondTestValue: 'gullök',
    };
  },
  actions: {
    change () {
      this.testValue = 'hejdå';
    },
    changeSecond () {
      this.secondTestValue = 'rödlök';
    },
  },
  getters: {
    withSuffix (state) {
      return state.testValue as string + ' mr kuuk!';
    },
  },
});
