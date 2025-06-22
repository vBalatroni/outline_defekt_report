<template>
  <div class="json-config-manager">
    <div class="header">
      <h3>JSON Configuration Manager</h3>
      <p>Manage product data through JSON files</p>
    </div>

    <div class="actions">
      <div class="action-group">
        <h4>Data Management</h4>
        <div class="button-group">
          <button 
            @click="reloadFromJson" 
            :disabled="productStore.isLoading"
            class="btn btn-primary"
          >
            <i class="bi bi-arrow-clockwise"></i>
            Reload from JSON
          </button>
          <button 
            @click="exportToJson" 
            :disabled="productStore.isLoading"
            class="btn btn-success"
          >
            <i class="bi bi-download"></i>
            Export to JSON
          </button>
        </div>
        <p class="help-text">
          <strong>Reload from JSON:</strong> Loads the latest data from src/assets/productData.json<br>
          <strong>Export to JSON:</strong> Downloads current data as a JSON file
        </p>
      </div>

      <div class="action-group">
        <h4>Configuration Management</h4>
        <div class="button-group">
          <button 
            @click="exportConfiguration" 
            :disabled="productStore.isLoading"
            class="btn btn-info"
          >
            <i class="bi bi-file-earmark-arrow-down"></i>
            Export Configuration
          </button>
          <button 
            @click="importConfiguration" 
            :disabled="productStore.isLoading"
            class="btn btn-warning"
          >
            <i class="bi bi-file-earmark-arrow-up"></i>
            Import Configuration
          </button>
          <input 
            ref="fileInput" 
            type="file" 
            accept=".json" 
            @change="handleFileImport" 
            style="display: none"
          />
        </div>
        <p class="help-text">
          <strong>Export Configuration:</strong> Downloads complete configuration (form + product data)<br>
          <strong>Import Configuration:</strong> Loads configuration from a JSON file
        </p>
      </div>

      <div class="action-group">
        <h4>Reset Options</h4>
        <div class="button-group">
          <button 
            @click="resetToDefaults" 
            :disabled="productStore.isLoading"
            class="btn btn-danger"
          >
            <i class="bi bi-arrow-counterclockwise"></i>
            Reset to Defaults
          </button>
        </div>
        <p class="help-text">
          <strong>Reset to Defaults:</strong> Clears all custom configurations and uses default JSON data
        </p>
      </div>
    </div>

    <div v-if="productStore.error" class="error-message">
      <i class="bi bi-exclamation-triangle"></i>
      {{ productStore.error }}
    </div>

    <div v-if="productStore.isLoading" class="loading">
      <i class="bi bi-arrow-clockwise spin"></i>
      Loading...
    </div>

    <div class="status">
      <h4>Current Status</h4>
      <div class="status-grid">
        <div class="status-item">
          <span class="label">Categories:</span>
          <span class="value">{{ productStore.categories.length }}</span>
        </div>
        <div class="status-item">
          <span class="label">Total Models:</span>
          <span class="value">{{ totalModels }}</span>
        </div>
        <div class="status-item">
          <span class="label">Symptom Areas:</span>
          <span class="value">{{ Object.keys(productStore.symptomsByArea).length }}</span>
        </div>
        <div class="status-item">
          <span class="label">Has Custom Config:</span>
          <span class="value">{{ productStore.hasCustomConfiguration ? 'Yes' : 'No' }}</span>
        </div>
      </div>
    </div>

    <div class="debug-info mt-4">
      <h4>Debug Information</h4>
      <div class="row">
        <div class="col-md-6">
          <h5>Store State</h5>
          <p><strong>Categories:</strong> {{ productStore.categories?.length || 0 }}</p>
          <p><strong>Models:</strong> {{ Object.keys(productStore.categoryModels || {}).length }}</p>
          <p><strong>Symptom Areas:</strong> {{ Object.keys(productStore.symptomsByArea || {}).length }}</p>
          <p><strong>Models with Symptom Areas:</strong> {{ Object.keys(productStore.modelSymptomAreas || {}).length }}</p>
        </div>
        <div class="col-md-6">
          <h5>Sample Data</h5>
          <p><strong>First Category:</strong> {{ productStore.categories?.[0] || 'None' }}</p>
          <p><strong>First Model:</strong> {{ productStore.categoryModels?.[productStore.categories?.[0]]?.[0] || 'None' }}</p>
          <p><strong>Sample Symptom Areas:</strong> {{ productStore.getSymptomAreasForModel(productStore.categoryModels?.[productStore.categories?.[0]]?.[0])?.join(', ') || 'None' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useProductStore } from '@/stores/productStore';

const productStore = useProductStore();
const fileInput = ref(null);

const totalModels = computed(() => {
  return Object.values(productStore.categoryModels).reduce((total, models) => total + models.length, 0);
});

const reloadFromJson = async () => {
  try {
    await productStore.reloadFromJson();
    alert('Data successfully reloaded from JSON file!');
  } catch (error) {
    alert('Failed to reload data: ' + error.message);
  }
};

const exportToJson = () => {
  try {
    productStore.exportToJson();
    alert('Data successfully exported to JSON file!');
  } catch (error) {
    alert('Failed to export data: ' + error.message);
  }
};

const exportConfiguration = () => {
  try {
    const config = productStore.exportCurrentConfiguration();
    const jsonString = JSON.stringify(config, null, 2);
    
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'complete_configuration.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Configuration successfully exported!');
  } catch (error) {
    alert('Failed to export configuration: ' + error.message);
  }
};

const importConfiguration = () => {
  fileInput.value.click();
};

const handleFileImport = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const config = JSON.parse(text);
    
    await productStore.importConfiguration(config);
    alert('Configuration successfully imported!');
  } catch (error) {
    alert('Failed to import configuration: ' + error.message);
  }
  
  // Reset file input
  event.target.value = '';
};

const resetToDefaults = async () => {
  if (confirm('Are you sure you want to reset to defaults? This will clear all custom configurations.')) {
    try {
      productStore.resetToDefaults();
      alert('Successfully reset to defaults!');
    } catch (error) {
      alert('Failed to reset: ' + error.message);
    }
  }
};
</script>

<style scoped>
.json-config-manager {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h3 {
  color: #333;
  margin-bottom: 10px;
}

.header p {
  color: #666;
  margin: 0;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.action-group {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: #f9f9f9;
}

.action-group h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #1e7e34;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #117a8b;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover:not(:disabled) {
  background: #e0a800;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.help-text {
  font-size: 12px;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 5px;
  margin: 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.status {
  margin-top: 30px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: white;
}

.status h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 5px;
}

.status-item .label {
  font-weight: 500;
  color: #333;
}

.status-item .value {
  font-weight: bold;
  color: #007bff;
}

@media (max-width: 600px) {
  .button-group {
    flex-direction: column;
  }
  
  .btn {
    justify-content: center;
  }
  
  .status-grid {
    grid-template-columns: 1fr;
  }
}
</style> 