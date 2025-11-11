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
        <button @click="triggerFileImport" class="btn btn-outline">Import Configuration from JSON</button>
        <button @click="exportConfiguration" class="btn btn-success">Export Configuration to JSON</button>
        <input
          ref="fileInputRef"
          type="file"
          accept="application/json"
          class="hidden-file-input"
          @change="handleFileImportChange"
        />
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
            <div style="display:flex; gap:0.5rem; align-items:center;">
              <button @click="openCategoryManager" class="btn btn-secondary">Manage Categories</button>
              <button @click="addModel" class="btn btn-primary">Add New Model</button>
            </div>
        </div>
        <div v-if="availableModels.length > 0" class="model-list">
            <div v-for="model in filteredModels" :key="model" class="model-card" @click="openModelEditor(model)">
                <div class="model-card-content">
                    <div class="model-card-title">
                        <!-- <span class="model-icon">📦</span> -->
                        <h4>{{ model }}</h4>
                        <span class="badge">{{ getFieldCount(model) }}</span>
                    </div>
                    <div class="model-preview" v-if="getPreviewFieldLabels(model).length">
                        <span class="chip" v-for="label in getPreviewFieldLabels(model)" :key="label">{{ label }}</span>
                        <span v-if="getFieldCount(model) > 3" class="more-chip">+{{ getFieldCount(model) - 3 }}</span>
                    </div>
                </div>
                <div class="model-card-actions">
                    <select class="btn btn-sm" @click.stop v-model="modelMoveTarget" @change="moveModel(model, modelMoveTarget)">
                      <option disabled :value="''">Move to category...</option>
                      <option v-for="c in categories.filter(x => x !== selectedCategory)" :key="c" :value="c">{{ c }}</option>
                    </select>
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
                                    <div class="form-grid form-grid-2">
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
                                                <option value="file">File</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label>Order</label>
                                            <input type="number" v-model.number="activeField.order" min="0">
                                        </div>
                                        <div class="form-group checkbox-group compact-checkbox">
                                            <input type="checkbox" v-model="activeField.required" id="isRequired" />
                                            <label for="isRequired">Field is required</label>
                                        </div>
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
                                            <label for="isSymptomArea">Use Symptom Sets as options</label>
                                        </div>
                                        <p class="helper-text">
                                            Attiva questa opzione se il menù deve mostrare i Symptom Set disponibili per il modello.
                                        </p>
                                        <div v-if="activeField.isSymptomArea" class="form-group">
                                            <label>Available Symptom Sets</label>
                                            <div class="symptom-selector">
                                                <input
                                                    type="text"
                                                    v-model="symptomSearch"
                                                    placeholder="Filter sets..."
                                                    class="symptom-search"
                                                />
                                                <button type="button" class="manage-symptom-link" @click="openSymptomSetManager">
                                                    Manage Symptom Sets
                                                </button>
                                                <div class="chip-grid">
                                                    <button
                                                        type="button"
                                                        class="chip-toggle"
                                                        v-for="set in filteredSymptomSets"
                                                        :key="set.value"
                                                        :class="{ selected: isSymptomSetSelected(set.value) }"
                                                        @click="toggleSymptomSet(set.value)"
                                                    >
                                                        <span class="chip-title">{{ set.label }}</span>
                                                        <span class="chip-sub">{{ set.value }}</span>
                                                    </button>
                                                </div>
                                                <p v-if="!filteredSymptomSets.length" class="empty-state">No symptom sets match your search.</p>
                                                <div v-if="activeField.options?.length" class="selected-preview">
                                                    <span class="preview-label">Selected:</span>
                                                    <span class="preview-chip" v-for="value in activeField.options" :key="value">
                                                        {{ value }}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-else class="form-group">
                                            <label>Options</label>
                                            <div class="manual-options">
                                                <div class="manual-options-input">
                                                    <input
                                                        type="text"
                                                        v-model="manualOptionDraft"
                                                        placeholder="Type an option and press Enter"
                                                        @keyup.enter.prevent="addManualOption"
                                                    />
                                                    <button type="button" class="chip-add" @click="addManualOption">Add</button>
                                                </div>
                                                <div v-if="manualOptions.length" class="manual-options-chips">
                                                    <span class="manual-chip" v-for="option in manualOptions" :key="option">
                                                        {{ option }}
                                                        <button type="button" class="chip-remove" @click="removeManualOption(option)">×</button>
                                                    </span>
                                                </div>
                                                <p v-else class="empty-state">No options yet. Add at least one to populate the select.</p>
                                                <button type="button" class="manage-symptom-link subtle" @click="openSymptomSetManager">
                                                    Need a Symptom Set instead? Manage them here
                                                </button>
                                            </div>
                                        </div>
                                        <div v-if="!activeField.isSymptomArea" class="dependencies-section">
                                            <h5>Parent/child options</h5>
                                            <p class="helper-text">
                                                Collega questo select a un altro per mostrare opzioni diverse in base alla scelta del genitore.
                                            </p>
                                            <div class="form-group">
                                                <label>Parent select field</label>
                                                <select v-model="activeField.dependsOn" @change="markDirty()">
                                                    <option :value="null">None</option>
                                                    <option v-for="field in availableParentFields" :key="field.id" :value="field.id">
                                                        {{ field.label }} ({{ field.id }})
                                                    </option>
                                                </select>
                                            </div>
                                            <div v-if="activeField.dependsOn" class="value-mapping">
                                                <h6>Mapping</h6>
                                                <p class="helper-text">Definisci da dove recuperare le opzioni in base al valore scelto nel campo padre.</p>
                                                <div class="mapping-table">
                                                    <div class="mapping-row mapping-header">
                                                        <span>Parent option</span>
                                                        <span>Child options</span>
                                                    </div>
                                                    <div v-for="parentOption in parentFieldOptions" :key="parentOption" class="mapping-row">
                                                        <span class="parent-option-label">{{ parentOption }}</span>
                                                        <div class="mapping-controls">
                                                        <select
                                                            v-model="activeField.valueMapping[parentOption].type"
                                                            class="mapping-type-select"
                                                            @change="onMappingTypeChange(parentOption)"
                                                        >
                                                                <option value="static">Manual list</option>
                                                                <option value="symptomSet">Symptom Set</option>
                                                            </select>
                                                            <template v-if="activeField.valueMapping[parentOption] && activeField.valueMapping[parentOption].type === 'static'">
                                                            <div class="mapping-static">
                                                                <div class="manual-options-input">
                                                                    <input
                                                                        type="text"
                                                                        v-model="mappingDrafts[parentOption]"
                                                                        placeholder="Add child option"
                                                                        @keyup.enter.prevent="addMappingOption(parentOption)"
                                                                    />
                                                                    <button type="button" class="chip-add" @click="addMappingOption(parentOption)">Add</button>
                                                                </div>
                                                                <div class="manual-options-chips" v-if="getMappingOptionList(parentOption).length">
                                                                    <span
                                                                        class="manual-chip"
                                                                        v-for="option in getMappingOptionList(parentOption)"
                                                                        :key="option"
                                                                    >
                                                                        {{ option }}
                                                                        <button
                                                                            type="button"
                                                                            class="chip-remove"
                                                                            @click="removeMappingOption(parentOption, option)"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </span>
                                                                </div>
                                                                <p v-else class="empty-state">No child options configured yet.</p>
                                                            </div>
                                                            </template>
                                                            <template v-else-if="activeField.valueMapping[parentOption] && activeField.valueMapping[parentOption].type === 'symptomSet'">
                                                                <select v-model="activeField.valueMapping[parentOption].value" @change="markDirty()">
                                                                    <option disabled value="">Select a symptom set</option>
                                                                    <option v-for="set in availableSymptomSets" :key="set.value" :value="set.value">
                                                                        {{ set.label }} ({{ set.value }})
                                                                    </option>
                                                                </select>
                                                            <button type="button" class="manage-symptom-link subtle" @click="openSymptomSetManager">
                                                                Manage Symptom Sets
                                                            </button>
                                                            </template>
                                                        </div>
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

    <!-- Category Manager Modal -->
    <div v-if="showCategoryModal" class="modal-overlay">
      <div class="modal-content category-manager-modal">
        <div class="category-manager-grid">
          <div class="category-list-pane">
            <div class="category-list-header">
              <h3>Manage Categories</h3>
              <p class="helper-text">Review existing groups and quickly jump into edit actions.</p>
            </div>
            <div v-if="categoryStats.length" class="category-list">
              <div
                v-for="cat in categoryStats"
                :key="cat.name"
                class="category-row"
                :class="{ 'is-selected': renameFrom === cat.name || deleteTarget === cat.name }"
              >
                <div class="category-info">
                  <strong>{{ cat.name }}</strong>
                  <span>{{ cat.modelCount }} {{ cat.modelCount === 1 ? 'model' : 'models' }}</span>
                </div>
                <div class="category-row-actions">
                  <button class="btn btn-sm btn-secondary" @click="startRenameCategory(cat.name)">Rename</button>
                  <button class="btn btn-sm btn-danger" @click="startDeleteCategory(cat.name)">Delete</button>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">No categories yet. Add your first one from the panel.</div>
          </div>
          <div class="category-action-pane">
            <section class="action-card">
              <h4>Add Category</h4>
              <p class="helper-text">Create a new group for your models.</p>
              <input type="text" v-model="newCategoryName" placeholder="e.g., Amplifiers">
              <div class="action-buttons">
                <button class="btn btn-primary" @click="addCategoryAction">Add</button>
              </div>
            </section>
            <section class="action-card">
              <h4>Rename Category</h4>
              <p class="helper-text">Select a category and give it a clearer name.</p>
              <select v-model="renameFrom">
                <option disabled value="">Select category</option>
                <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
              </select>
              <input type="text" v-model="renameTo" placeholder="New name">
              <div class="action-buttons">
                <button class="btn btn-secondary" @click="renameCategoryAction" :disabled="!renameFrom || !renameTo || renameTo === renameFrom">Rename</button>
              </div>
            </section>
            <section class="action-card">
              <h4>Delete Category</h4>
              <p class="helper-text">Choose where existing models should move before deleting.</p>
              <select v-model="deleteTarget">
                <option disabled value="">Select category</option>
                <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
              </select>
              <select v-model="deleteMoveTo">
                <option value="">Move models to…</option>
                <option v-for="c in categories.filter(x => x !== deleteTarget)" :key="c" :value="c">{{ c }}</option>
              </select>
              <div class="action-buttons">
                <button class="btn btn-danger" @click="deleteCategoryAction" :disabled="!deleteTarget">Delete</button>
              </div>
            </section>
            <div class="modal-footer-actions">
              <button class="btn btn-secondary" @click="closeCategoryModal">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useProductStore } from '@/stores/productStore';

