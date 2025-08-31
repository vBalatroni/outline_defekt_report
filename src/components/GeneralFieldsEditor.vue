<template>
  <div class="general-fields-editor">
    <div class="editor-header">
      <h2>General Fields Editor</h2>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="initFromCurrent" :disabled="isSaving">Init from current</button>
        <button class="btn btn-primary" @click="saveToServer" :disabled="isSaving">{{ isSaving ? 'Saving...' : 'Save to Server' }}</button>
        <button class="btn btn-secondary" @click="reloadFromServer" :disabled="isSaving">Reload from server</button>
      </div>
    </div>

    <div class="sections">
      <div class="section-card" v-for="(fields, sectionKey) in sectionsView" :key="sectionKey">
        <div class="section-header">
          <h3>{{ sectionTitles[sectionKey] || sectionKey }}</h3>
          <button class="btn btn-sm btn-primary" @click="openAddField(sectionKey)">Add Field</button>
        </div>
        <div class="field-list" v-if="(fields || []).length">
          <div class="field-row" v-for="(field, idx) in sorted(fields)" :key="field.id">
            <div class="field-main">
              <strong>{{ field.label }}</strong>
              <small class="muted">{{ field.id }}</small>
            </div>
            <div class="field-meta">
              <span class="tag">{{ field.type }}</span>
              <span class="tag" :class="{ req: field.isRequired }">{{ field.isRequired ? 'required' : 'optional' }}</span>
              <span class="tag">order: {{ field.order ?? idx }}</span>
            </div>
            <div class="field-actions">
              <button class="btn btn-sm btn-secondary" @click="openEditField(sectionKey, field)">Edit</button>
              <button class="btn btn-sm btn-danger" @click="removeField(sectionKey, field.id)">Delete</button>
            </div>
          </div>
        </div>
        <div v-else class="empty">No fields</div>
      </div>
    </div>

    <!-- Modal Add/Edit -->
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
            <option value="range">range</option>
            <option value="file">file</option>
          </select>
        </div>
        <div class="form-group">
          <label>Required</label>
          <input type="checkbox" v-model="modal.field.isRequired" />
        </div>
        <div class="form-group">
          <label>Order</label>
          <input type="number" v-model.number="modal.field.order" />
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeModal">Cancel</button>
          <button class="btn btn-primary" @click="saveField">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { useProductStore } from '@/stores/productStore';

const store = useProductStore();
const isSaving = ref(false);
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
  // apply to live form so the frontend renders them immediately
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

const saveToServer = async () => {
  if (isSaving.value) return;
  isSaving.value = true;
  try {
    const mapping = JSON.parse(JSON.stringify(store.productMapping));
    // Ensure generalFieldsConfig gets persisted
    mapping.generalFieldsConfig = config.value;
    const response = await fetch('http://localhost:4000/config/import', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mapping, null, 2)
    });
    const txt = await response.text();
    if (!response.ok) throw new Error(`Server responded ${response.status}: ${txt}`);
    await reloadFromServer();
  } catch (e) { console.error(e); }
  finally { isSaving.value = false; }
};

const reloadFromServer = async () => {
  await store.loadConfiguration();
  // ensure the live form reflects the just reloaded config
  store.applyGeneralFieldsConfigToForm();
};

const initFromCurrent = () => {
  const general = JSON.parse(JSON.stringify(store.formState?.generalData || {}));
  const next = { sections: {} };
  Object.keys(general).forEach((sectionKey) => {
    const section = general[sectionKey];
    const fields = [];
    let i = 0;
    Object.keys(section || {}).forEach((fieldKey) => {
      const f = section[fieldKey];
      fields.push({
        id: f.id || fieldKey,
        label: f.label || fieldKey,
        type: f.type || 'text',
        isRequired: !!f.isRequired,
        order: typeof f.order === 'number' ? f.order : i,
      });
      i += 1;
    });
    next.sections[sectionKey] = fields;
  });
  store.updateGeneralFieldsConfig(next);
  store.applyGeneralFieldsConfigToForm();
};
</script>

<style scoped>
.general-fields-editor { padding: 1rem; background: #fff; border-radius: 8px; border: 1px solid #eee; }
.editor-header { display:flex; align-items:center; justify-content:space-between; margin-bottom: 1rem; }
.header-actions { display:flex; gap:0.5rem; }
.sections { display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; }
.section-card { border:1px solid #eee; border-radius:8px; padding:1rem; background:#fafafa; }
.section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.5rem; }
.field-list { display:flex; flex-direction:column; gap:0.5rem; }
.field-row { display:flex; align-items:center; justify-content:space-between; gap:0.5rem; padding:0.5rem; background:#fff; border:1px solid #eee; border-radius:6px; }
.field-main { display:flex; flex-direction:column; }
.field-meta { display:flex; gap:0.4rem; align-items:center; }
.tag { background:#eef3ff; border:1px solid #dce6ff; color:#2a4d9b; border-radius:999px; padding:0.1rem 0.4rem; font-size:0.75rem; }
.tag.req { background:#ffecea; border-color:#ffd1ca; color:#9b2a2a; }
.empty { color:#777; font-style:italic; }
.modal-overlay { position:fixed; inset:0; background: rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; }
.modal-content { background:#fff; padding:1rem 1.5rem; border-radius:8px; width: 90%; max-width: 520px; display:flex; flex-direction:column; gap:0.75rem; }
.form-group { display:flex; flex-direction:column; gap:0.25rem; }
.btn { padding: 0.5rem 1rem; border:none; border-radius:4px; cursor:pointer; }
.btn-primary { background:#0d6efd; color:#fff; }
.btn-secondary { background:#6c757d; color:#fff; }
.btn-danger { background:#dc3545; color:#fff; }
.btn-sm { padding: 0.25rem 0.5rem; font-size: 0.85rem; }
</style>

