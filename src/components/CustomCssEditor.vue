<template>
  <div class="custom-css-editor">
    <div class="editor-header">
      <div class="header-title">
        <h2>Custom CSS</h2>
        <span v-if="hasUnsavedChanges" class="unsaved-indicator">● Unsaved changes</span>
        <span v-if="loadingIndicator" class="admin-reload-indicator">
          <span class="admin-spinner"></span>
          Reloading...
        </span>
      </div>
      <div class="header-actions">
        <button
          class="admin-btn admin-btn-muted"
          type="button"
          @click="resetToDefaults"
          :disabled="isSaving"
        >
          Reset to defaults
        </button>
        <button
          class="admin-btn admin-btn-muted"
          type="button"
          @click="reloadFromServer"
          :disabled="isReloading"
        >
          Reload from server
        </button>
        <button
          class="admin-btn admin-btn-primary"
          type="button"
          @click="saveCustomCss"
          :disabled="isSaving || !hasUnsavedChanges"
        >
          {{ isSaving ? 'Saving...' : 'Save to Server' }}
        </button>
      </div>
    </div>

    <div class="admin-toast-stack" aria-live="polite" aria-atomic="true">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="admin-toast"
        :class="`admin-toast-${t.type || 'info'}`"
      >
        <span class="admin-toast-message">{{ t.message }}</span>
        <button class="admin-toast-close" @click="removeToast(t.id)">×</button>
      </div>
    </div>

    <div class="editor-card">
      <div class="editor-info">
        <p class="muted">
          Inserisci il CSS personalizzato per stilare le sezioni del form multistep.
          Il CSS verrà applicato globalmente al form.
        </p>
        <p class="muted">
          <strong>Esempi di selettori utili:</strong>
        </p>
        <ul class="muted examples-list">
          <li><code>.confirmation-step</code> - Pagina di accettazione</li>
          <li><code>.general-data-step</code> - Step dati generali</li>
          <li><code>.products-step</code> - Step prodotti</li>
          <li><code>.summary-step</code> - Step riepilogo</li>
          <li><code>.step-title</code> - Titoli degli step</li>
          <li><code>.step-subtitle</code> - Sottotitoli</li>
          <li><code>.button-group</code> - Gruppo di pulsanti</li>
          <li><code>.button</code> - Pulsanti</li>
        </ul>
      </div>

      <div class="form-group">
        <label for="custom-css">CSS Custom</label>
        <textarea
          id="custom-css"
          v-model="cssContent"
          rows="20"
          placeholder="/* Inserisci il tuo CSS qui */&#10;&#10;.confirmation-step {&#10;  /* Stili personalizzati */&#10;}"
          class="css-editor"
          spellcheck="false"
        ></textarea>
        <small class="muted">Il CSS verrà applicato immediatamente dopo il salvataggio.</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, nextTick, onMounted } from 'vue';
import { useProductStore } from '@/stores/productStore';

const store = useProductStore();

const cssContent = ref('');
const isSaving = ref(false);
const isReloading = ref(false);
const hasUnsavedChanges = ref(false);
const isSyncing = ref(false);
const formSnapshot = ref('');

const toasts = ref([]);
const showToast = ({ message, type = 'info', duration = 4000 }) => {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  toasts.value.push({ id, message, type });
  if (duration) {
    setTimeout(() => removeToast(id), duration);
  }
};
const removeToast = (id) => {
  toasts.value = toasts.value.filter((t) => t.id !== id);
};

const loadingIndicator = computed(() => isReloading.value || store.isLoading);
const currentCustomCss = computed(() => store.productMapping?.customCss || '');

const serializeForm = () => {
  return cssContent.value.trim();
};

const resetDirty = () => {
  formSnapshot.value = serializeForm();
  hasUnsavedChanges.value = false;
};

const applyCssToForm = (source, { resetSnapshot = true } = {}) => {
  isSyncing.value = true;
  cssContent.value = source || '';
  nextTick(() => {
    if (resetSnapshot) {
      resetDirty();
    } else {
      hasUnsavedChanges.value = serializeForm() !== formSnapshot.value;
    }
    isSyncing.value = false;
  });
};

watch(currentCustomCss, (val) => {
  applyCssToForm(val || '', { resetSnapshot: true });
}, { immediate: true });

watch(
  () => cssContent.value,
  () => {
    if (isSyncing.value) return;
    hasUnsavedChanges.value = serializeForm() !== formSnapshot.value;
  }
);

const resetToDefaults = () => {
  applyCssToForm('', { resetSnapshot: false });
};

const saveCustomCss = async () => {
  if (isSaving.value || !hasUnsavedChanges.value) return;
  isSaving.value = true;
  try {
    const mapping = JSON.parse(JSON.stringify(store.productMapping || {}));
    mapping.customCss = cssContent.value.trim();

    const response = await fetch('/config/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapping, null, 2),
    });

    if (!response.ok) {
      const payload = await response.text();
      throw new Error(payload || `Server responded with ${response.status}`);
    }

    await store.loadConfiguration();
    showToast({ message: 'Custom CSS updated successfully.', type: 'success' });
    resetDirty();
  } catch (error) {
    console.error(error);
    showToast({ message: error.message || 'Failed to save custom CSS.', type: 'danger', duration: 6000 });
  } finally {
    isSaving.value = false;
  }
};

const reloadFromServer = async () => {
  if (isReloading.value) return;
  isReloading.value = true;
  try {
    await store.loadConfiguration();
    applyCssToForm(currentCustomCss.value || '');
    showToast({ message: 'Custom CSS reloaded.', type: 'info' });
  } catch (error) {
    console.error(error);
    showToast({ message: error.message || 'Failed to reload custom CSS.', type: 'danger', duration: 6000 });
  } finally {
    isReloading.value = false;
  }
};
</script>

<style scoped>
.custom-css-editor {
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
.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.unsaved-indicator {
  color: #f39c12;
  font-weight: 600;
  font-size: 0.85rem;
}

.editor-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.editor-info {
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 6px;
  border-left: 4px solid #0d6efd;
}

.muted {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

.examples-list {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.examples-list li {
  margin: 0.25rem 0;
}

.examples-list code {
  background-color: #f3f4f6;
  padding: 0.15rem 0.35rem;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.85em;
  color: #1f2937;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-weight: 600;
  color: #1f2937;
}

.css-editor {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: 'Courier New', 'Monaco', 'Consolas', monospace;
  background-color: #1f2937;
  color: #e5e7eb;
  resize: vertical;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  line-height: 1.6;
  tab-size: 2;
}

.css-editor:focus {
  outline: none;
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.15rem rgba(13, 110, 253, 0.15);
}

.css-editor::placeholder {
  color: #9ca3af;
}
</style>