const productStore = useProductStore();

const selectedCategory = ref('');
const selectedModel = ref('');

const searchQuery = ref('');
const router = useRouter();

const showModelEditorModal = ref(false);
const isSaving = ref(false);
const hasUnsavedChanges = ref(false);
const symptomSearch = ref('');
const manualOptionDraft = ref('');
const manualOptions = ref([]);
const mappingDrafts = reactive({});
const symptomSelectionCache = ref([]);
const initializingField = ref(false);
const fileInputRef = ref(null);

const defaultFieldSection = computed(() => (
  Array.isArray(productStore.defectSections) && productStore.defectSections.length
    ? productStore.defectSections[0]
    : 'additionalInfo'
));

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
  section: defaultFieldSection.value
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
        const restored = Array.isArray(activeField.options)
            ? [...activeField.options]
            : symptomSelectionCache.value.length
            ? [...symptomSelectionCache.value]
            : [];
        activeField.options = restored;
        manualOptions.value = [];
    } else {
        symptomSelectionCache.value = Array.isArray(activeField.options) ? [...activeField.options] : [];
        const existing = Array.isArray(activeField.options)
            ? [...activeField.options]
            : String(activeField.options || '')
                  .split('\n')
                  .map(opt => opt.trim())
                  .filter(Boolean);
        manualOptions.value = existing;
        activeField.options = manualOptions.value.join('\n');
    }
    symptomSearch.value = '';
    if (!initializingField.value) {
        markDirty();
    }
});

