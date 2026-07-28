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
        path: 'entry/:id/edit',
        component: () => import('pages/EditEntryPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'search',
        component: () => import('pages/SearchPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'resources',
        component: () => import('pages/ResourceManagementPage.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/print',
    component: () => import('layouts/BlankLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('pages/PrintPage.vue'),
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
  {
    path: '/auth/callback',
    component: () => import('pages/AuthCallback.vue'),
  },
]

export default routes
