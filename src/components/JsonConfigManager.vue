<template>
  <div class="json-config-manager">
    <div class="config-header">
      <h3>JSON Configuration Manager</h3>
      <div class="config-status">
        <span class="status-indicator" :class="{ active: hasCustomConfiguration }">
          {{ hasCustomConfiguration ? 'Custom Config' : 'Default Config' }}
        </span>
      </div>
    </div>

    <div class="config-actions">
      <div class="action-group">
        <h4>Import Configuration</h4>
        <div class="import-section">
          <textarea
            v-model="importJson"
            placeholder="Paste JSON configuration here..."
            class="json-textarea"
            rows="10"
          ></textarea>
          <div class="import-buttons">
            <button @click="importConfiguration" :disabled="!importJson.trim() || isLoading" class="btn btn-primary">
              {{ isLoading ? 'Importing...' : 'Import Configuration' }}
            </button>
            <button @click="importJson = ''" class="btn btn-secondary">Clear</button>
          </div>
        </div>
      </div>

      <div class="action-group">
        <h4>Export Configuration</h4>
        <div class="export-section">
          <div class="export-options">
            <label>
              <input type="checkbox" v-model="exportFormConfig" />
              Include Form Configuration
            </label>
            <label>
              <input type="checkbox" v-model="exportProductMapping" />
              Include Product Mapping
            </label>
          </div>
          <div class="export-buttons">
            <button @click="exportConfiguration" :disabled="!exportFormConfig && !exportProductMapping" class="btn btn-primary">
              Export Configuration
            </button>
            <button @click="copyToClipboard" :disabled="!exportedJson" class="btn btn-secondary">
              Copy to Clipboard
            </button>
          </div>
        </div>
      </div>

      <div class="action-group">
        <h4>Configuration Management</h4>
        <div class="management-buttons">
          <button @click="resetToDefaults" class="btn btn-warning">
            Reset to Defaults
          </button>
          <button @click="exportDefaultConfiguration" class="btn btn-secondary">
            Export Default Configuration
          </button>
        </div>
      </div>
    </div>

    <div v-if="exportedJson" class="exported-json">
      <h4>Exported Configuration</h4>
      <pre class="json-display">{{ exportedJson }}</pre>
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
const importJson = ref('');
const exportedJson = ref('');
const exportFormConfig = ref(true);
const exportProductMapping = ref(true);
const error = ref('');
const successMessage = ref('');

// Computed properties
const isLoading = computed(() => productStore.isLoading);
const hasCustomConfiguration = computed(() => productStore.hasCustomConfiguration);

// Methods
const importConfiguration = async () => {
  try {
    error.value = '';
    successMessage.value = '';

    if (!importJson.value.trim()) {
      error.value = 'Please provide JSON configuration to import';
      return;
    }

    const configData = JSON.parse(importJson.value);
    
    // Validate configuration structure
    if (!configData.formConfig && !configData.productMapping) {
      error.value = 'Invalid configuration format. Must contain formConfig and/or productMapping';
      return;
    }

    await productStore.importConfiguration(configData);
    
    successMessage.value = 'Configuration imported successfully!';
    importJson.value = '';
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (err) {
    error.value = `Import failed: ${err.message}`;
    console.error('Import error:', err);
  }
};

const exportConfiguration = () => {
  try {
    error.value = '';
    
    const configData = {};
    
    if (exportFormConfig.value) {
      configData.formConfig = productStore.formConfig || productStore.exportCurrentConfiguration().formConfig;
    }
    
    if (exportProductMapping.value) {
      configData.productMapping = productStore.productMapping || productStore.exportCurrentConfiguration().productMapping;
    }
    
    exportedJson.value = JSON.stringify(configData, null, 2);
    successMessage.value = 'Configuration exported successfully!';
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (err) {
    error.value = `Export failed: ${err.message}`;
    console.error('Export error:', err);
  }
};

const exportDefaultConfiguration = () => {
  try {
    error.value = '';
    
    const defaultConfig = productStore.exportCurrentConfiguration();
    exportedJson.value = JSON.stringify(defaultConfig, null, 2);
    
    successMessage.value = 'Default configuration exported successfully!';
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (err) {
    error.value = `Export failed: ${err.message}`;
    console.error('Export error:', err);
  }
};

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(exportedJson.value);
    successMessage.value = 'Configuration copied to clipboard!';
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (err) {
    error.value = 'Failed to copy to clipboard';
    console.error('Clipboard error:', err);
  }
};

const resetToDefaults = async () => {
  try {
    error.value = '';
    successMessage.value = '';
    
    if (confirm('Are you sure you want to reset to default configuration? This will clear all custom settings.')) {
      productStore.resetToDefaults();
      exportedJson.value = '';
      successMessage.value = 'Configuration reset to defaults successfully!';
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        successMessage.value = '';
      }, 3000);
    }
  } catch (err) {
    error.value = `Reset failed: ${err.message}`;
    console.error('Reset error:', err);
  }
};

// Load configuration on mount
onMounted(async () => {
  await productStore.loadConfiguration();
});
</script>

<style scoped>
.json-config-manager {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e0e0e0;
}

.config-header h3 {
  margin: 0;
  color: #333;
}

.config-status {
  display: flex;
  align-items: center;
}

.status-indicator {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.9em;
  font-weight: 500;
  background-color: #f0f0f0;
  color: #666;
}

.status-indicator.active {
  background-color: #4CAF50;
  color: white;
}

.config-actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.action-group {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.action-group h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.1em;
}

.import-section,
.export-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.json-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  resize: vertical;
  min-height: 120px;
}

.import-buttons,
.export-buttons,
.management-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.export-options label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9em;
  cursor: pointer;
}

.export-options input[type="checkbox"] {
  margin: 0;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #545b62;
}

.btn-warning {
  background-color: #ffc107;
  color: #212529;
}

.btn-warning:hover:not(:disabled) {
  background-color: #e0a800;
}

.exported-json {
  margin-top: 20px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
}

.exported-json h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.json-display {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 15px;
  font-family: 'Courier New', monospace;
  font-size: 0.85em;
  line-height: 1.4;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 400px;
  overflow-y: auto;
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
  .config-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .import-buttons,
  .export-buttons,
  .management-buttons {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style> 