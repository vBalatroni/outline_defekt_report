<template>
  <div class="product-config-editor">
    <div class="editor-header">
      <h2>Product Model Field Editor</h2>
      <button @click="exportConfiguration" class="btn btn-success">Export Configuration to JSON</button>
    </div>
    <p>Select a category and a model to configure its specific form fields.</p>

    <div class="selection-controls">
      <div class="control-group">
        <label for="category-select">Category</label>
        <select id="category-select" v-model="selectedCategory" @change="onCategoryChange">
          <option disabled value="">Please select a category</option>
          <option v-for="category in categories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </div>

      <div class="control-group">
        <label for="model-select">Model</label>
        <select id="model-select" v-model="selectedModel" :disabled="!selectedCategory">
          <option disabled value="">Please select a model</option>
          <option v-for="model in availableModels" :key="model" :value="model">
            {{ model }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="selectedModel" class="field-editor">
      <div class="field-editor-header">
        <h3>Editing Fields for: <strong>{{ selectedModel }}</strong></h3>
        <button @click="openAddFieldModal" class="btn btn-primary">Add Field</button>
      </div>
      
      <div v-if="modelFields.length > 0" class="field-list">
        <div v-for="(field, index) in modelFields" :key="index" class="field-card">
          <div class="field-details">
            <span><strong>ID:</strong> {{ field.id }}</span>
            <span><strong>Label:</strong> {{ field.label }}</span>
            <span><strong>Type:</strong> {{ field.type }}</span>
          </div>
          <div v-if="field.type === 'select' && field.options" class="field-options">
            <strong>Options:</strong> {{ field.options.join(', ') }}
          </div>
          <div class="field-actions">
              <button @click="openEditFieldModal(index)" class="btn btn-sm btn-secondary">Edit</button>
              <button @click="deleteField(index)" class="btn btn-sm btn-danger">Delete</button>
          </div>
        </div>
      </div>
      <div v-else class="field-list-placeholder">
        <p>No fields configured for this model. Click "Add Field" to begin.</p>
      </div>
    </div>

    <!-- Add/Edit Field Modal -->
    <div v-if="showFieldModal" class="modal-overlay">
        <div class="modal-content">
            <h3>{{ isEditing ? 'Edit Field' : 'Add New Field' }}</h3>
            <div class="form-group">
                <label>Field ID</label>
                <input type="text" v-model="activeField.id" placeholder="e.g., serialNumber">
            </div>
            <div class="form-group">
                <label>Field Label</label>
                <input type="text" v-model="activeField.label" placeholder="e.g., Serial Number">
            </div>
            <div class="form-group">
                <label>Field Type</label>
                <select v-model="activeField.type">
                    <option value="text">Text</option>
                    <option value="select">Select</option>
                </select>
            </div>
            <div v-if="activeField.type === 'select'" class="form-group">
                <div class="checkbox-group">
                    <input type="checkbox" v-model="activeField.isSymptomArea" id="isSymptomArea" />
                    <label for="isSymptomArea">This is a Symptom Area selector</label>
                </div>
            </div>
            <div v-if="activeField.isSymptomArea" class="form-group symptom-sets-selection">
                <label>Available Symptom Sets for this Area</label>
                <div v-for="set in availableSymptomSets" :key="set.value" class="checkbox-group">
                    <input type="checkbox" :id="`set-${set.value}`" :value="set.value" v-model="activeField.options" />
                    <label :for="`set-${set.value}`">{{ set.label }} ({{ set.value }})</label>
                </div>
            </div>
            <div v-if="activeField.type === 'select' && !activeField.isSymptomArea" class="form-group">
                <label>Options (one per line)</label>
                <textarea v-model="activeField.options" placeholder="Option 1&#10;Option 2" rows="4"></textarea>
            </div>

            <!-- Dependencies Section -->
            <div v-if="isEditing && activeField.type === 'select' && !activeField.isSymptomArea" class="dependencies-section">
                <h4>Dependencies</h4>
                <div class="form-group">
                    <label>Depends on which field?</label>
                    <select v-model="activeField.dependsOn">
                        <option :value="null">None</option>
                        <option v-for="field in availableParentFields" :key="field.id" :value="field.id">
                            {{ field.label }} ({{ field.id }})
                        </option>
                    </select>
                </div>
                <div v-if="activeField.dependsOn" class="value-mapping">
                    <h5>Option Mapping</h5>
                    <p>For each parent option, define the source of the child options.</p>
                    <div v-for="parentOption in parentFieldOptions" :key="parentOption" class="mapping-row">
                        <span class="parent-option-label">{{ parentOption }}</span>
                        <div class="mapping-controls">
                            <select v-model="activeField.valueMapping[parentOption].type" class="mapping-type-select">
                                <option value="static">Manual Options</option>
                                <option value="symptomSet">From Symptom Set</option>
                            </select>

                            <template v-if="activeField.valueMapping[parentOption] && activeField.valueMapping[parentOption].type === 'static'">
                                <textarea 
                                    v-model="activeField.valueMapping[parentOption].value"
                                    placeholder="Child options (one per line)"
                                    rows="3"
                                ></textarea>
                            </template>
                            <template v-if="activeField.valueMapping[parentOption] && activeField.valueMapping[parentOption].type === 'symptomSet'">
                                <select v-model="activeField.valueMapping[parentOption].value">
                                    <option disabled value="">Select a symptom set</option>
                                    <option v-for="set in availableSymptomSets" :key="set.value" :value="set.value">
                                        {{ set.label }} ({{ set.value }})
                                    </option>
                                </select>
                            </template>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-actions">
                <button @click="showFieldModal = false" class="btn btn-secondary">Cancel</button>
                <button @click="saveField" class="btn btn-primary">{{ isEditing ? 'Save Changes' : 'Add Field' }}</button>
            </div>
        </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue';
import { useProductStore } from '@/stores/productStore';

const productStore = useProductStore();

const selectedCategory = ref('');
const selectedModel = ref('');
const modelFieldConfigs = reactive({});

// Modal state
const showFieldModal = ref(false);
const isEditing = ref(false);
const editingFieldIndex = ref(null);
const activeField = reactive({
  id: '',
  label: '',
  type: 'text',
  options: '',
  dependsOn: null,
  valueMapping: {},
  isSymptomArea: false
});

const generateId = (str) => {
  if (!str) return '';
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, '');
};

