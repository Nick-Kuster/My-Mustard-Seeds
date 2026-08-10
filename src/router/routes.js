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
      {
        path: 'settings',
        component: () => import('pages/SettingsPage.vue'),
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
    path: '/privacy',
    component: () => import('layouts/BlankLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/PrivacyPolicyPage.vue'),
        meta: { requiresAuth: false },
      },
    ],
  },
  {
    path: '/terms',
    component: () => import('layouts/BlankLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/TermsOfServicePage.vue'),
        meta: { requiresAuth: false },
      },
    ],
  },
  {
    path: '/auth/callback',
    component: () => import('layouts/BlankLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/AuthCallback.vue'),
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('layouts/BlankLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/ErrorNotFound.vue'),
      },
    ],
  },
]

export default routes
