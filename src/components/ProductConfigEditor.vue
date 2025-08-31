<template>
  <div class="product-config-editor">
    <div class="editor-header">
      <h2>Product Model Field Editor</h2>
      <div class="header-actions">
        <div v-if="hasUnsavedChanges" class="unsaved-indicator" title="There are unsaved changes">● Unsaved changes</div>
        <button @click="saveConfigurationToServer" class="btn btn-primary" :disabled="isSaving || !hasUnsavedChanges">
            {{ isSaving ? 'Saving...' : 'Save to Server' }}
        </button>
        <button @click="importDefaultIntoDb" class="btn btn-warning" :disabled="isSaving">
            {{ isSaving ? 'Importing...' : 'Import default (from file)' }}
        </button>
        <button @click="reloadFromServer" class="btn btn-secondary" :disabled="isSaving">
            Reload from server
        </button>
        <button @click="exportConfiguration" class="btn btn-success">Export Configuration to JSON</button>
      </div>
    </div>
    
    <!-- Toasts -->
    <div class="toast-container" aria-live="polite" aria-atomic="true">
      <div v-for="t in toasts" :key="t.id" class="toast-item" :class="`toast-${t.type}`">
        <span class="toast-message">{{ t.message }}</span>
        <button v-if="t.actionText" class="btn btn-sm btn-link toast-action" @click="handleToastAction(t.id)">{{ t.actionText }}</button>
        <button class="btn btn-sm btn-link toast-close" @click="removeToast(t.id)">×</button>
      </div>
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

      <div class="control-group" v-if="selectedCategory">
        <label for="model-search">Search Model</label>
        <input id="model-search" type="text" v-model="searchQuery" placeholder="Filter models by name..." class="form-control">
      </div>
    </div>

    <div v-if="selectedCategory" class="model-list-container">
        <div class="model-list-header">
            <h3>Available Models</h3>
            <button @click="addModel" class="btn btn-primary">Add New Model</button>
        </div>
        <div v-if="availableModels.length > 0" class="model-list">
            <div v-for="model in filteredModels" :key="model" class="model-card" @click="openModelEditor(model)">
                <div class="model-card-content">
                    <div class="model-card-title">
                        <span class="model-icon">📦</span>
                        <h4>{{ model }}</h4>
                        <span class="badge">{{ getFieldCount(model) }}</span>
                    </div>
                    <div class="model-preview" v-if="getPreviewFieldLabels(model).length">
                        <span class="chip" v-for="label in getPreviewFieldLabels(model)" :key="label">{{ label }}</span>
                        <span v-if="getFieldCount(model) > 3" class="more-chip">+{{ getFieldCount(model) - 3 }}</span>
                    </div>
                </div>
                <div class="model-card-actions">
                    <button @click.stop="duplicateModel(model)" class="btn btn-sm btn-secondary">Duplicate</button>
                    <button @click.stop="deleteModel(model)" class="btn btn-sm btn-danger">Delete</button>
                </div>
            </div>
            <div v-if="filteredModels.length === 0" class="field-list-placeholder">
                <p>No models match your search.</p>
            </div>
        </div>
        <div v-else class="field-list-placeholder">
            <p>No models available for this category. Click "Add New Model" to begin.</p>
        </div>
    </div>

    <!-- Model Field Editor Modal -->
    <div v-if="showModelEditorModal" class="modal-overlay model-editor-modal">
        <div class="modal-content">
            <div class="model-editor-layout">
                <!-- Left Pane: Field List -->
                <div class="field-list-pane">
                    <div class="field-editor-header">
                        <h3>Fields for: <strong>{{ selectedModel }}</strong></h3>
                        <button @click="openAddFieldModal" class="btn btn-primary">Add Field</button>
                    </div>
                    <div v-if="modelFields.length > 0" class="field-list">
                        <div 
                            v-for="(field, index) in sortedModelFields" 
                            :key="index" 
                            class="field-card" 
                            :class="{ 'is-active': showFieldModal && editingFieldIndex === index, 'drag-over': dragOverIndex === index, 'is-dragging': dragIndex === index }"
                            draggable="true"
                            @dragstart="onDragStart(index)"
                            @dragenter.prevent="onDragEnter(index)"
                            @dragover.prevent="onDragOver($event, index)"
                            @drop.prevent="onDrop(index)"
                            @dragend="onDragEnd"
                        >
                            <div class="field-details">
                                <span><strong>ID:</strong> {{ field.id }}</span>
                                <span><strong>Label:</strong> {{ field.label }}</span>
                                <span><strong>Type:</strong> {{ field.type }}</span>
                            </div>
                            <div v-if="field.type === 'select' && field.options && field.options.length" class="field-options">
                                <strong>Options:</strong> {{ Array.isArray(field.options) ? field.options.join(', ') : field.options }}
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

                <!-- Right Pane: Add/Edit Form -->
                <div class="field-editor-pane">
                    <div v-if="showFieldModal" class="field-editor-form">
                        <h3>{{ isEditing ? 'Edit Field' : 'Add New Field' }}</h3>
                        <div v-if="isEditing" class="field-summary">
                            <div class="summary-item"><strong>ID:</strong> {{ activeField.id }}</div>
                            <div class="summary-item"><strong>Type:</strong> {{ activeField.type }}</div>
                            <div class="summary-item"><strong>Section:</strong> {{ activeField.section || '-' }}</div>
                            <div class="summary-item"><strong>Order:</strong> {{ activeField.order }}</div>
                        </div>
                        <div class="field-editor-grid">
                            <!-- Column 1: General Settings -->
                            <div class="editor-column">
                                <div class="form-section">
                                    <h4>General</h4>
                                    <div class="form-group">
                                        <label>Field ID</label>
                                        <input type="text" v-model="activeField.id" placeholder="e.g., serialNumber">
                                    </div>
                                    <div class="form-group">
                                        <label>Field Label</label>
                                        <input type="text" v-model="activeField.label" placeholder="e.g., Serial Number">
                                    </div>
                                    <div class="form-group">
                                        <label>Field Section</label>
                                        <select v-model="activeField.section" required>
                                            <option disabled value="">Assign to a section</option>
                                            <option v-for="sectionName in defectSections" :key="sectionName" :value="sectionName">
                                                {{ sectionName }}
                                            </option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>Field Type</label>
                                        <select v-model="activeField.type">
                                            <option value="text">Text</option>
                                            <option value="select">Select</option>
                                            <option value="file">File</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>Order</label>
                                        <input type="number" v-model.number="activeField.order">
                                    </div>
                                     <div class="form-group checkbox-group compact-checkbox">
                                        <input type="checkbox" v-model="activeField.required" id="isRequired" />
                                        <label for="isRequired">Field is required</label>
                                    </div>
                                </div>
                            </div>

                            <!-- Column 2: Options & Dependencies -->
                            <div class="editor-column">
                                <template v-if="activeField.type === 'select'">
                                    <div class="form-section">
                                        <h4>Options & Dependencies</h4>
                                        <div class="form-group checkbox-group">
                                            <input type="checkbox" v-model="activeField.isSymptomArea" id="isSymptomArea" />
                                            <label for="isSymptomArea">This is a Symptom Area selector</label>
                                        </div>
                                        <div v-if="activeField.isSymptomArea" class="form-group">
                                            <label>Available Symptom Sets</label>
                                            <div class="symptom-sets-selection">
                                                <div v-for="set in availableSymptomSets" :key="set.value" class="checkbox-group">
                                                    <input type="checkbox" :id="`set-${set.value}`" :value="set.value" v-model="activeField.options" />
                                                    <label :for="`set-${set.value}`">{{ set.label }} ({{ set.value }})</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="!activeField.isSymptomArea" class="form-group">
                                            <label>Options (one per line)</label>
                                            <textarea v-model="activeField.options" placeholder="Option 1&#10;Option 2" rows="4"></textarea>
                                        </div>
                                        <div v-if="isEditing && !activeField.isSymptomArea" class="dependencies-section">
                                            <h5>Dependencies</h5>
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
                                                <h6>Option Mapping</h6>
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
                                    </div>
                                </template>
                            </div>
                        </div>

                        <!-- Conditions Section -->
                        <div class="conditions-section">
                            <h4>Display Conditions</h4>
                            <p>Show this field only if the following conditions are met. Leave empty to always show.</p>
                            <div v-for="(condition, index) in activeField.conditions" :key="index" class="condition-row">
                                <select v-model="condition.field" class="condition-control">
                                    <option disabled value="">Select Field</option>
                                    <optgroup label="Primary">
                                        <option value="productCategory">Product Category</option>
                                        <option value="productModel">Product Model</option>
                                    </optgroup>
                                    <optgroup label="Dynamic Fields">
                                        <option v-for="field in availableConditionFields" :key="field.id" :value="field.id">
                                            {{ field.label }} ({{ field.id }})
                                        </option>
                                    </optgroup>
                                </select>
                                <select v-model="condition.operator" class="condition-control">
                                    <option value="equals">equals</option>
                                    <option value="not_equals">not equals</option>
                                    <option value="contains">contains</option>
                                    <option value="exists">exists</option>
                                </select>
                                <input type="text" v-model="condition.value" placeholder="Value" class="condition-control">
                                <button @click="removeCondition(index)" class="btn btn-sm btn-danger">Remove</button>
                            </div>
                            <button @click="addCondition" class="btn btn-sm btn-secondary">Add Condition</button>
                        </div>

                        <div class="modal-actions">
                            <button @click="showFieldModal = false" class="btn btn-secondary">Cancel</button>
                            <button @click="saveField" class="btn btn-primary">{{ isEditing ? 'Save Changes' : 'Add Field' }}</button>
                        </div>
                    </div>
                     <div v-else class="field-editor-placeholder">
                        <p>Select a field to edit, or add a new one.</p>
                    </div>
                </div>
            </div>
            <div class="modal-actions main-modal-actions">
                <button @click="closeModelEditor" class="btn btn-secondary">Close Editor</button>
            </div>
        </div>
    </div>

    <!-- Confirm Dialog -->
    <div v-if="confirmDialog.visible" class="modal-overlay">
      <div class="modal-content">
        <h3 style="margin-top:0">{{ confirmDialog.title || 'Please confirm' }}</h3>
        <p>{{ confirmDialog.message }}</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeConfirmDialog">{{ confirmDialog.cancelText || 'Cancel' }}</button>
          <button class="btn btn-primary" @click="confirmDialogConfirm">{{ confirmDialog.confirmText || 'Confirm' }}</button>
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