watch(() => activeField.label, (newLabel, oldLabel) => {
    const oldId = activeField.id;
    const generatedIdForOldLabel = generateId(oldLabel || '');

    if (!isEditing.value || oldId === '' || oldId === generatedIdForOldLabel) {
        activeField.id = generateId(newLabel);
    }
});

watch(() => activeField.isSymptomArea, (isSymptomArea) => {
    if (isSymptomArea) {
        activeField.options = [];
    } else {
        activeField.options = '';
    }
});

const categories = computed(() => productStore.categories || []);
const availableModels = computed(() => {
  if (selectedCategory.value) {
    return productStore.getModelsForCategory(selectedCategory.value) || [];
  }
  return [];
});

const modelFields = computed(() => {
    return modelFieldConfigs[selectedModel.value] || [];
});

const availableParentFields = computed(() => {
    if (!selectedModel.value || !isEditing.value) return [];
    return modelFields.value.filter(field => field.id !== activeField.id && field.type === 'select');
});

const parentFieldOptions = computed(() => {
    if (!activeField.dependsOn) return [];
    const parentField = modelFields.value.find(field => field.id === activeField.dependsOn);
    return parentField ? parentField.options || [] : [];
});

watch(() => parentFieldOptions.value, (newOptions) => {
    const newMapping = {};
    newOptions.forEach(opt => {
        newMapping[opt] = activeField.valueMapping[opt] || { type: 'static', value: '' };
    });
    activeField.valueMapping = newMapping;
}, { deep: true });

const onCategoryChange = () => {
  selectedModel.value = '';
};

const openAddFieldModal = () => {
    isEditing.value = false;
    editingFieldIndex.value = null;
    activeField.id = '';
    activeField.label = '';
    activeField.type = 'text';
    activeField.options = '';
    activeField.dependsOn = null;
    activeField.valueMapping = {};
    activeField.isSymptomArea = false;
    showFieldModal.value = true;
};

const openEditFieldModal = (index) => {
    isEditing.value = true;
    editingFieldIndex.value = index;
    const fieldToEdit = modelFields.value[index];
    
    activeField.id = fieldToEdit.id;
    activeField.label = fieldToEdit.label;
    activeField.type = fieldToEdit.type;
    activeField.isSymptomArea = fieldToEdit.isSymptomArea || false;
    activeField.dependsOn = fieldToEdit.dependsOn || null;
    activeField.valueMapping = fieldToEdit.valueMapping || {};

    if (activeField.isSymptomArea) {
        activeField.options = Array.isArray(fieldToEdit.options) ? [...fieldToEdit.options] : [];
    } else {
        const valueMappingForEdit = {};
        if (fieldToEdit.valueMapping) {
            Object.keys(fieldToEdit.valueMapping).forEach(key => {
                const mapping = fieldToEdit.valueMapping[key];
                if (mapping.type === 'static') {
                    valueMappingForEdit[key] = { type: 'static', value: mapping.options.join('\n') };
                } else {
                    valueMappingForEdit[key] = { type: 'symptomSet', value: mapping.key };
                }
            });
        }
        activeField.valueMapping = valueMappingForEdit;
        activeField.options = Array.isArray(fieldToEdit.options) ? fieldToEdit.options.join('\n') : '';
    }

    showFieldModal.value = true;
};

