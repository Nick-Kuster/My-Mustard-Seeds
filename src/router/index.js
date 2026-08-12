import { route } from 'quasar/wrappers'
import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from 'src/boot/supabase'
import routes from './routes'

export default route(function (/* { store, ssrContext } */) {
  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createWebHistory(),
  })

  Router.beforeEach(async (to) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (to.meta.requiresAuth && !session) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }

    if (to.path === '/login' && session) {
      return typeof to.query.redirect === 'string' ? to.query.redirect : '/'
    }
  })

  return Router
})