watch(manualOptions, (list) => {
    if (!activeField.isSymptomArea) {
        activeField.options = list.join('\n');
    }
}, { deep: true });

const categories = computed(() => productStore.categories || []);
const categoryModels = computed(() => productStore.categoryModels || {});
const categoryStats = computed(() => {
  const stats = categories.value.map((name) => ({
    name,
    modelCount: Array.isArray(categoryModels.value?.[name]) ? categoryModels.value[name].length : 0,
  }));
  return stats.sort((a, b) => a.name.localeCompare(b.name));
});
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
    if (!selectedModel.value) return [];
    const selfId = isEditing.value ? activeField.id : null;
    return modelFields.value.filter(field => field.id !== selfId && field.type === 'select');
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
        ensureMappingDraft(opt);
    });
    activeField.valueMapping = newMapping;
    Object.keys(activeField.valueMapping).forEach(key => ensureMappingDraft(key));
    Object.keys(mappingDrafts).forEach(key => {
        if (!newOptions.includes(key)) {
            delete mappingDrafts[key];
        }
    });
}, { deep: true });

const onCategoryChange = () => {
  selectedModel.value = '';
  searchQuery.value = '';
};

// Category manager modal
const showCategoryModal = ref(false);
const newCategoryName = ref('');
const renameFrom = ref('');
const renameTo = ref('');
const deleteTarget = ref('');
const deleteMoveTo = ref('');