const searchQuery = ref('');
const showModelEditorModal = ref(false);
const isSaving = ref(false);
const hasUnsavedChanges = ref(false);

// Toast system
const toasts = ref([]);
const showToast = ({ message, type = 'info', duration = 3000, actionText = null, onAction = null }) => {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  toasts.value.push({ id, message, type, actionText, onAction });
  if (duration) {
    setTimeout(() => removeToast(id), duration);
  }
};
const removeToast = (id) => {
  toasts.value = toasts.value.filter(t => t.id !== id);
};
const handleToastAction = (id) => {
  const t = toasts.value.find(x => x.id === id);
  if (t && typeof t.onAction === 'function') {
    t.onAction();
  }
  removeToast(id);
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
const closeConfirmDialog = () => {
  confirmDialog.visible = false;
};
const confirmDialogConfirm = async () => {
  const fn = confirmDialog.onConfirm;
  confirmDialog.visible = false;
  if (typeof fn === 'function') await fn();
};

// Dirty helpers
const markDirty = () => { hasUnsavedChanges.value = true; };
const resetDirty = () => { hasUnsavedChanges.value = false; };

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
  isSymptomArea: false,
  required: false,
  order: 0,
  conditions: [],
  section: ''
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

const filteredModels = computed(() => {
    if (!searchQuery.value) {
        return availableModels.value;
    }
    return availableModels.value.filter(model => 
        model.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

const getFieldCount = (model) => {
    return (productStore.productMapping?.modelFieldConfigs?.[model] || []).length;
};
const getPreviewFieldLabels = (model) => {
    const fields = (productStore.productMapping?.modelFieldConfigs?.[model] || []);
    return fields.slice(0, 3).map(f => f.label || f.id);
};

const modelFields = computed(() => {
    return productStore.productMapping?.modelFieldConfigs?.[selectedModel.value] || [];
});
const sortedModelFields = computed(() => {
    return [...modelFields.value].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
});

// Drag & Drop state and handlers
const dragIndex = ref(null);
const dragOverIndex = ref(null);
const onDragStart = (index) => {
    dragIndex.value = index;
};
const onDragEnter = (index) => {
    dragOverIndex.value = index;
};
const onDragOver = (e, index) => {
    e.dataTransfer.dropEffect = 'move';
    dragOverIndex.value = index;
};
const onDrop = (dropIndex) => {
    if (dragIndex.value === null || dropIndex === null || dragIndex.value === dropIndex) {
        onDragEnd();
        return;
    }
    const current = JSON.parse(JSON.stringify(productStore.productMapping.modelFieldConfigs));
    const list = current[selectedModel.value] || [];
    // reorder based on sorted indexes mapping back to original ids
    const sorted = [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const draggedItem = sorted[dragIndex.value];
    sorted.splice(dragIndex.value, 1);
    sorted.splice(dropIndex, 0, draggedItem);
    // reassign order sequentially
    sorted.forEach((item, i) => { item.order = i; });
    // write back maintaining same ids
    current[selectedModel.value] = sorted;
    productStore.updateModelFieldConfigs(current);
    markDirty();
    onDragEnd();
};
const onDragEnd = () => {
    dragIndex.value = null;
    dragOverIndex.value = null;
};

const availableParentFields = computed(() => {
    if (!selectedModel.value || !isEditing.value) return [];
    return modelFields.value.filter(field => field.id !== activeField.id && field.type === 'select');
});

const availableConditionFields = computed(() => {
    if (!selectedModel.value) return [];
    const selfId = isEditing.value ? activeField.id : null;
    return modelFields.value.filter(field => field.id !== selfId);
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
  searchQuery.value = '';
};

const openModelEditor = (model) => {
    selectedModel.value = model;
    showModelEditorModal.value = true;
};

const closeModelEditor = () => {
    showModelEditorModal.value = false;
    showFieldModal.value = false;
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
    activeField.required = false;
    activeField.order = modelFields.value.length;
    activeField.conditions = [];
    activeField.section = '';
    showFieldModal.value = true;
};

const openEditFieldModal = (index) => {
    isEditing.value = true;
    editingFieldIndex.value = index;
    const fieldToEdit = JSON.parse(JSON.stringify(modelFields.value[index])); // Deep copy

    activeField.id = fieldToEdit.id;
    activeField.label = fieldToEdit.label;
    activeField.type = fieldToEdit.type;
    activeField.isSymptomArea = fieldToEdit.isSymptomArea || false;
    activeField.dependsOn = fieldToEdit.dependsOn || null;
    activeField.required = fieldToEdit.required || false;
    activeField.order = fieldToEdit.order === undefined ? index : fieldToEdit.order;
    activeField.conditions = fieldToEdit.conditions || [];
    activeField.section = fieldToEdit.section || '';

    if (activeField.isSymptomArea) {
        activeField.options = Array.isArray(fieldToEdit.options) ? fieldToEdit.options : [];
    } else {
        const valueMappingForEdit = {};
        if (fieldToEdit.valueMapping) {
            const parentField = modelFields.value.find(f => f.id === fieldToEdit.dependsOn);
            const parentOptions = parentField ? parentField.options || [] : Object.keys(fieldToEdit.valueMapping);
            
            parentOptions.forEach(key => {
                const mapping = fieldToEdit.valueMapping[key];
                if (mapping) {
                    if (mapping.type === 'static') {
                        valueMappingForEdit[key] = { type: 'static', value: mapping.options.join('\\n') };
                    } else {
                        valueMappingForEdit[key] = { type: 'symptomSet', value: mapping.key };
                    }
                } else {
                     valueMappingForEdit[key] = { type: 'static', value: '' };
                }
            });
        }
        activeField.valueMapping = valueMappingForEdit;
        activeField.options = Array.isArray(fieldToEdit.options) ? fieldToEdit.options.join('\\n') : '';
    }

    showFieldModal.value = true;
};

const saveField = () => {
    if (!activeField.id || !activeField.label) {
        showToast({ message: 'Field ID and Label are required.', type: 'danger' });
        return;
    }

    const newFieldConfigs = JSON.parse(JSON.stringify(productStore.productMapping.modelFieldConfigs));
    if (!newFieldConfigs[selectedModel.value]) {
        newFieldConfigs[selectedModel.value] = [];
    }
    
    const fieldData = {
        id: activeField.id,
        label: activeField.label,
        type: activeField.type,
        required: activeField.required,
        order: typeof activeField.order === 'string' ? parseInt(activeField.order, 10) : activeField.order,
        conditions: activeField.conditions.filter(c => c.field && c.operator),
        section: activeField.section
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
        newFieldConfigs[selectedModel.value][editingFieldIndex.value] = fieldData;
    } else {
        newFieldConfigs[selectedModel.value].push(fieldData);
    }

    if (fieldData.isSymptomArea) {
        const foundFieldIndex = newFieldConfigs[selectedModel.value].findIndex(f => f.id === 'symptomFound');
        if (foundFieldIndex === -1) {
            newFieldConfigs[selectedModel.value].push({
                id: 'symptomFound',
                label: 'Symptom Found',
                type: 'select',
                dependsOn: fieldData.id,
            });
        } else {
            newFieldConfigs[selectedModel.value][foundFieldIndex].dependsOn = fieldData.id;
        }
    }
    
    productStore.updateModelFieldConfigs(newFieldConfigs);
    markDirty();
    showFieldModal.value = false;
    showToast({ message: isEditing.value ? 'Field updated.' : 'Field added.', type: 'success' });
};

const deleteField = (index) => {
    askConfirmation({
        title: 'Delete field',
        message: 'Are you sure you want to delete this field?',
        confirmText: 'Delete',
        onConfirm: () => {
            const newFieldConfigs = JSON.parse(JSON.stringify(productStore.productMapping.modelFieldConfigs));
            const fieldToDelete = newFieldConfigs[selectedModel.value][index];
            newFieldConfigs[selectedModel.value].splice(index, 1);
            if (fieldToDelete && fieldToDelete.isSymptomArea) {
                const foundFieldIndex = newFieldConfigs[selectedModel.value].findIndex(f => f.id === 'symptomFound' && f.dependsOn === fieldToDelete.id);
                if (foundFieldIndex !== -1) {
                    newFieldConfigs[selectedModel.value].splice(foundFieldIndex, 1);
                }
            }
            productStore.updateModelFieldConfigs(newFieldConfigs);
            markDirty();
            showToast({ message: 'Field deleted.', type: 'success' });
        }
    });
};

const exportConfiguration = () => {
    // Ensure we start with the most complete version of the mapping from the store
    const currentMapping = productStore.productMapping;
    const updatedProductMapping = {
        ...currentMapping,
        modelFieldConfigs: productStore.productMapping.modelFieldConfigs
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
const defectSections = computed(() => productStore.defectSections);

const addCondition = () => {
    activeField.conditions.push({ field: '', operator: 'equals', value: '' });
};

const removeCondition = (index) => {
    activeField.conditions.splice(index, 1);
};

const addModel = () => {
    const newModelName = prompt('Enter the name for the new model:');
    if (!newModelName) return;

    if (newModelName.trim() === '' || availableModels.value.includes(newModelName)) {
        alert('The model name cannot be empty or already exist in this category.');
        return;
    }

    const currentMapping = JSON.parse(JSON.stringify(productStore.productMapping));

    if (currentMapping.categoryModels[selectedCategory.value]) {
        currentMapping.categoryModels[selectedCategory.value].push(newModelName);
    } else {
        currentMapping.categoryModels[selectedCategory.value] = [newModelName];
    }

    currentMapping.modelFieldConfigs[newModelName] = [];

    productStore.updateProductMapping(currentMapping);
    markDirty();
    showToast({ message: `Model "${newModelName}" added.`, type: 'success' });
};

const lastDeletedModel = ref(null);
const deleteModel = (modelToDelete) => {
    askConfirmation({
        title: 'Delete model',
        message: `Are you sure you want to delete the model "${modelToDelete}"? This action cannot be undone.`,
        confirmText: 'Delete',
        onConfirm: () => {
            const currentMapping = JSON.parse(JSON.stringify(productStore.productMapping));
            const modelsInCategory = currentMapping.categoryModels[selectedCategory.value];
            let removedIndex = -1;
            if (modelsInCategory) {
                const idx = modelsInCategory.indexOf(modelToDelete);
                if (idx > -1) {
                    removedIndex = idx;
                    modelsInCategory.splice(idx, 1);
                }
            }
            const fieldsBackup = currentMapping.modelFieldConfigs[modelToDelete] || [];
            delete currentMapping.modelFieldConfigs[modelToDelete];
            productStore.updateProductMapping(currentMapping);
            lastDeletedModel.value = {
                category: selectedCategory.value,
                name: modelToDelete,
                index: removedIndex,
                fields: fieldsBackup,
            };
            markDirty();
            showToast({
                message: `Model "${modelToDelete}" deleted.`,
                type: 'success',
                actionText: 'Undo',
                onAction: () => {
                    if (!lastDeletedModel.value) return;
                    const backup = JSON.parse(JSON.stringify(lastDeletedModel.value));
                    const mapping = JSON.parse(JSON.stringify(productStore.productMapping));
                    if (!mapping.categoryModels[backup.category]) mapping.categoryModels[backup.category] = [];
                    if (backup.index >= 0) {
                        mapping.categoryModels[backup.category].splice(backup.index, 0, backup.name);
                    } else {
                        mapping.categoryModels[backup.category].push(backup.name);
                    }
                    mapping.modelFieldConfigs[backup.name] = backup.fields;
                    productStore.updateProductMapping(mapping);
                    showToast({ message: `Model "${backup.name}" restored.`, type: 'info' });
                }
            });
        }
    });
};

const duplicateModel = (modelToDuplicate) => {
    const newModelName = prompt(`Enter a new name for the duplicated model (copy of ${modelToDuplicate}):`, `${modelToDuplicate}_copy`);

    if (!newModelName) {
        return; // User cancelled
    }
    
    if (newModelName.trim() === '' || availableModels.value.includes(newModelName)) {
        alert('The new model name cannot be empty or already exist in this category.');
        return;
    }

    const currentMapping = JSON.parse(JSON.stringify(productStore.productMapping));
    const modelFieldConfigs = currentMapping.modelFieldConfigs;
    
    const fieldsToCopy = JSON.parse(JSON.stringify(modelFieldConfigs[modelToDuplicate] || []));
    
    const idMapping = {};
    fieldsToCopy.forEach(field => {
        const oldId = field.id;
        const newId = `${field.id}_copy_${Date.now()}`;
        idMapping[oldId] = newId;
        field.id = newId;
    });

    fieldsToCopy.forEach(field => {
        if (field.dependsOn && idMapping[field.dependsOn]) {
            field.dependsOn = idMapping[field.dependsOn];
        }
        if (field.conditions) {
            field.conditions.forEach(condition => {
                if(idMapping[condition.field]) {
                    condition.field = idMapping[condition.field];
                }
            });
        }
    });

    currentMapping.modelFieldConfigs[newModelName] = fieldsToCopy;

    if (currentMapping.categoryModels[selectedCategory.value]) {
        currentMapping.categoryModels[selectedCategory.value].push(newModelName);
    } else {
        currentMapping.categoryModels[selectedCategory.value] = [newModelName];
    }
    
    productStore.updateProductMapping(currentMapping);
    markDirty();
    showToast({ message: `Model duplicated as "${newModelName}".`, type: 'success' });
};

const doSaveConfigurationToServer = async () => {
  isSaving.value = true;
  const mappingToSave = JSON.parse(JSON.stringify(productStore.productMapping));
  try {
    const response = await fetch('http://localhost:4000/config/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mappingToSave, null, 2),
    });
    const resultText = await response.text();
    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}: ${resultText}`);
    }
    productStore.updateProductMapping(mappingToSave);
    resetDirty();
    showToast({ message: 'Configuration saved to server.', type: 'success' });
  } catch (error) {
    console.error('Failed to save configuration to server:', error);
    showToast({ message: `Failed to save configuration: ${error.message}`, type: 'danger', duration: 6000 });
  } finally {
    isSaving.value = false;
  }
};
const saveConfigurationToServer = () => {
  if (isSaving.value) return;
  if (!hasUnsavedChanges.value) {
    showToast({ message: 'No changes to save.', type: 'info' });
    return;
  }
  askConfirmation({
    title: 'Save configuration',
    message: 'This will overwrite the configuration on the server. Continue?',
    confirmText: 'Save',
    onConfirm: doSaveConfigurationToServer,
  });
};

const doImportDefaultIntoDb = async () => {
  isSaving.value = true;
  try {
    const response = await fetch('http://localhost:4000/config/import-default', { method: 'POST' });
    const resultText = await response.text();
    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}: ${resultText}`);
    }
    await productStore.loadConfiguration();
    resetDirty();
    showToast({ message: 'Default configuration imported.', type: 'success' });
  } catch (err) {
    console.error('Failed to import default configuration:', err);
    showToast({ message: `Import failed: ${err.message}`, type: 'danger', duration: 6000 });
  } finally {
    isSaving.value = false;
  }
};
const importDefaultIntoDb = () => {
  if (isSaving.value) return;
  askConfirmation({
    title: 'Import default configuration',
    message: 'This will import the default productData.json and may overwrite existing entries. Continue?',
    confirmText: 'Import',
    onConfirm: doImportDefaultIntoDb,
  });
};

const reloadFromServer = async () => {
  isSaving.value = true;
  try {
    await productStore.loadConfiguration();
    // reset filtered state if current selections no longer exist
    if (!productStore.categories.includes(selectedCategory.value)) {
      selectedCategory.value = '';
      selectedModel.value = '';
      searchQuery.value = '';
    }
    resetDirty();
    showToast({ message: 'Configuration reloaded from server.', type: 'info' });
  } catch (e) {
    console.error(e);
    showToast({ message: 'Failed to reload configuration.', type: 'danger' });
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  productStore.loadConfiguration();
  resetDirty();
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

.header-actions {
    display: flex;
    gap: 1rem;
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
.field-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.75rem; margin-bottom: 0.75rem; }
.summary-item { background: #f7f9fc; border: 1px solid #eef2f7; border-radius: 6px; padding: 0.5rem 0.75rem; font-size: 0.9rem; }

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
.field-card.is-dragging { opacity: 0.6; }
.field-card.drag-over { outline: 2px dashed #0d6efd; outline-offset: 2px; }

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
    max-width: 1000px;
    display: flex;
    flex-direction: column;
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
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
    width: 100%;
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
.toast-action { text-decoration: underline; }
.toast-close { font-size: 1.1rem; line-height: 1; }

.unsaved-indicator {
  align-self: center;
  color: #d35400;
  font-weight: 600;
}

.dependencies-section, .conditions-section {
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
    grid-template-columns: 1fr;
    gap: 0.5rem;
}

.symptom-sets-selection .checkbox-group {
    margin-bottom: 0.5rem;
}

.compact-checkbox {
    padding-top: 0.5rem;
    margin-bottom: 0;
}

.form-section {
    background-color: #fdfdfd;
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}

.form-section h4 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 0.75rem;
}

.field-editor-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
}

.editor-column h4 {
    margin-top: 0;
    border-bottom: 1px solid #eee;
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
}

.condition-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr auto;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1rem;
}

.condition-control {
    width: 100%;
}

.model-list-container {
  margin-top: 2rem;
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #eee;
}

.model-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;
}

.model-list-header h3 {
    margin: 0;
}

.model-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.model-card {
  padding: 1.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-align: center;
  background-color: #f9f9f9;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.model-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-color: #007bff;
}

.model-card-content { flex-grow: 1; display: flex; flex-direction: column; gap: 0.75rem; }
.model-card-title { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.model-card-title h4 { margin: 0; flex: 1; text-align: left; }
.model-icon { font-size: 1.1rem; }
.badge { background: #0d6efd; color: #fff; padding: 0 0.5rem; border-radius: 999px; font-size: 0.75rem; }
.model-preview { display: flex; flex-wrap: wrap; gap: 0.4rem; justify-content: flex-start; }
.chip { background: #eef3ff; border: 1px solid #d9e5ff; color: #2a4d9b; border-radius: 999px; padding: 0.15rem 0.5rem; font-size: 0.8rem; }
.more-chip { background: #f0f0f0; border: 1px solid #e5e5e5; border-radius: 999px; padding: 0.15rem 0.5rem; font-size: 0.8rem; }

.model-card-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.model-icon {
    font-size: 1.5rem;
}

.badge {
    background-color: #007bff;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 10px;
    font-size: 0.8rem;
    font-weight: bold;
    white-space: nowrap;
}

.model-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    margin-top: 0.5rem;
}

.chip {
    background-color: #e0e0e0;
    color: #333;
    padding: 0.25rem 0.75rem;
    border-radius: 15px;
    font-size: 0.75rem;
    font-weight: bold;
    white-space: nowrap;
}

.more-chip {
    background-color: #007bff;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 15px;
    font-size: 0.75rem;
    font-weight: bold;
    white-space: nowrap;
}

.model-card-actions {
    padding-top: 1rem;
    border-top: 1px solid #eee;
    margin-top: 1rem;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    display: flex;
    gap: 0.5rem;
    justify-content: center;
}

.model-card:hover .model-card-actions {
    opacity: 1;
}

.model-card h4 {
    margin: 0;
    color: #333;
}

.model-editor-modal .modal-content {
    max-width: 1600px;
    width: 95%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
}

.model-editor-layout {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 2rem;
    overflow: hidden;
    flex-grow: 1;
}

.field-list-pane, .field-editor-pane {
    overflow-y: auto;
    padding: 0 1rem;
    height: 100%;
}

.field-editor-pane {
    border-left: 1px solid #eee;
}

.field-editor-form {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.field-editor-grid, .conditions-section {
    flex-shrink: 0;
}

.field-editor-form .modal-actions {
    margin-top: auto;
    padding-top: 1rem;
    position: sticky;
    bottom: 0;
    background: #fff;
}

.field-editor-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #777;
    text-align: center;
}

.main-modal-actions {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #eee;
    flex-shrink: 0;
}

.model-editor-modal .field-editor {
    border: none;
    padding: 0;
}

.field-card.is-active {
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0,123,255,.25);
}
</style>
