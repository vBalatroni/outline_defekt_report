<template>
  <div class="form-layout">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted, provide } from 'vue';
import { useProductStore } from '@/stores/productStore';

const store = useProductStore();

onMounted(() => {
  // Load the main product configuration once when the form layout is created.
  // This ensures all steps have access to the necessary data (categories, models, etc.).
  if (!store.isConfigured) {
    store.loadConfiguration();
  }
});

// This function was in HomeView.vue and is crucial for the logic in ProductsStep.
// It updates the model dropdown based on the selected category.
const updateDependentOptions = (product) => {
  if (!product) return;

  // Update model options when category changes
  if (product.basicInfo.category.value) {
    product.basicInfo.model.options = store.getModelsForCategory(product.basicInfo.category.value) || [];
  }
  // We can add more dependent logic here if needed in the future
};

// Provide the function to all child components of this layout.
provide('updateDependentOptions', updateDependentOptions);

</script>

<style scoped>
.form-layout {
  max-width: 900px;
  margin: 2rem auto;
  padding: 1rem;
  /* background-color: #f7f9fc; */
  border-radius: 8px;
}
</style> 