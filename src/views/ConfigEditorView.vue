<template>
  <div class="config-editor-view">
    <div class="editor-layout">
      <aside class="sidebar">
        <h3>Configuration</h3>
        <ul class="menu">
          <li :class="{ active: activeTab === 'models' }" @click="activeTab = 'models'">
            <span>Models & Fields</span>
            <span class="badge" v-if="categoryCount > 0">{{ categoryCount }}</span>
          </li>
          <li :class="{ active: activeTab === 'general' }" @click="activeTab = 'general'">
            <span>General Fields</span>
          </li>
          <li :class="{ active: activeTab === 'email' }" @click="activeTab = 'email'">
            <span>Email Settings</span>
          </li>
          <li :class="{ active: activeTab === 'symptoms' }" @click="activeTab = 'symptoms'">
            <span>Symptom Sets</span>
            <span class="badge" v-if="symptomSetCount > 0">{{ symptomSetCount }}</span>
          </li>
        </ul>
      </aside>
      <main class="content">
        <header class="content-header">
          <h2>
            {{ activeTab === 'models' ? 'Models & Fields' : (activeTab === 'general' ? 'General Fields' : (activeTab === 'email' ? 'Email Settings' : 'Symptom Sets')) }}
          </h2>
        </header>
        <section class="content-body">
          <ProductConfigEditor v-if="activeTab === 'models'" />
          <GeneralFieldsEditor v-else-if="activeTab === 'general'" />
          <EmailSettingsEditor v-else-if="activeTab === 'email'" />
          <SymptomSetEditor v-else />
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import ProductConfigEditor from '@/components/ProductConfigEditor.vue';
import SymptomSetEditor from '@/components/SymptomSetEditor.vue';
import GeneralFieldsEditor from '@/components/GeneralFieldsEditor.vue';
import EmailSettingsEditor from '@/components/EmailSettingsEditor.vue';
import { useProductStore } from '@/stores/productStore';

const activeTab = ref('models');
const store = useProductStore();
const categoryCount = computed(() => (store.categories || []).length);
const symptomSetCount = computed(() => Object.keys(store.symptomSets || {}).length);
</script>

<style scoped>
.config-editor-view {
  padding: 2rem;
}

.editor-layout { display: grid; grid-template-columns: 260px 1fr; gap: 1.5rem; }
.sidebar { background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 1rem; }
.sidebar h3 { margin-top: 0; font-size: 1.1rem; }
.menu { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.menu li { padding: 0.6rem 0.8rem; border-radius: 6px; cursor: pointer; }
.menu li:hover { background: #f5f5f5; }
.menu li.active { background: #eaf2ff; color: #0d6efd; font-weight: 600; }
.menu .badge { float: right; background: #0d6efd; color: #fff; padding: 0 0.5rem; border-radius: 999px; font-size: 0.75rem; }
.content { display: flex; flex-direction: column; gap: 1rem; }
.content-header { background: #fff; border: 1px solid #eee; border-radius: 8px; padding: 1rem; }
.content-body { min-height: 200px; }
</style> 