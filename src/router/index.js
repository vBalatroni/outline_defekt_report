import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CsvDemoView from '../views/CsvDemoView.vue'
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
      path: '/csv-demo',
      name: 'csv-demo',
      component: CsvDemoView,
    },
    {
      path: '/json-config',
      name: 'json-config',
      component: JsonConfigManager,
    }
  ],
})

export default router
