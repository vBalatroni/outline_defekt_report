<template>
  <div class="symptom-set-editor">
  <div class="editor-header">
      <div class="header-title">
        <h2>Symptom Set Editor</h2>
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
          :disabled="isSaving || isReloading"
          @click="reloadFromServer"
        >
          {{ isReloading ? 'Reloading...' : 'Reload from Server' }}
        </button>
        <button @click="openAddModal" class="admin-btn admin-btn-outline">Add New Set</button>
      </div>
    </div>
    <p>Manage the shared lists of symptoms that can be used across different product models.</p>

    <div class="set-list">
      <div v-for="(set, key) in symptomSets" :key="key" class="set-card">
        <div class="set-details">
          <span><strong>Key:</strong> {{ key }}</span>
          <span><strong>Label:</strong> {{ set.label }}</span>
        </div>
        <div class="set-actions">
            <button @click="openEditModal(key)" class="admin-btn admin-btn-muted">Edit</button>
            <button @click="deleteSet(key)" class="admin-btn admin-btn-danger">Delete</button>
        </div>
      </div>
    </div>

    <!-- Toasts -->
    <div class="toast-container" aria-live="polite" aria-atomic="true">
      <div v-for="t in toasts" :key="t.id" class="toast-item" :class="`toast-${t.type}`">
        <span class="toast-message">{{ t.message }}</span>
        <button class="btn btn-sm btn-link toast-close" @click="removeToast(t.id)">×</button>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-overlay">
        <div class="modal-content">
            <h3>{{ isEditing ? 'Edit Symptom Set' : 'Add New Symptom Set' }}</h3>
            <div class="form-group">
                <label>Set Key</label>
                <input type="text" v-model="activeSet.key" placeholder="e.g., audio_issues" :disabled="isEditing">
            </div>
            <div class="form-group">
                <label>Set Label</label>
                <input type="text" v-model="activeSet.label" placeholder="e.g., Audio Issues">
            </div>
            <div class="form-group">
                <label>Symptoms (one per line)</label>
                <textarea v-model="activeSet.symptoms" placeholder="Symptom 1&#10;Symptom 2" rows="8"></textarea>
            </div>

            <div class="modal-actions">
                <button @click="showModal = false" class="admin-btn admin-btn-muted">Cancel</button>
                <button @click="saveSet" class="admin-btn admin-btn-primary">{{ isEditing ? 'Save Changes' : 'Add Set' }}</button>
            </div>
        </div>
    </div>

    <!-- Confirm Dialog -->
    <div v-if="confirmDialog.visible" class="modal-overlay">
      <div class="modal-content">
        <h3 style="margin-top:0">{{ confirmDialog.title || 'Please confirm' }}</h3>
        <p>{{ confirmDialog.message }}</p>
        <div class="modal-actions">
          <button class="admin-btn admin-btn-muted" @click="closeConfirmDialog">{{ confirmDialog.cancelText || 'Cancel' }}</button>
          <button class="admin-btn admin-btn-primary" @click="confirmDialogConfirm">{{ confirmDialog.confirmText || 'Confirm' }}</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue';
import { useProductStore } from '@/stores/productStore';

const productStore = useProductStore();

const symptomSets = computed(() => productStore.symptomSets);

const showModal = ref(false);
const isEditing = ref(false);
const activeSet = reactive({
  key: '',
  label: '',
  symptoms: ''
});
const originalKey = ref('');

// Toasts
const toasts = ref([]);
const showToast = ({ message, type = 'info', duration = 3000 }) => {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  toasts.value.push({ id, message, type });
  if (duration) setTimeout(() => removeToast(id), duration);
};
const removeToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id);
};

// Confirm dialog
const confirmDialog = reactive({ visible: false, title: '', message: '', confirmText: '', cancelText: '', onConfirm: null });
const askConfirmation = ({ title = 'Please confirm', message = '', confirmText = 'Confirm', cancelText = 'Cancel', onConfirm = null }) => {
  confirmDialog.title = title;
  confirmDialog.message = message;
  confirmDialog.confirmText = confirmText;
  confirmDialog.cancelText = cancelText;
  confirmDialog.onConfirm = onConfirm;
  confirmDialog.visible = true;
};
const closeConfirmDialog = () => { confirmDialog.visible = false; };
const confirmDialogConfirm = async () => {
  const fn = confirmDialog.onConfirm;
  confirmDialog.visible = false;
  if (typeof fn === 'function') await fn();
};

const isSaving = ref(false);
const isReloading = ref(false);
const hasUnsavedChanges = ref(false);
const snapshotRef = ref('');

