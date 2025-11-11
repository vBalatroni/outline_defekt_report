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
    <div class="card">
      <h3 class="card-title">Serial Number Validation</h3>
      <div class="form-group checkbox-group">
        <label class="checkbox-inline">
          <input type="checkbox" v-model="serialValidationEnabled" />
          Enforce encrypted serial format before continuing
        </label>
      </div>
      <small class="muted">
        Quando attivo, il campo "Serial Number" accetta solo matricole codificate con la mappa BARTILOMEU (settimana, giorno, anno e contatore).
      </small>
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

const serialValidationEnabled = computed({
  get: () => Boolean(store.productMapping?.validationConfig?.serial?.enabled),
  set: (val) => {
    const mapping = JSON.parse(JSON.stringify(store.productMapping || {}));
    mapping.validationConfig = mapping.validationConfig || {};
    mapping.validationConfig.serial = mapping.validationConfig.serial || {};
    mapping.validationConfig.serial.enabled = !!val;
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
      serialValidationEnabled: Boolean(serialValidationEnabled.value),
    };
    const resp = await fetch('/config/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
.card { border:1px solid #eee; border-radius:8px; padding:1rem; display:flex; flex-direction:column; gap:0.75rem; margin-bottom:1rem; }
.card-title { margin:0 0 0.5rem 0; font-size:1.1rem; }
.form-group { display:flex; flex-direction:column; gap:0.25rem; }
.checkbox-group { flex-direction:row; align-items:center; gap:0.5rem; }
.checkbox-inline { display:flex; align-items:center; gap:0.5rem; font-weight:500; }
.muted { color:#777; }
.btn { padding:0.5rem 1rem; border:none; border-radius:4px; cursor:pointer; }
.btn-primary { background:#0d6efd; color:#fff; }
.btn-secondary { background:#6c757d; color:#fff; }
</style>

