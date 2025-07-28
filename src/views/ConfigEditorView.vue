<template>
  <div class="config-editor-view">
    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <a class="nav-link" :class="{ active: activeTab === 'models' }" @click.prevent="activeTab = 'models'" href="#">
          Model & Field Editor
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: activeTab === 'symptoms' }" @click.prevent="activeTab = 'symptoms'" href="#">
          Symptom Set Editor
        </a>
      </li>
    </ul>

    <div class="tab-content">
      <div v-show="activeTab === 'models'">
        <ProductConfigEditor />
      </div>
      <div v-show="activeTab === 'symptoms'">
        <SymptomSetEditor />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ProductConfigEditor from '@/components/ProductConfigEditor.vue';
import SymptomSetEditor from '@/components/SymptomSetEditor.vue';

const activeTab = ref('models'); // Default to the model editor
</script>

<style scoped>
.config-editor-view {
  padding: 2rem;
}

.nav-tabs .nav-link {
  cursor: pointer;
}
</style> 