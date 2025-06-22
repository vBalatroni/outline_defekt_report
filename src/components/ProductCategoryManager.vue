<template>
  <div class="product-category-manager">
    <div class="manager-header">
      <h3>Product Category Manager</h3>
      <div class="status-info">
        <span class="status-badge" :class="{ custom: hasCustomConfiguration }">
          {{ hasCustomConfiguration ? 'Custom Data' : 'Default Data' }}
        </span>
        <span class="category-count">{{ categories.length }} Categories</span>
      </div>
    </div>

    <div class="manager-content">
      <div class="categories-section">
        <div class="section-header">
          <h4>Categories & Models</h4>
          <div class="section-actions">
            <button @click="addCategory" class="btn btn-primary btn-sm">
              Add Category
            </button>
            <button @click="exportData" class="btn btn-secondary btn-sm">
              Export Data
            </button>
          </div>
        </div>

        <div class="categories-list">
          <div
            v-for="category in categories"
            :key="category"
            class="category-item"
          >
            <div class="category-header">
              <div class="category-info">
                <h5>{{ category }}</h5>
                <span class="model-count">{{ getModelsForCategory(category).length }} models</span>
              </div>
              <div class="category-actions">
                <button @click="editCategory(category)" class="btn btn-sm btn-outline">
                  Edit
                </button>
                <button @click="deleteCategory(category)" class="btn btn-sm btn-danger">
                  Delete
                </button>
              </div>
            </div>

            <div class="models-list">
              <div
                v-for="model in getModelsForCategory(category)"
                :key="model"
                class="model-item"
              >
                <span class="model-name">{{ model }}</span>
                <div class="model-actions">
                  <button @click="editModel(category, model)" class="btn btn-sm btn-outline">
                    Edit
                  </button>
                  <button @click="deleteModel(category, model)" class="btn btn-sm btn-danger">
                    Delete
                  </button>
                </div>
              </div>
              <button @click="addModel(category)" class="btn btn-sm btn-outline add-model-btn">
                + Add Model
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="symptoms-section">
        <div class="section-header">
          <h4>Symptom Areas & Symptoms</h4>
          <button @click="addSymptomArea" class="btn btn-primary btn-sm">
            Add Symptom Area
          </button>
        </div>

        <div class="symptoms-list">
          <div
            v-for="(symptoms, area) in symptomsByArea"
            :key="area"
            class="symptom-area-item"
          >
            <div class="area-header">
              <h5>{{ area }}</h5>
              <div class="area-actions">
                <button @click="editSymptomArea(area)" class="btn btn-sm btn-outline">
                  Edit
                </button>
                <button @click="deleteSymptomArea(area)" class="btn btn-sm btn-danger">
                  Delete
                </button>
              </div>
            </div>
            <div class="symptoms-list">
              <span
                v-for="symptom in symptoms"
                :key="symptom"
                class="symptom-tag"
              >
                {{ symptom }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal for editing -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>{{ modalTitle }}</h4>
          <button @click="closeModal" class="btn btn-sm btn-outline">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="modalType === 'category'" class="form-group">
            <label>Category Name:</label>
            <input v-model="editData.name" type="text" class="form-control" />
          </div>
          
          <div v-if="modalType === 'model'" class="form-group">
            <label>Model Name:</label>
            <input v-model="editData.name" type="text" class="form-control" />
            <label>Symptom Areas:</label>
            <div class="checkbox-group">
              <label v-for="area in availableSymptomAreas" :key="area" class="checkbox-item">
                <input
                  type="checkbox"
                  :value="area"
                  v-model="editData.symptomAreas"
                />
                {{ area }}
              </label>
            </div>
          </div>

          <div v-if="modalType === 'symptomArea'" class="form-group">
            <label>Area Name:</label>
            <input v-model="editData.name" type="text" class="form-control" />
            <label>Symptoms (one per line):</label>
            <textarea
              v-model="editData.symptoms"
              class="form-control"
              rows="5"
              placeholder="Enter symptoms, one per line"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">Cancel</button>
          <button @click="saveEdit" class="btn btn-primary">Save</button>
        </div>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useProductStore } from '@/stores/productStore';

const productStore = useProductStore();

// Reactive data
const showModal = ref(false);
const modalType = ref('');
const modalTitle = ref('');
const editData = ref({});
const error = ref('');
const successMessage = ref('');

// Computed properties
const categories = computed(() => productStore.categories);
const symptomsByArea = computed(() => productStore.symptomsByArea);
const hasCustomConfiguration = computed(() => productStore.hasCustomConfiguration);
const availableSymptomAreas = computed(() => Object.keys(productStore.symptomsByArea));

// Methods
const getModelsForCategory = (category) => {
  return productStore.getModelsForCategory(category);
};

