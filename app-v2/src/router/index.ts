// import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
// import { StateInterface } from '../store';
import clientRoutes from './clientRoutes';
import robotRoutes from './robotRoutes';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

import { Platform } from 'quasar';

let isDesktop = true;
try {
  isDesktop = (Platform.is.desktop) as boolean;
  console.log('isDesktop:', isDesktop);
} catch (err) {
  console.error(err);
}

// export default route<StateInterface>
export default function (/* { store, ssrContext } */) {
  const createHistory =
    process.env.SERVER
      ? createMemoryHistory
      : process.env.VUE_ROUTER_MODE === 'history'
        ? createWebHistory
        : createWebHashHistory;

  console.log(Platform.is);

  let routes = clientRoutes;
  if (!isDesktop) {
    routes = robotRoutes;
  }

  // TODO: find out why platform can't be used at this stage in the app initialization
  // try {
  //   const isDesktop: boolean = (Platform.is.desktop) as boolean;
  //   if (!isDesktop) {
  //     routes = robotRoutes;
  //   }
  // } catch (err) {
  //   console.error(err);
  // }

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes: routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(
      process.env.MODE === 'ssr' ? void 0 : process.env.VUE_ROUTER_BASE,
    ),
  });

  return Router;
}
