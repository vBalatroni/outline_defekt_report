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
          <li :class="{ active: activeTab === 'intro' }" @click="activeTab = 'intro'">
            <span>Intro Content</span>
          </li>
          <li :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">
            <span>General Settings</span>
          </li>
          <li :class="{ active: activeTab === 'symptoms' }" @click="activeTab = 'symptoms'">
            <span>Symptom Sets</span>
            <span class="badge" v-if="symptomSetCount > 0">{{ symptomSetCount }}</span>
          </li>
          <li :class="{ active: activeTab === 'guide' }" @click="activeTab = 'guide'">
            <span>Guide & Tips</span>
          </li>
        </ul>
      </aside>
      <main class="content">
        <header class="content-header">
          <h2>
            {{
              activeTab === 'models'
                ? 'Models & Fields'
                : activeTab === 'general'
                ? 'General Fields'
                : activeTab === 'intro'
                ? 'Intro Content'
                : activeTab === 'settings'
                ? 'General Settings'
                : activeTab === 'symptoms'
                ? 'Symptom Sets'
                : 'Guide'
            }}
          </h2>
        </header>
        <section class="content-body">
          <ProductConfigEditor v-if="activeTab === 'models'" />
          <GeneralFieldsEditor v-else-if="activeTab === 'general'" />
          <IntroContentEditor v-else-if="activeTab === 'intro'" />
          <GeneralSettingsEditor v-else-if="activeTab === 'settings'" />
          <SymptomSetEditor v-else-if="activeTab === 'symptoms'" />
          <ConfigGuide v-else />
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ProductConfigEditor from '@/components/ProductConfigEditor.vue';
import SymptomSetEditor from '@/components/SymptomSetEditor.vue';
import GeneralFieldsEditor from '@/components/GeneralFieldsEditor.vue';
import GeneralSettingsEditor from '@/components/GeneralSettingsEditor.vue';
import IntroContentEditor from '@/components/IntroContentEditor.vue';
import ConfigGuide from '@/components/ConfigGuide.vue';
import { useProductStore } from '@/stores/productStore';

const route = useRoute();
const router = useRouter();
const validTabs = ['models', 'general', 'intro', 'settings', 'symptoms', 'guide'];
const normalizeTab = (tab) => {
  if (tab === 'email') return 'settings';
  return tab;
};
const initialQuery = typeof route.query.tab === 'string' ? normalizeTab(route.query.tab) : undefined;
const initialTab = initialQuery && validTabs.includes(initialQuery) ? initialQuery : 'models';
const activeTab = ref(initialTab);
const store = useProductStore();
const categoryCount = computed(() => (store.categories || []).length);
const symptomSetCount = computed(() => Object.keys(store.symptomSets || {}).length);

watch(() => route.query.tab, (tab) => {
  if (typeof tab !== 'string') return;
  const normalized = normalizeTab(tab);
  if (tab !== normalized) {
    router.replace({ name: 'config-editor', query: { ...route.query, tab: normalized } });
    return;
  }
  if (validTabs.includes(normalized) && normalized !== activeTab.value) {
    activeTab.value = normalized;
  }
});

watch(activeTab, (tab) => {
  const current = typeof route.query.tab === 'string' ? normalizeTab(route.query.tab) : undefined;
  if (current === tab) return;
  router.replace({ name: 'config-editor', query: { ...route.query, tab } });
});
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