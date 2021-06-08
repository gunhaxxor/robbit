import { createPinia } from 'pinia';
import { boot } from 'quasar/wrappers';

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(({ app } /* { app, router, ... } */) => {
  // something to do
  app.use(createPinia());
});
