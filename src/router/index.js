import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import FormLayout from '../views/FormLayout.vue'
import ConfirmationStep from '../components/ConfirmationStep.vue'
import GeneralDataStep from '../components/GeneralDataStep.vue'
import ProductsStep from '../components/ProductsStep.vue'
import SummaryStep from '../components/SummaryStep.vue'
import SuccessStep from '../components/SuccessStep.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/report',
      component: FormLayout,
      redirect: '/report/confirmation',
      children: [
        {
          path: 'confirmation',
          name: 'step-confirmation',
          component: ConfirmationStep
        },
        {
          path: 'general-data',
          name: 'step-general-data',
          component: GeneralDataStep
        },
        {
          path: 'products',
          name: 'step-products',
          component: ProductsStep
        },
        {
          path: 'summary',
          name: 'step-summary',
          component: SummaryStep
        },
        {
          path: 'success',
          name: 'step-success',
          component: SuccessStep
        }
      ]
    },
  ],
})

export default router
