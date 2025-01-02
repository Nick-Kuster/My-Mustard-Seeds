const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('pages/IndexPage.vue'),
      },
      {
        path: 'entry/new',
        component: () => import('pages/NewEntryPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'entry/:id',
        component: () => import('pages/ViewEntryPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: '/entry/:id/edit',
        component: () => import('pages/EditEntryPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'search',
        component: () => import('pages/SearchPage.vue'),
      },
    ],
  },
  {
    path: '/login',
    component: () => import('layouts/BlankLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/LoginPage.vue'),
        meta: { requiresAuth: false },
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