const openCategoryManager = () => {
  newCategoryName.value = '';
  renameFrom.value = '';
  renameTo.value = '';
  deleteTarget.value = '';
  deleteMoveTo.value = '';
  showCategoryModal.value = true;
};
const closeCategoryModal = () => {
  showCategoryModal.value = false;
};
const addCategoryAction = () => {
  const trimmed = String(newCategoryName.value || '').trim();
  const ok = productStore.addCategory(trimmed);
  if (!ok) { showToast({ message: 'Unable to add category (empty or duplicate).', type: 'danger' }); return; }
  markDirty();
  showToast({ message: 'Category added.', type: 'success' });
  if (trimmed) {
    startRenameCategory(trimmed);
  }
  newCategoryName.value = '';
};
const renameCategoryAction = () => {
  const ok = productStore.renameCategory(renameFrom.value, renameTo.value);
  if (!ok) { showToast({ message: 'Unable to rename category.', type: 'danger' }); return; }
  markDirty();
  showToast({ message: 'Category renamed.', type: 'success' });
  renameFrom.value = '';
  renameTo.value = '';
};
const deleteCategoryAction = () => {
  const res = productStore.deleteCategory(deleteTarget.value, deleteMoveTo.value || null);
  if (!res.ok) {
    const reason = res.reason === 'needs_destination' ? 'Select a destination for existing models.' : 'Unable to delete category.';
    showToast({ message: reason, type: 'danger' }); return;
  }
  if (selectedCategory.value === deleteTarget.value) {
    selectedCategory.value = '';
    selectedModel.value = '';
    searchQuery.value = '';
  }
  markDirty();
  showToast({ message: 'Category deleted.', type: 'success' });
  deleteTarget.value = '';
  deleteMoveTo.value = '';
};
const startRenameCategory = (name) => {
  renameFrom.value = name;
  renameTo.value = name;
};
const startDeleteCategory = (name) => {
  deleteTarget.value = name;
  deleteMoveTo.value = '';
};

watch(renameFrom, (val, oldVal) => {
  if (val && (!renameTo.value || renameTo.value === oldVal)) {
    renameTo.value = val;
  }
});

watch(deleteTarget, (val) => {
  if (!val || deleteMoveTo.value === val) {
    deleteMoveTo.value = '';
  }
});

