import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import JsonDemoView from '../views/JsonDemoView.vue'
import FormTestView from '../views/FormTestView.vue'

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
      path: '/form-test',
      name: 'form-test',
      component: FormTestView,
    }
  ],
})

export default router