const serializeSymptomSets = (sets) => {
  const result = {};
  const entries = Object.entries(sets || {}).sort(([a], [b]) => a.localeCompare(b));
  entries.forEach(([key, value]) => {
    const symptoms = Array.isArray(value?.symptoms) ? [...value.symptoms] : Array.isArray(value?.options) ? [...value.options] : [];
    result[key] = {
      label: value?.label || key,
      symptoms,
    };
  });
  return JSON.stringify(result);
};

const syncSnapshot = () => {
  snapshotRef.value = serializeSymptomSets(symptomSets.value);
  hasUnsavedChanges.value = false;
};

onMounted(() => {
  syncSnapshot();
});

watch(symptomSets, (val) => {
  const current = serializeSymptomSets(val);
  hasUnsavedChanges.value = current !== snapshotRef.value;
}, { deep: true });

const saveToServer = async () => {
  if (isSaving.value || !hasUnsavedChanges.value) return;
  isSaving.value = true;
  try {
    const mapping = JSON.parse(JSON.stringify(productStore.productMapping || {}));
    mapping.symptomSets = JSON.parse(serializeSymptomSets(symptomSets.value));
    const resp = await fetch('/config/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapping, null, 2),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Server responded ${resp.status}: ${txt}`);
    }
    await productStore.loadConfiguration();
    syncSnapshot();
    showToast({ message: 'Symptom sets saved to server.', type: 'success', duration: 4000 });
  } catch (e) {
    console.error(e);
    showToast({ message: `Failed to save: ${e.message || e}`, type: 'danger', duration: 5000 });
  } finally {
    isSaving.value = false;
  }
};

const reloadFromServer = async () => {
  if (isReloading.value) return;
  isReloading.value = true;
  try {
    await productStore.loadConfiguration();
    syncSnapshot();
    showToast({ message: 'Symptom sets reloaded from server.', type: 'success', duration: 3500 });
  } catch (e) {
    console.error(e);
    showToast({ message: `Failed to reload: ${e.message || e}`, type: 'danger', duration: 5000 });
  } finally {
    isReloading.value = false;
  }
};

const openAddModal = () => {
    isEditing.value = false;
    activeSet.key = '';
    activeSet.label = '';
    activeSet.symptoms = '';
    originalKey.value = '';
    showModal.value = true;
};

const openEditModal = (key) => {
    isEditing.value = true;
    const setToEdit = symptomSets.value[key];
    activeSet.key = key;
    activeSet.label = setToEdit.label;
    activeSet.symptoms = (setToEdit.symptoms || setToEdit.options || []).join('\n');
    originalKey.value = key;
    showModal.value = true;
};

const saveSet = () => {
    if (!activeSet.key || !activeSet.label) {
        showToast({ message: 'Set Key and Label are required.', type: 'danger' });
        return;
    }

    const setData = {
        label: activeSet.label,
        symptoms: activeSet.symptoms.split('\n').map(s => s.trim()).filter(Boolean)
    };

    let success;
    if (isEditing.value) {
        success = productStore.updateSymptomSet(originalKey.value, activeSet.key, setData);
        if (!success) {
            showToast({ message: 'A set with this key already exists.', type: 'danger' });
            return;
        }
        showToast({ message: 'Symptom set updated.', type: 'success' });
    } else {
        success = productStore.addSymptomSet(activeSet.key, setData);
        if (!success) {
            showToast({ message: 'A set with this key already exists.', type: 'danger' });
            return;
        }
        showToast({ message: 'Symptom set added.', type: 'success' });
    }
    showModal.value = false;
};

const deleteSet = (key) => {
    askConfirmation({
      title: 'Delete symptom set',
      message: `Are you sure you want to delete the symptom set "${key}"?`,
      confirmText: 'Delete',
      onConfirm: () => {
        productStore.deleteSymptomSet(key);
        showToast({ message: 'Symptom set deleted.', type: 'success' });
      }
    });
};

</script>

<style scoped>
.symptom-set-editor {
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background-color: #f9f9f9;
}
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
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
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
.set-list {
  display: grid;
  gap: 1rem;
}
.set-card {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.set-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.set-actions {
  display: flex;
  gap: 0.5rem;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}
.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
.form-group input, .form-group textarea {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
}
/* inherits admin-btn styles from global custom.css */

/* Toasts */
.toast-container {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 1100;
}
.toast-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fff;
  border: 1px solid #ddd;
  border-left-width: 4px;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.toast-info { border-left-color: #0d6efd; }
.toast-success { border-left-color: #28a745; }
.toast-danger { border-left-color: #dc3545; }
.toast-message { flex: 1; }
.toast-close { font-size: 1.1rem; line-height: 1; }
</style> 