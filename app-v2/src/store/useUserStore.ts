import { defineStore } from 'pinia';

export const useUserStore = defineStore({
  id: 'userStore',
  state () {
    return {
      peerId: '',
      userName: '',
    };
  },
  actions: {
    setPeerId (newPeerId: string) {
      this.peerId = newPeerId;
    },
    setUser (newUserName: string) {
      this.userName = newUserName;
    },
  },
  getters: {
    // withSuffix (state) {
    //   return state.testValue as string + ' mr kuuk!';
    // },
  },
});
