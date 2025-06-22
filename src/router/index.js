import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CsvDemoView from '../views/CsvDemoView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/csv-demo',
      name: 'csv-demo',
      component: CsvDemoView,
    }
  ],
})

export default router
