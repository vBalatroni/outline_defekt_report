import { createRouter, createWebHistory } from 'vue-router'
import { useProductStore } from '@/stores/productStore'; // Import the store
import HomeView from '../views/HomeView.vue'
import FormLayout from '../views/FormLayout.vue'
import ConfirmationStep from '../components/ConfirmationStep.vue'
import GeneralDataStep from '../components/GeneralDataStep.vue'
import ProductsStep from '../components/ProductsStep.vue'
import SummaryStep from '../components/SummaryStep.vue'
import SuccessStep from '../components/SuccessStep.vue'
import ConfigEditorView from '../views/ConfigEditorView.vue'

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
    {
      path: '/admin/config-editor',
      name: 'config-editor',
      component: ConfigEditorView
    }
  ]
})

// Navigation Guard
router.beforeEach((to, from, next) => {
  const store = useProductStore();
  const requiredSessionRoutes = [
    'step-general-data', 
    'step-products', 
    'step-summary', 
    'step-success'
  ];

  // Check if the route requires an active session
  if (requiredSessionRoutes.includes(to.name)) {
    // Check for a session ID in the store OR directly in sessionStorage
    // This prevents a race condition on page reload where the guard runs before the store is hydrated.
    const sessionExists = store.formState.sessionId || sessionStorage.getItem('defekt_report_session_id');
    
    if (!sessionExists) {
      console.warn('Access denied. No active session. Redirecting to confirmation.');
      // If no session, redirect to the first step
      next({ name: 'step-confirmation' });
    } else {
      // If session exists, proceed
      next();
    }
  } else {
    // If the route doesn't require a session, proceed
    next();
  }
});

export default router
