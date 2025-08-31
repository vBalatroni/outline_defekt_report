<template>
  <div class="email-settings-editor">
    <div class="editor-header">
      <h2>Email Settings</h2>
      <div class="header-actions">
        <button class="btn btn-primary" :disabled="isSaving" @click="saveToServer">{{ isSaving ? 'Saving...' : 'Save to Server' }}</button>
        <button class="btn btn-secondary" :disabled="isSaving" @click="reloadFromServer">Reload from server</button>
      </div>
    </div>
    <div class="card">
      <div class="form-group">
        <label>Supplier recipient</label>
        <input type="email" v-model="emailConfig.supplierRecipient" placeholder="e.g., support@supplier.com" />
      </div>
      <div class="form-group">
        <label>Testing recipient (override both for testing)</label>
        <input type="email" v-model="emailConfig.testingRecipient" placeholder="e.g., you@company.com" />
      </div>
      <div class="form-group">
        <label>Download HTML reports locally</label>
        <input type="checkbox" v-model="emailConfig.downloadHtmlReports" />
      </div>
      <small class="muted">Nota: se testingRecipient è valorizzato, verrà usato come fallback per cliente e fornitore.</small>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useProductStore } from '@/stores/productStore';

const store = useProductStore();
const isSaving = ref(false);
const emailConfig = computed({
  get: () => ({ ...(store.productMapping?.emailConfig || {}) }),
  set: (val) => {
    const mapping = JSON.parse(JSON.stringify(store.productMapping || {}));
    mapping.emailConfig = val;
    store.updateProductMapping(mapping);
  }
});

const saveToServer = async () => {
  if (isSaving.value) return; isSaving.value = true;
  try {
    const payload = {
      supplierRecipient: emailConfig.value.supplierRecipient || null,
      testingRecipient: emailConfig.value.testingRecipient || null,
      downloadHtmlReports: emailConfig.value.downloadHtmlReports !== false,
    };
    const resp = await fetch('http://localhost:4000/config/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const txt = await resp.text(); if (!resp.ok) throw new Error(`${resp.status}: ${txt}`);
    await reloadFromServer();
  } catch (e) { console.error(e); }
  finally { isSaving.value = false; }
};

const reloadFromServer = async () => {
  await store.loadConfiguration();
};
</script>

<style scoped>
.email-settings-editor { padding: 1rem; background:#fff; border:1px solid #eee; border-radius:8px; }
.editor-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem; }
.card { border:1px solid #eee; border-radius:8px; padding:1rem; display:flex; flex-direction:column; gap:0.75rem; }
.form-group { display:flex; flex-direction:column; gap:0.25rem; }
.muted { color:#777; }
.btn { padding:0.5rem 1rem; border:none; border-radius:4px; cursor:pointer; }
.btn-primary { background:#0d6efd; color:#fff; }
.btn-secondary { background:#6c757d; color:#fff; }
</style>