const addCategory = () => {
  modalType.value = 'category';
  modalTitle.value = 'Add New Category';
  editData.value = { name: '' };
  showModal.value = true;
};

const editCategory = (category) => {
  modalType.value = 'category';
  modalTitle.value = 'Edit Category';
  editData.value = { name: category };
  showModal.value = true;
};

const deleteCategory = async (category) => {
  if (!confirm(`Are you sure you want to delete category "${category}" and all its models?`)) {
    return;
  }

  try {
    const currentMapping = productStore.productMapping || productStore.exportCurrentConfiguration().productMapping;
    
    // Remove category and its models
    delete currentMapping.categoryModels[category];
    currentMapping.categories = currentMapping.categories.filter(c => c !== category);
    
    // Remove models from symptom areas
    const modelsToRemove = getModelsForCategory(category);
    modelsToRemove.forEach(model => {
      delete currentMapping.modelSymptomAreas[model];
    });

    await productStore.updateProductMapping(currentMapping);
    showSuccess('Category deleted successfully');
  } catch (err) {
    showError('Failed to delete category: ' + err.message);
  }
};

const addModel = (category) => {
  modalType.value = 'model';
  modalTitle.value = `Add Model to ${category}`;
  editData.value = { 
    name: '', 
    category: category,
    symptomAreas: []
  };
  showModal.value = true;
};

const editModel = (category, model) => {
  modalType.value = 'model';
  modalTitle.value = 'Edit Model';
  editData.value = { 
    name: model, 
    category: category,
    symptomAreas: productStore.getSymptomAreasForModel(model)
  };
  showModal.value = true;
};

const deleteModel = async (category, model) => {
  if (!confirm(`Are you sure you want to delete model "${model}"?`)) {
    return;
  }

  try {
    const currentMapping = productStore.productMapping || productStore.exportCurrentConfiguration().productMapping;
    
    // Remove model from category
    currentMapping.categoryModels[category] = currentMapping.categoryModels[category].filter(m => m !== model);
    
    // Remove model from symptom areas
    delete currentMapping.modelSymptomAreas[model];

    await productStore.updateProductMapping(currentMapping);
    showSuccess('Model deleted successfully');
  } catch (err) {
    showError('Failed to delete model: ' + err.message);
  }
};

const addSymptomArea = () => {
  modalType.value = 'symptomArea';
  modalTitle.value = 'Add Symptom Area';
  editData.value = { name: '', symptoms: '' };
  showModal.value = true;
};

const editSymptomArea = (area) => {
  modalType.value = 'symptomArea';
  modalTitle.value = 'Edit Symptom Area';
  editData.value = { 
    name: area, 
    symptoms: productStore.getSymptomsForArea(area).join('\n')
  };
  showModal.value = true;
};

const deleteSymptomArea = async (area) => {
  if (!confirm(`Are you sure you want to delete symptom area "${area}"?`)) {
    return;
  }

  try {
    const currentMapping = productStore.productMapping || productStore.exportCurrentConfiguration().productMapping;
    
    // Remove symptom area
    delete currentMapping.symptomsByArea[area];
    
    // Remove from model symptom areas
    Object.keys(currentMapping.modelSymptomAreas).forEach(model => {
      currentMapping.modelSymptomAreas[model] = currentMapping.modelSymptomAreas[model].filter(a => a !== area);
    });

    await productStore.updateProductMapping(currentMapping);
    showSuccess('Symptom area deleted successfully');
  } catch (err) {
    showError('Failed to delete symptom area: ' + err.message);
  }
};

