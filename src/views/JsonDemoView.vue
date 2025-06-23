<template>
  <div class="json-demo-view">
    <div class="editor-nav">
      <button @click="activeEditor = 'products'" :class="{ active: activeEditor === 'products' }">
        Product Fields
      </button>
      <button @click="activeEditor = 'symptoms'" :class="{ active: activeEditor === 'symptoms' }">
        Symptom Sets
      </button>
    </div>

    <div class="editor-content">
      <ProductConfigEditor v-if="activeEditor === 'products'" />
      <SymptomSetEditor v-if="activeEditor === 'symptoms'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ProductConfigEditor from '@/components/ProductConfigEditor.vue';
import SymptomSetEditor from '@/components/SymptomSetEditor.vue';

const activeEditor = ref('products');
</script>

<style scoped>
.json-demo-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
}
.editor-nav {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid #ccc;
  padding-bottom: 1rem;
}
.editor-nav button {
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  background-color: #f0f0f0;
  cursor: pointer;
  font-size: 1rem;
  border-radius: 6px 6px 0 0;
}
.editor-nav button.active {
  background-color: #fff;
  border-color: #ccc;
  border-bottom-color: #fff;
}
</style> 