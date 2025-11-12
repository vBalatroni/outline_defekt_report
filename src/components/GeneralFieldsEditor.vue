<template>
  <div class="general-fields-editor">
    <div class="editor-header">
      <div class="header-title">
        <h2>General Fields</h2>
        <span v-if="hasUnsavedChanges" class="unsaved-indicator">● Unsaved changes</span>
      </div>
      <div class="header-actions">
        <button
          class="admin-btn admin-btn-primary"
          :disabled="isSaving || !hasUnsavedChanges"
          @click="saveToServer"
        >
          {{ isSaving ? 'Saving...' : 'Save to Server' }}
        </button>
        <button
          class="admin-btn admin-btn-muted"
          :disabled="isSaving"
          @click="reloadFromServer"
        >
          Reload from server
        </button>
      </div>
    </div>
    <div class="helper-banner">
      <p class="muted">
        Qui gestisci la scheda iniziale del form (anagrafica, indirizzi). Ogni sezione corrisponde a un blocco della pagina utente.
      </p>
    </div>

    <div class="sections">
      <div
        class="section-card"
        v-for="(fields, sectionKey) in sectionsView"
        :key="sectionKey"
      >
        <div class="section-header">
          <div>
            <h3>{{ sectionTitles[sectionKey] || sectionKey }}</h3>
            <small class="muted">{{ (fields || []).length }} campo{{ (fields || []).length === 1 ? '' : 'i' }}</small>
          </div>
          <button class="admin-btn admin-btn-primary" @click="openAddField(sectionKey)">Add Field</button>
        </div>
        <div class="field-list" v-if="(fields || []).length">
          <div class="field-row" v-for="(field, idx) in sorted(fields)" :key="field.id">
            <div class="field-main">
              <strong>{{ field.label }}</strong>
              <small class="muted">{{ field.id }}</small>
            </div>
            <div class="field-meta">
              <span class="badge">{{ field.type }}</span>
              <span class="badge" :class="{ req: field.isRequired }">{{ field.isRequired ? 'required' : 'optional' }}</span>
            </div>
            <div class="field-actions">
              <button class="admin-btn admin-btn-muted" @click="openEditField(sectionKey, field)">Edit</button>
              <button class="admin-btn admin-btn-danger" @click="removeField(sectionKey, field.id)">Delete</button>
            </div>
          </div>
        </div>
        <div v-else class="empty">No fields configured yet.</div>
      </div>
    </div>

    <div v-if="modal.visible" class="modal-overlay">
      <div class="modal-content">
        <h3 style="margin-top:0">{{ modal.editing ? 'Edit Field' : 'Add Field' }}</h3>
        <div class="form-group">
          <label>Section</label>
          <select v-model="modal.section">
            <option v-for="key in sectionKeys" :key="key" :value="key">{{ sectionTitles[key] || key }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Field ID</label>
          <input type="text" v-model="modal.field.id" :disabled="modal.editing" />
        </div>
        <div class="form-group">
          <label>Label</label>
          <input type="text" v-model="modal.field.label" />
        </div>
        <div class="form-group">
          <label>Type</label>
          <select v-model="modal.field.type">
            <option value="text">text</option>
            <option value="email">email</option>
            <option value="tel">tel</option>
            <option value="number">number</option>
            <option value="file">file</option>
          </select>
        </div>
        <div class="form-group checkbox-row">
          <input type="checkbox" v-model="modal.field.isRequired" />
          <label>Required</label>
        </div>
        <div class="form-group">
          <label>Order</label>
          <input type="number" v-model.number="modal.field.order" />
        </div>
        <div class="modal-actions">
          <button class="admin-btn admin-btn-muted" @click="closeModal">Cancel</button>
          <button class="admin-btn admin-btn-primary" @click="saveField">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted } from 'vue';
import { useProductStore } from '@/stores/productStore';

const store = useProductStore();
const sectionTitles = {
  companyData: 'Company Information',
  freightForwarderData: 'Freight Forwarder',
  companyAddress: 'Company Address',
  otherReturnAddress: 'Return Address',
};

const config = computed(() => store.productMapping?.generalFieldsConfig || { sections: {} });
const sections = computed(() => config.value.sections || {});
const defaultSectionKeys = ['companyData','freightForwarderData','companyAddress','otherReturnAddress'];
const sectionKeys = computed(() => Array.from(new Set([...(Object.keys(sections.value || {})), ...defaultSectionKeys])));
const sectionsView = computed(() => {
  const out = {};
  sectionKeys.value.forEach((k) => { out[k] = sections.value[k] || []; });
  return out;
});

const sorted = (fields) => [...(fields || [])].sort((a,b) => (a.order ?? 0) - (b.order ?? 0));

const modal = reactive({ visible: false, editing: false, section: '', field: { id: '', label: '', type: 'text', isRequired: false, order: 0 } });

const isSaving = ref(false);
const hasUnsavedChanges = ref(false);
const snapshotRef = ref('');

