<template>
  <div class="form-test-view">
    <header class="view-header">
      <h1>Dynamic Form Test Page</h1>
      <p>Use this page to test the dynamically generated form fields based on your configuration.</p>
      <button @click="resetAndReload" class="btn-reset">Reset to Defaults</button>
    </header>
    
    <div class="form-container">
      <ProductsStep v-model="formData" />
    </div>
    
    <div class="data-display">
      <h2>Live Form Data</h2>
      <pre>{{ formData }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useProductStore } from '@/stores/productStore';
import ProductsStep from '@/components/ProductsStep.vue';

const productStore = useProductStore();

const formData = ref({
  productCategory: '',
  productModel: '',
  dynamicFields: {}
});

onMounted(() => {
  productStore.loadConfiguration();
});

const resetAndReload = () => {
  window.location.reload();
};
</script>

<style scoped>
.form-test-view {
  padding: 2rem;
  max-width: 900px;
  margin: 0 auto;
  font-family: sans-serif;
}

.view-header {
  text-align: center;
  margin-bottom: 2rem;
}

.btn-reset {
  background-color: #e53e3e;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
}

.btn-reset:hover {
  background-color: #c53030;
}

.form-container {
  background: #ffffff;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

.data-display {
  background: #2d3748;
  color: #f7fafc;
  padding: 1.5rem;
  border-radius: 8px;
}

.data-display h2 {
  margin-top: 0;
  border-bottom: 1px solid #4a5568;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', Courier, monospace;
}
</style> 