const openModelEditor = (model) => {
    selectedModel.value = model;
    showModelEditorModal.value = true;
};

const closeModelEditor = () => {
    showModelEditorModal.value = false;
    showFieldModal.value = false;
};

const openAddFieldModal = () => {
    initializingField.value = true;
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
    activeField.section = defaultFieldSection.value;
    showFieldModal.value = true;
    symptomSearch.value = '';
    manualOptions.value = [];
    manualOptionDraft.value = '';
    symptomSelectionCache.value = [];
    Object.keys(mappingDrafts).forEach(key => { mappingDrafts[key] = ''; });
    initializingField.value = false;
};

const openEditFieldModal = (index) => {
    initializingField.value = true;
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
    activeField.section = fieldToEdit.section || defaultFieldSection.value;

    if (activeField.isSymptomArea) {
        activeField.options = Array.isArray(fieldToEdit.options) ? [...fieldToEdit.options] : [];
        symptomSelectionCache.value = [...activeField.options];
        manualOptions.value = [];
    } else {
        symptomSelectionCache.value = [];
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
        manualOptions.value = Array.isArray(fieldToEdit.options)
            ? [...fieldToEdit.options]
            : String(fieldToEdit.options || '')
                  .split('\n')
                  .map(opt => opt.trim())
                  .filter(Boolean);
        Object.keys(activeField.valueMapping).forEach(key => ensureMappingDraft(key));
    }

    showFieldModal.value = true;
    symptomSearch.value = '';
    manualOptionDraft.value = '';
    Object.keys(mappingDrafts).forEach(key => { mappingDrafts[key] = ''; });
    initializingField.value = false;
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
            fieldData.options = manualOptions.value.filter(Boolean);
        }
        if (activeField.dependsOn) {
            fieldData.dependsOn = activeField.dependsOn;
            const finalValueMapping = {};
            Object.keys(activeField.valueMapping).forEach(key => {
                const mapping = activeField.valueMapping[key];
                if (mapping.type === 'static') {
                    finalValueMapping[key] = {
                        type: 'static',
                        options: String(mapping.value || '')
                            .split('\n')
                            .map(opt => opt.trim())
                            .filter(Boolean)
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
const filteredSymptomSets = computed(() => {
    const term = symptomSearch.value.trim().toLowerCase();
    if (!term) return availableSymptomSets.value;
    return availableSymptomSets.value.filter(set =>
        set.label.toLowerCase().includes(term) || set.value.toLowerCase().includes(term)
    );
});

const openSymptomSetManager = () => {
    router.replace({ name: 'config-editor', query: { ...router.currentRoute.value.query, tab: 'symptoms' } });
};

const isSymptomSetSelected = (value) => {
    if (!Array.isArray(activeField.options)) return false;
    return activeField.options.includes(value);
};

const toggleSymptomSet = (value) => {
    if (!Array.isArray(activeField.options)) {
        activeField.options = [];
    }
    const index = activeField.options.indexOf(value);
    if (index >= 0) {
        activeField.options.splice(index, 1);
    } else {
        activeField.options.push(value);
    }
    symptomSelectionCache.value = [...activeField.options];
    markDirty();
};

const triggerFileImport = () => {
    if (fileInputRef.value) {
        fileInputRef.value.value = '';
        fileInputRef.value.click();
    }
};

const handleFileImportChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target?.result;
            if (typeof content !== 'string') {
                throw new Error('Invalid file content.');
            }
            const parsed = JSON.parse(content);
            if (!parsed || typeof parsed !== 'object') {
                throw new Error('JSON structure not valid.');
            }
            productStore.updateProductMapping(parsed);
            symptomSelectionCache.value = [];
            manualOptions.value = [];
            manualOptionDraft.value = '';
            Object.keys(mappingDrafts).forEach(key => { mappingDrafts[key] = ''; });
            markDirty();
            showToast({ message: 'Configuration imported. Review and save to server.', type: 'success', duration: 5000 });
        } catch (error) {
            console.error(error);
            showToast({ message: `Failed to import configuration: ${error.message}`, type: 'danger', duration: 6000 });
        }
    };
    reader.onerror = () => {
        showToast({ message: 'Failed to read the selected file.', type: 'danger', duration: 6000 });
    };
    reader.readAsText(file);
};

const addManualOption = () => {
    const value = manualOptionDraft.value.trim();
    if (!value) return;
    if (!manualOptions.value.includes(value)) {
        manualOptions.value.push(value);
        markDirty();
    }
    manualOptionDraft.value = '';
};

const removeManualOption = (value) => {
    manualOptions.value = manualOptions.value.filter(item => item !== value);
    markDirty();
};

const ensureMappingDraft = (key) => {
    if (mappingDrafts[key] === undefined) {
        mappingDrafts[key] = '';
    }
};

const getMappingOptionList = (parentOption) => {
    const mapping = activeField.valueMapping[parentOption];
    if (!mapping || mapping.type !== 'static') return [];
    const raw = mapping.value || '';
    return String(raw)
        .split('\n')
        .map(opt => opt.trim())
        .filter(Boolean);
};

const setMappingOptionList = (parentOption, list) => {
    if (!activeField.valueMapping[parentOption]) return;
    activeField.valueMapping[parentOption].value = list.join('\n');
    if (!initializingField.value) {
        markDirty();
    }
};

const addMappingOption = (parentOption) => {
    ensureMappingDraft(parentOption);
    const value = mappingDrafts[parentOption].trim();
    if (!value) return;
    const current = getMappingOptionList(parentOption);
    if (!current.includes(value)) {
        current.push(value);
        setMappingOptionList(parentOption, current);
    }
    mappingDrafts[parentOption] = '';
};

const removeMappingOption = (parentOption, option) => {
    const current = getMappingOptionList(parentOption).filter(item => item !== option);
    setMappingOptionList(parentOption, current);
};

const onMappingTypeChange = (parentOption) => {
    const mapping = activeField.valueMapping[parentOption];
    if (!mapping) return;
    if (mapping.type === 'static') {
        if (typeof mapping.value !== 'string') {
            mapping.value = '';
        }
    } else if (mapping.type === 'symptomSet') {
        mapping.value = mapping.value || '';
    }
    mappingDrafts[parentOption] = '';
    if (!initializingField.value) {
        markDirty();
    }
};

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
    // Refactor: keep original field IDs when duplicating a model.
    const fieldsToCopy = JSON.parse(JSON.stringify(modelFieldConfigs[modelToDuplicate] || []));

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

// Move model between categories
const modelMoveTarget = ref('');
const moveModel = (modelName, targetCategory) => {
    if (!targetCategory) return;
    const from = selectedCategory.value;
    const ok = productStore.moveModelToCategory(modelName, from, targetCategory);
    if (!ok) { showToast({ message: 'Unable to move model.', type: 'danger' }); return; }
    markDirty();
    showToast({ message: `Model "${modelName}" moved to ${targetCategory}.`, type: 'success' });
    // reset select
    modelMoveTarget.value = '';
};

const doSaveConfigurationToServer = async () => {
  isSaving.value = true;
  const mappingToSave = JSON.parse(JSON.stringify(productStore.productMapping));
  try {
    const response = await fetch('/config/import', {
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
    const response = await fetch('/config/import-default', { method: 'POST' });
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
.mapping-table {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
}
.mapping-row {
    display: grid;
    grid-template-columns: 1fr minmax(0, 1.5fr);
    gap: 1rem;
    padding: 0.75rem 1rem;
    align-items: flex-start;
    background: #fff;
}
.mapping-row:nth-child(odd) {
    background: #f9fafc;
}
.mapping-header {
    font-weight: 600;
    color: #1f2937;
    background: #eef2ff !important;
}
.mapping-controls textarea,
.mapping-controls select {
    margin-top: 0.35rem;
}
.mapping-controls textarea {
    border-radius: 6px;
    border: 1px solid #d1d5db;
    padding: 0.5rem;
}
.mapping-controls {
    display: flex;
    flex-direction: column;
}
.mapping-static {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
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

.compact-checkbox {
    padding-top: 0.5rem;
    margin-bottom: 0;
}

.form-grid {
    display: grid;
    gap: 1rem;
}
.form-grid-2 {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}
.helper-text {
    color: #6b7280;
    font-size: 0.85rem;
}

.symptom-selector {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}
.symptom-search {
    padding: 0.5rem 0.65rem;
    border-radius: 6px;
    border: 1px solid #d1d5db;
}
.chip-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 0.5rem;
}
.chip-toggle {
    background: #f4f6fb;
    border: 1px solid #dbe3f5;
    border-radius: 10px;
    padding: 0.45rem 0.75rem;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    cursor: pointer;
    transition: all 0.15s ease;
}
.chip-toggle:hover {
    border-color: #b9cdf6;
    background: #eff3ff;
}
.chip-toggle.selected {
    background: #0d6efd;
    border-color: #0d6efd;
    color: #fff;
    box-shadow: 0 4px 12px rgba(13, 110, 253, 0.18);
}
.chip-title {
    font-weight: 600;
}
.chip-sub {
    font-size: 0.8rem;
    opacity: 0.8;
}
.selected-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: center;
}
.preview-label {
    font-weight: 600;
    color: #1f2937;
}
.preview-chip {
    background: #eef3ff;
    color: #2a4d9b;
    border-radius: 999px;
    padding: 0.15rem 0.6rem;
    font-size: 0.8rem;
}
.empty-state {
    color: #6b7280;
    font-size: 0.9rem;
    margin: 0;
}

.manual-options {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}
.manual-options-input {
    display: flex;
    gap: 0.5rem;
}
.manual-options-input input,
.symptom-search {
    flex: 1;
    padding: 0.5rem 0.65rem;
    border-radius: 6px;
    border: 1px solid #d1d5db;
    font-size: 0.95rem;
}
.chip-add {
    background: #0d6efd;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 0.45rem 0.85rem;
    cursor: pointer;
}
.chip-add:hover {
    background: #0b5ed7;
}
.manual-options-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
}
.manual-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.65rem;
    border-radius: 999px;
    background: #eef3ff;
    border: 1px solid #dbe3f5;
    color: #2a4d9b;
    font-size: 0.85rem;
}
.chip-remove {
    background: transparent;
    border: none;
    color: inherit;
    font-weight: 600;
    cursor: pointer;
}
.chip-remove:hover {
    opacity: 0.7;
}
.manage-symptom-link {
    align-self: flex-start;
    background: transparent;
    border: none;
    color: #0d6efd;
    padding: 0;
    font-size: 0.85rem;
    cursor: pointer;
    text-decoration: underline;
}
.manage-symptom-link.subtle {
    color: #4c6fbf;
}
.manage-symptom-link:hover {
    color: #0b5ed7;
}
.hidden-file-input {
    display: none;
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
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
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
.model-list-header .btn { white-space: nowrap; }

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
    flex-direction: column;
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
    grid-template-columns: minmax(240px, 0.32fr) minmax(0, 0.68fr);
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

.category-manager-modal {
  max-width: 900px;
  width: 95%;
}
.category-manager-grid {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(320px, 1.2fr);
  gap: 1.5rem;
}
.category-list-pane {
  border-right: 1px solid #e0e0e0;
  padding-right: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.category-list-header h3 {
  margin: 0;
}
.category-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 420px;
  overflow-y: auto;
}
.category-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #fff;
}
.category-row.is-selected {
  border-color: #0d6efd;
  background: rgba(13, 110, 253, 0.08);
}
.category-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.category-info span {
  font-size: 0.85rem;
  color: #6c757d;
}
.category-row-actions {
  display: flex;
  gap: 0.4rem;
}
.category-action-pane {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.action-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.action-card input,
.action-card select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.95rem;
}
.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
.modal-footer-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
}
.empty-state {
  font-size: 0.9rem;
  color: #6c757d;
  padding: 0.75rem 0;
}

</style>
