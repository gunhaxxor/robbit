import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/ClientLayout.vue'),
    children: [
      { path: 'home', component: () => import('pages/client/ClientHome.vue') },
      { path: '', component: () => import('pages/client/MediasoupTest.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/Error404.vue'),
  },
];

export default routes;