const saveField = () => {
    if (!activeField.id || !activeField.label) {
        alert('Field ID and Label are required.');
        return;
    }

    if (!modelFieldConfigs[selectedModel.value]) {
        modelFieldConfigs[selectedModel.value] = [];
    }
    
    const fieldData = {
        id: activeField.id,
        label: activeField.label,
        type: activeField.type,
    };

    if (activeField.type === 'select') {
        fieldData.isSymptomArea = activeField.isSymptomArea;
        if (activeField.isSymptomArea) {
            fieldData.options = activeField.options;
        } else {
            fieldData.options = activeField.options.split('\n').map(opt => opt.trim()).filter(Boolean);
        }
        if (activeField.dependsOn) {
            fieldData.dependsOn = activeField.dependsOn;
            const finalValueMapping = {};
            Object.keys(activeField.valueMapping).forEach(key => {
                const mapping = activeField.valueMapping[key];
                if (mapping.type === 'static') {
                    finalValueMapping[key] = {
                        type: 'static',
                        options: mapping.value.split('\n').map(opt => opt.trim()).filter(Boolean)
                    };
                } else {
                    finalValueMapping[key] = {
                        type: 'symptomSet',
                        key: mapping.value
                    };
                }
            });
            fieldData.valueMapping = finalValueMapping;
        } else {
            delete fieldData.dependsOn;
            delete fieldData.valueMapping;
        }
    }

    if (isEditing.value) {
        modelFieldConfigs[selectedModel.value][editingFieldIndex.value] = fieldData;
    } else {
        modelFieldConfigs[selectedModel.value].push(fieldData);
    }

    if (fieldData.isSymptomArea) {
        const foundFieldIndex = modelFieldConfigs[selectedModel.value].findIndex(f => f.id === 'symptomFound');
        if (foundFieldIndex === -1) {
            modelFieldConfigs[selectedModel.value].push({
                id: 'symptomFound',
                label: 'Symptom Found',
                type: 'select',
                dependsOn: fieldData.id,
            });
        } else {
            modelFieldConfigs[selectedModel.value][foundFieldIndex].dependsOn = fieldData.id;
        }
    }
    
    showFieldModal.value = false;
};

const deleteField = (index) => {
    if (confirm('Are you sure you want to delete this field?')) {
        const fieldToDelete = modelFieldConfigs[selectedModel.value][index];
        
        modelFieldConfigs[selectedModel.value].splice(index, 1);

        if (fieldToDelete.isSymptomArea) {
            const foundFieldIndex = modelFieldConfigs[selectedModel.value].findIndex(f => f.id === 'symptomFound' && f.dependsOn === fieldToDelete.id);
            if (foundFieldIndex !== -1) {
                modelFieldConfigs[selectedModel.value].splice(foundFieldIndex, 1);
            }
        }
    }
};

const exportConfiguration = () => {
    // Ensure we start with the most complete version of the mapping from the store
    const currentMapping = productStore.productMapping || defaultProductMapping;
    
    const updatedProductMapping = {
        ...currentMapping,
        modelFieldConfigs: modelFieldConfigs
    };

    productStore.updateProductMapping(updatedProductMapping);

    const jsonString = JSON.stringify(updatedProductMapping, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'productData.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const availableSymptomSets = computed(() => productStore.symptomSetOptions);

onMounted(() => {
  productStore.loadConfiguration().then(() => {
    if (productStore.productMapping?.modelFieldConfigs) {
      Object.assign(modelFieldConfigs, productStore.productMapping.modelFieldConfigs);
    }
  });
});
</script>

<style scoped>
.product-config-editor {
  padding: 2rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  position: relative;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.selection-controls {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #eee;
}

.control-group {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.control-group label {
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #333;
}

.control-group select {
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 1rem;
}

.control-group select:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}

.field-editor {
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #eee;
}

.field-editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.field-editor h3 {
  margin-top: 0;
  margin-bottom: 0;
}

.field-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.field-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background-color: #f9f9f9;
    border-radius: 4px;
    border: 1px solid #eee;
    position: relative;
}

.field-details {
  display: flex;
  gap: 1.5rem;
}

.field-options {
  font-size: 0.9em;
  color: #555;
  padding-top: 0.5rem;
  border-top: 1px solid #eee;
  margin-top: 0.5rem;
}

.field-actions {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: flex;
    gap: 0.5rem;
}

.btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.875em;
}

.btn-danger {
    background-color: #dc3545;
    color: white;
}

.field-list-placeholder {
  text-align: center;
  padding: 2rem;
  border: 2px dashed #ddd;
  border-radius: 4px;
  color: #777;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal-content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
}

.form-group input,
.form-group select {
    width: 100%;
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #ccc;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
}

.btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.btn-primary {
    background-color: #007bff;
    color: white;
}

.btn-secondary {
    background-color: #6c757d;
    color: white;
}

.btn-success {
    background-color: #28a745;
    color: white;
}

.dependencies-section {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #eee;
}

.value-mapping {
    margin-top: 1rem;
    padding-left: 1rem;
    border-left: 2px solid #eee;
}

.mapping-row {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 1rem;
    align-items: center;
    margin-bottom: 0.5rem;
}

.parent-option-label {
    font-weight: bold;
}

.form-group textarea {
    width: 100%;
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #ccc;
    font-family: inherit;
    font-size: 1rem;
    min-height: 60px;
}

.mapping-controls {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.mapping-type-select {
    align-self: flex-start;
    margin-bottom: 0.5rem;
}

.checkbox-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.symptom-sets-selection {
    border: 1px solid #eee;
    padding: 1rem;
    border-radius: 4px;
    max-height: 200px;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 0.5rem;
}
</style>
