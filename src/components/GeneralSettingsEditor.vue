<template>
  <div class="general-settings-editor">
    <div class="editor-header">
      <div class="header-title">
        <h2>General Settings</h2>
        <span v-if="hasUnsavedChanges" class="unsaved-indicator">● Unsaved changes</span>
      </div>
      <div class="header-actions">
        <button
          class="btn btn-primary"
          :disabled="isSaving || !hasUnsavedChanges"
          @click="saveToServer"
        >
          {{ isSaving ? 'Saving...' : 'Save to Server' }}
        </button>
        <button
          class="btn btn-secondary"
          :disabled="isReloading"
          @click="reloadFromServer"
        >
          {{ isReloading ? 'Reloading...' : 'Reload from Server' }}
        </button>
      </div>
    </div>

    <div class="card">
      <h3>Email Recipients</h3>
      <p class="muted">
        Configura gli indirizzi predefiniti per il recap interno e per i test.
      </p>
      <div class="form-grid">
        <label>Supplier recipient</label>
        <input
          type="email"
          :value="emailSupplier"
          placeholder="e.g., support@supplier.com"
          @input="onEmailChange('supplierRecipient', $event.target.value)"
        />
        <label>Testing recipient (override for testing)</label>
        <input
          type="email"
          :value="emailTesting"
          placeholder="e.g., you@company.com"
          @input="onEmailChange('testingRecipient', $event.target.value)"
        />
        <label class="checkbox-inline">
          <input
            type="checkbox"
            :checked="downloadHtmlReports"
            @change="onEmailChange('downloadHtmlReports', $event.target.checked)"
          />
          Download HTML reports locally (debug)
        </label>
      </div>
    </div>

    <div class="card">
      <h3>Serial Number Validation</h3>
      <p class="muted">
        Gestisci il controllo basato sulla codifica BARTILOMEU.
      </p>
      <label class="checkbox-inline">
        <input type="checkbox" v-model="serialValidationEnabled" />
        Enforce encrypted serial format before continuing
      </label>
      <label class="checkbox-inline">
        <input
          type="checkbox"
          v-model="serialDebugToggle"
          :disabled="!serialValidationEnabled"
        />
        Mostra debug numero seriale
      </label>
      <small class="muted">
        Quando attivo, il form mostra un riepilogo dettagliato di settimana, giorno, anno e contatore.
      </small>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue';
import { useProductStore } from '@/stores/productStore';

const store = useProductStore();
const isSaving = ref(false);
const isReloading = ref(false);
const hasUnsavedChanges = ref(false);
const snapshotRef = ref('');

const updateMapping = (mutator) => {
  const mapping = JSON.parse(JSON.stringify(store.productMapping || {}));
  mutator(mapping);
  store.updateProductMapping(mapping);
};

const emailSupplier = computed(() => store.productMapping?.emailConfig?.supplierRecipient || '');
const emailTesting = computed(() => store.productMapping?.emailConfig?.testingRecipient || '');
const downloadHtmlReports = computed(
  () => store.productMapping?.emailConfig?.downloadHtmlReports !== false,
);

const onEmailChange = (field, rawValue) => {
  updateMapping((mapping) => {
    const cfg = { ...(mapping.emailConfig || {}) };
    if (cfg.supplierRecipient === undefined) cfg.supplierRecipient = '';
    if (cfg.testingRecipient === undefined) cfg.testingRecipient = '';
    if (cfg.downloadHtmlReports === undefined) cfg.downloadHtmlReports = true;
    if (field === 'supplierRecipient') {
      cfg.supplierRecipient = rawValue;
    } else if (field === 'testingRecipient') {
      cfg.testingRecipient = rawValue;
    } else if (field === 'downloadHtmlReports') {
      cfg.downloadHtmlReports = Boolean(rawValue);
    }
    mapping.emailConfig = cfg;
  });
};

const serialValidationEnabled = computed({
  get: () => Boolean(store.productMapping?.validationConfig?.serial?.enabled),
  set: (val) => {
    updateMapping((mapping) => {
      mapping.validationConfig = mapping.validationConfig || {};
      mapping.validationConfig.serial = mapping.validationConfig.serial || {};
      mapping.validationConfig.serial.enabled = !!val;
      if (!val) {
        mapping.validationConfig.serial.debugEnabled = false;
      }
    });
  },
});

const serialDebugToggle = computed({
  get: () => Boolean(store.productMapping?.validationConfig?.serial?.debugEnabled),
  set: (val) => {
    updateMapping((mapping) => {
      mapping.validationConfig = mapping.validationConfig || {};
      mapping.validationConfig.serial = mapping.validationConfig.serial || {};
      mapping.validationConfig.serial.debugEnabled = !!val;
    });
  },
});

const getSettingsSignature = (mapping) => {
  const emailCfg = mapping?.emailConfig || {};
  const serialCfg = mapping?.validationConfig?.serial || {};
  return JSON.stringify({
    email: {
      supplierRecipient: emailCfg.supplierRecipient || '',
      testingRecipient: emailCfg.testingRecipient || '',
      downloadHtmlReports: emailCfg.downloadHtmlReports !== false,
    },
    serial: {
      enabled: !!serialCfg.enabled,
      debugEnabled: !!serialCfg.debugEnabled,
    },
  });
};

const currentSignature = computed(() => getSettingsSignature(store.productMapping));

onMounted(() => {
  snapshotRef.value = currentSignature.value;
  hasUnsavedChanges.value = false;
});

watch(currentSignature, (sig) => {
  hasUnsavedChanges.value = sig !== snapshotRef.value;
});

const sanitizeEmail = (value) => {
  const trimmed = String(value || '').trim();
  return trimmed.length ? trimmed : null;
};

const saveToServer = async () => {
  if (isSaving.value || !hasUnsavedChanges.value) return;
  isSaving.value = true;
  try {
    const mapping = JSON.parse(JSON.stringify(store.productMapping || {}));
    const emailCfg = mapping.emailConfig || {};
    mapping.emailConfig = {
      supplierRecipient: sanitizeEmail(emailCfg.supplierRecipient),
      testingRecipient: sanitizeEmail(emailCfg.testingRecipient),
      downloadHtmlReports: emailCfg.downloadHtmlReports !== false,
    };
    const serialCfg = store.productMapping?.validationConfig?.serial || {};
    mapping.validationConfig = mapping.validationConfig || {};
    mapping.validationConfig.serial = {
      enabled: Boolean(serialCfg.enabled),
      debugEnabled: Boolean(serialCfg.debugEnabled),
    };

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
    snapshotRef.value = currentSignature.value;
    hasUnsavedChanges.value = false;
  } catch (e) {
    console.error(e);
  } finally {
    isSaving.value = false;
  }
};

const reloadFromServer = async () => {
  if (isReloading.value) return;
  isReloading.value = true;
  try {
    await store.loadConfiguration();
    snapshotRef.value = currentSignature.value;
    hasUnsavedChanges.value = false;
  } catch (e) {
    console.error(e);
  } finally {
    isReloading.value = false;
  }
};
</script>

<style scoped>
.general-settings-editor {
  padding: 1rem;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.unsaved-indicator {
  color: #f39c12;
  font-weight: 600;
  font-size: 0.85rem;
}
.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.form-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}
input[type='email'] {
  padding: 0.6rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.95rem;
}
.checkbox-inline {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 500;
}
.muted {
  color: #6c757d;
  font-size: 0.85rem;
}
.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
}
.btn-primary {
  background: #0d6efd;
  color: #fff;
}
.btn-secondary {
  background: #6c757d;
  color: #fff;
}
</style>