const saveEdit = async () => {
  try {
    const currentMapping = productStore.productMapping || productStore.exportCurrentConfiguration().productMapping;
    
    if (modalType.value === 'category') {
      if (!editData.value.name.trim()) {
        showError('Category name cannot be empty');
        return;
      }
      
      if (editData.value.name !== editData.value.originalName) {
        // Rename category
        if (editData.value.originalName) {
          // Update category name
          const index = currentMapping.categories.indexOf(editData.value.originalName);
          if (index !== -1) {
            currentMapping.categories[index] = editData.value.name;
          }
          
          // Update category models
          currentMapping.categoryModels[editData.value.name] = currentMapping.categoryModels[editData.value.originalName];
          delete currentMapping.categoryModels[editData.value.originalName];
        } else {
          // Add new category
          currentMapping.categories.push(editData.value.name);
          currentMapping.categoryModels[editData.value.name] = [];
        }
      }
    } else if (modalType.value === 'model') {
      if (!editData.value.name.trim()) {
        showError('Model name cannot be empty');
        return;
      }
      
      if (editData.value.name !== editData.value.originalName) {
        if (editData.value.originalName) {
          // Rename model
          const models = currentMapping.categoryModels[editData.value.category];
          const index = models.indexOf(editData.value.originalName);
          if (index !== -1) {
            models[index] = editData.value.name;
          }
          
          // Update symptom areas
          currentMapping.modelSymptomAreas[editData.value.name] = currentMapping.modelSymptomAreas[editData.value.originalName];
          delete currentMapping.modelSymptomAreas[editData.value.originalName];
        } else {
          // Add new model
          currentMapping.categoryModels[editData.value.category].push(editData.value.name);
          currentMapping.modelSymptomAreas[editData.value.name] = [];
        }
      }
      
      // Update symptom areas
      currentMapping.modelSymptomAreas[editData.value.name] = editData.value.symptomAreas;
    } else if (modalType.value === 'symptomArea') {
      if (!editData.value.name.trim()) {
        showError('Symptom area name cannot be empty');
        return;
      }
      
      const symptoms = editData.value.symptoms.split('\n').filter(s => s.trim());
      
      if (editData.value.name !== editData.value.originalName) {
        if (editData.value.originalName) {
          // Rename symptom area
          currentMapping.symptomsByArea[editData.value.name] = currentMapping.symptomsByArea[editData.value.originalName];
          delete currentMapping.symptomsByArea[editData.value.originalName];
          
          // Update model symptom areas
          Object.keys(currentMapping.modelSymptomAreas).forEach(model => {
            const index = currentMapping.modelSymptomAreas[model].indexOf(editData.value.originalName);
            if (index !== -1) {
              currentMapping.modelSymptomAreas[model][index] = editData.value.name;
            }
          });
        } else {
          // Add new symptom area
          currentMapping.symptomsByArea[editData.value.name] = [];
        }
      }
      
      // Update symptoms
      currentMapping.symptomsByArea[editData.value.name] = symptoms;
    }

    await productStore.updateProductMapping(currentMapping);
    closeModal();
    showSuccess('Changes saved successfully');
  } catch (err) {
    showError('Failed to save changes: ' + err.message);
  }
};

const closeModal = () => {
  showModal.value = false;
  modalType.value = '';
  modalTitle.value = '';
  editData.value = {};
};

const exportData = () => {
  try {
    const data = productStore.exportCurrentConfiguration();
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'product-mapping-config.json';
    link.click();
    URL.revokeObjectURL(url);
    showSuccess('Data exported successfully');
  } catch (err) {
    showError('Failed to export data: ' + err.message);
  }
};

const showSuccess = (message) => {
  successMessage.value = message;
  setTimeout(() => {
    successMessage.value = '';
  }, 3000);
};

const showError = (message) => {
  error.value = message;
  setTimeout(() => {
    error.value = '';
  }, 5000);
};

// Load configuration on mount
onMounted(async () => {
  await productStore.loadConfiguration();
});
</script>

<style scoped>
.product-category-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e0e0e0;
}

.manager-header h3 {
  margin: 0;
  color: #333;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.9em;
  font-weight: 500;
  background-color: #f0f0f0;
  color: #666;
}

.status-badge.custom {
  background-color: #4CAF50;
  color: white;
}

.category-count {
  font-size: 0.9em;
  color: #666;
}

.manager-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.categories-section,
.symptoms-section {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h4 {
  margin: 0;
  color: #333;
}

.section-actions {
  display: flex;
  gap: 10px;
}

.category-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 15px;
  overflow: hidden;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.category-info h5 {
  margin: 0 0 5px 0;
  color: #333;
}

.model-count {
  font-size: 0.8em;
  color: #666;
}

.category-actions {
  display: flex;
  gap: 8px;
}

.models-list {
  padding: 15px;
}

.model-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.model-item:last-child {
  border-bottom: none;
}

.model-name {
  font-weight: 500;
  color: #333;
}

.model-actions {
  display: flex;
  gap: 8px;
}

.add-model-btn {
  margin-top: 10px;
  width: 100%;
}

.symptom-area-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 15px;
  overflow: hidden;
}

.area-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.area-header h5 {
  margin: 0;
  color: #333;
}

.area-actions {
  display: flex;
  gap: 8px;
}

.symptoms-list {
  padding: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.symptom-tag {
  background: #e9ecef;
  color: #495057;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 0.8em;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.btn-outline {
  background-color: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.btn-outline:hover {
  background-color: #007bff;
  color: white;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h4 {
  margin: 0;
  color: #333;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid #e0e0e0;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9em;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9em;
  cursor: pointer;
}

.checkbox-item input[type="checkbox"] {
  margin: 0;
}

.error-message {
  margin-top: 15px;
  padding: 12px;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  font-size: 0.9em;
}

.success-message {
  margin-top: 15px;
  padding: 12px;
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  font-size: 0.9em;
}

@media (max-width: 768px) {
  .manager-content {
    grid-template-columns: 1fr;
  }
  
  .manager-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .status-info {
    flex-direction: column;
    gap: 5px;
  }
  
  .section-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .category-header,
  .area-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .model-item {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}
</style> 