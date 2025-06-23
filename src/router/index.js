import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import JsonDemoView from '../views/JsonDemoView.vue'
import JsonConfigManager from '../components/JsonConfigManager.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/json-demo',
      name: 'json-demo',
      component: JsonDemoView,
    },
    {
      path: '/json-config',
      name: 'json-config',
      component: JsonConfigManager,
    }
  ],
})

export default router
