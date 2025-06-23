<template>
  <div class="symptom-set-editor">
    <div class="editor-header">
      <h2>Symptom Set Editor</h2>
      <button @click="openAddModal" class="btn btn-primary">Add New Set</button>
    </div>
    <p>Manage the shared lists of symptoms that can be used across different product models.</p>

    <div class="set-list">
      <div v-for="(set, key) in symptomSets" :key="key" class="set-card">
        <div class="set-details">
          <span><strong>Key:</strong> {{ key }}</span>
          <span><strong>Label:</strong> {{ set.label }}</span>
        </div>
        <div class="set-actions">
            <button @click="openEditModal(key)" class="btn btn-sm btn-secondary">Edit</button>
            <button @click="deleteSet(key)" class="btn btn-sm btn-danger">Delete</button>
        </div>
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
                <button @click="showModal = false" class="btn btn-secondary">Cancel</button>
                <button @click="saveSet" class="btn btn-primary">{{ isEditing ? 'Save Changes' : 'Add Set' }}</button>
            </div>
        </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
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
    activeSet.symptoms = setToEdit.symptoms.join('\n');
    originalKey.value = key;
    showModal.value = true;
};

const saveSet = () => {
    if (!activeSet.key || !activeSet.label) {
        alert('Set Key and Label are required.');
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
            alert('A set with this key already exists.');
            return;
        }
    } else {
        success = productStore.addSymptomSet(activeSet.key, setData);
        if (!success) {
            alert('A set with this key already exists.');
            return;
        }
    }
    
    showModal.value = false;
};

const deleteSet = (key) => {
    if (confirm(`Are you sure you want to delete the symptom set "${key}"?`)) {
        productStore.deleteSymptomSet(key);
    }
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
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
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
.btn {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-size: 1rem;
}
.btn-primary { background-color: #007bff; color: white; }
.btn-secondary { background-color: #6c757d; color: white; }
.btn-danger { background-color: #dc3545; color: white; }
.btn-sm { padding: 0.25rem 0.5rem; font-size: 0.875rem; }
</style> 