const openAddField = (sectionKey) => {
  modal.visible = true; modal.editing = false; modal.section = sectionKey;
  modal.field = { id: '', label: '', type: 'text', isRequired: false, order: (sections.value[sectionKey]?.length || 0) };
};
const openEditField = (sectionKey, field) => {
  modal.visible = true; modal.editing = true; modal.section = sectionKey;
  modal.field = JSON.parse(JSON.stringify(field));
};
const closeModal = () => { modal.visible = false; };

const removeField = (sectionKey, fieldId) => {
  const next = JSON.parse(JSON.stringify(config.value));
  next.sections[sectionKey] = (next.sections[sectionKey] || []).filter(f => f.id !== fieldId);
  store.updateGeneralFieldsConfig(next);
  store.applyGeneralFieldsConfigToForm();
};

const saveField = () => {
  if (!modal.field.id || !modal.field.label) return;
  const next = JSON.parse(JSON.stringify(config.value));
  next.sections = next.sections || {};
  next.sections[modal.section] = next.sections[modal.section] || [];
  const idx = next.sections[modal.section].findIndex(f => f.id === modal.field.id);
  if (idx >= 0) next.sections[modal.section][idx] = modal.field; else next.sections[modal.section].push(modal.field);
  store.updateGeneralFieldsConfig(next);
  store.applyGeneralFieldsConfigToForm();
  modal.visible = false;
};

const getConfigSignature = (mapping) => {
  const general = mapping?.generalFieldsConfig || { sections: {} };
  return JSON.stringify(general);
};

const currentSignature = computed(() => getConfigSignature(store.productMapping));

onMounted(() => {
  snapshotRef.value = currentSignature.value;
  hasUnsavedChanges.value = false;
});

watch(currentSignature, (sig) => {
  hasUnsavedChanges.value = sig !== snapshotRef.value;
});

const saveToServer = async () => {
  if (isSaving.value || !hasUnsavedChanges.value) return;
  isSaving.value = true;
  try {
    const mapping = JSON.parse(JSON.stringify(store.productMapping || {}));
    mapping.generalFieldsConfig = config.value;
    const resp = await fetch('/config/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapping, null, 2),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Server responded ${resp.status}: ${txt}`);
    }
    await store.loadConfiguration();
    store.applyGeneralFieldsConfigToForm();
    snapshotRef.value = currentSignature.value;
    hasUnsavedChanges.value = false;
  } catch (e) {
    console.error(e);
  } finally {
    isSaving.value = false;
  }
};

const reloadFromServer = async () => {
  if (isSaving.value) return;
  isSaving.value = true;
  try {
    await store.loadConfiguration();
    store.applyGeneralFieldsConfigToForm();
    snapshotRef.value = currentSignature.value;
    hasUnsavedChanges.value = false;
  } catch (e) {
    console.error(e);
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.general-fields-editor {
  padding: 1rem;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.header-title { display:flex; align-items:center; gap:0.5rem; }
.header-actions { display:flex; gap:0.5rem; flex-wrap:wrap; }
.unsaved-indicator { color:#f39c12; font-weight:600; font-size:0.85rem; }
.helper-banner {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.muted {
  color: #6c757d;
  font-size: 0.9rem;
}
.sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
}
.section-card {
  border:1px solid #eee;
  border-radius:8px;
  padding:1rem;
  background:#fafafa;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.section-header {
  display:flex;
  align-items:center;
  justify-content:space-between;
}
.field-list {
  display:flex;
  flex-direction:column;
  gap:0.5rem;
}
.field-row {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:0.5rem;
  padding:0.5rem;
  background:#fff;
  border:1px solid #eee;
  border-radius:6px;
}
.field-main {
  display:flex;
  flex-direction:column;
}
.field-meta {
  display:flex;
  gap:0.4rem;
  align-items:center;
}
.badge {
  background: #e8f1ff;
  color: #0d6efd;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
}
.badge.req {
  background: #ffe8e8;
  color: #dc3545;
}
.field-actions {
  display:flex;
  gap:0.4rem;
}
.empty {
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  padding: 1rem;
  text-align: center;
  color: #6c757d;
}
.modal-overlay {
  position: fixed;
  top:0;
  left:0;
  width:100%;
  height:100%;
  background: rgba(0,0,0,0.4);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index: 2000;
}
.modal-content {
  background:#fff;
  border-radius:8px;
  padding:1.5rem;
  width: 100%;
  max-width: 420px;
  display:flex;
  flex-direction:column;
  gap:0.75rem;
}
.form-group {
  display:flex;
  flex-direction:column;
  gap:0.35rem;
}
.form-group input,
.form-group select {
  padding:0.6rem;
  border:1px solid #ccc;
  border-radius:4px;
}
.checkbox-row {
  flex-direction:row;
  align-items:center;
  gap:0.5rem;
}
.modal-actions {
  display:flex;
  justify-content:flex-end;
  gap:0.5rem;
  margin-top:0.5rem;
}
</style>

