<template>
  <div class="csv-demo-view">
    <div class="demo-header">
      <h2>Product Configuration Management</h2>
      <p class="demo-description">
        Manage product categories, models, and form configuration through a unified JSON-based system.
      </p>
    </div>

    <div class="demo-content">
      <div class="config-section">
        <h3>Configuration Management</h3>
        <div class="config-status">
          <div class="status-card">
            <div class="status-icon" :class="{ active: hasCustomConfiguration }">
              <i class="bi" :class="hasCustomConfiguration ? 'bi-gear-fill' : 'bi-gear'"></i>
            </div>
            <div class="status-info">
              <h4>{{ hasCustomConfiguration ? 'Custom Configuration' : 'Default Configuration' }}</h4>
              <p>{{ hasCustomConfiguration ? 'Using custom product mapping and form configuration' : 'Using default product mapping and form configuration' }}</p>
            </div>
          </div>
          
          <div class="status-stats">
            <div class="stat-item">
              <span class="stat-label">Categories:</span>
              <span class="stat-value">{{ categories.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total Models:</span>
              <span class="stat-value">{{ totalModels }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Symptom Areas:</span>
              <span class="stat-value">{{ Object.keys(symptomsByArea).length }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="managers-section">
        <div class="manager-tabs">
          <button 
            @click="activeTab = 'json'" 
            class="tab-button" 
            :class="{ active: activeTab === 'json' }"
          >
            <i class="bi bi-file-earmark-code"></i>
            JSON Configuration
          </button>
          <button 
            @click="activeTab = 'categories'" 
            class="tab-button" 
            :class="{ active: activeTab === 'categories' }"
          >
            <i class="bi bi-diagram-3"></i>
            Product Categories
          </button>
        </div>

        <div class="tab-content">
          <div v-if="activeTab === 'json'" class="tab-panel">
            <JsonConfigManager />
          </div>
          <div v-if="activeTab === 'categories'" class="tab-panel">
            <ProductCategoryManager />
          </div>
        </div>
      </div>

      <div class="info-section">
        <h3>System Information</h3>
        <div class="info-grid">
          <div class="info-card">
            <h4>Configuration Status</h4>
            <ul>
              <li><strong>Form Config:</strong> {{ formConfig ? 'Loaded' : 'Using Defaults' }}</li>
              <li><strong>Product Mapping:</strong> {{ productMapping ? 'Loaded' : 'Using Defaults' }}</li>
              <li><strong>Storage:</strong> {{ hasCustomConfiguration ? 'Persistent' : 'Default' }}</li>
            </ul>
          </div>
          
          <div class="info-card">
            <h4>Available Actions</h4>
            <ul>
              <li>Import/Export JSON configuration</li>
              <li>Manage product categories and models</li>
              <li>Configure symptom areas and symptoms</li>
              <li>Reset to default configuration</li>
            </ul>
          </div>
          
          <div class="info-card">
            <h4>Data Structure</h4>
            <ul>
              <li><strong>Categories:</strong> Product categories (Active_Speaker, Processor, etc.)</li>
              <li><strong>Models:</strong> Specific product models within categories</li>
              <li><strong>Symptom Areas:</strong> Problem categories (Audio, Power, etc.)</li>
              <li><strong>Symptoms:</strong> Specific problems within areas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useProductStore } from '@/stores/productStore';
import JsonConfigManager from '@/components/JsonConfigManager.vue';
import ProductCategoryManager from '@/components/ProductCategoryManager.vue';

const productStore = useProductStore();

// Reactive data
const activeTab = ref('json');
const error = ref('');

// Computed properties
const categories = computed(() => productStore.categories);
const symptomsByArea = computed(() => productStore.symptomsByArea);
const formConfig = computed(() => productStore.formConfig);
const productMapping = computed(() => productStore.productMapping);
const hasCustomConfiguration = computed(() => productStore.hasCustomConfiguration);

const totalModels = computed(() => {
  return categories.value.reduce((total, category) => {
    return total + productStore.getModelsForCategory(category).length;
  }, 0);
});

// Methods
const loadConfiguration = async () => {
  try {
    await productStore.loadConfiguration();
  } catch (err) {
    error.value = 'Failed to load configuration: ' + err.message;
  }
};

// Load configuration on mount
onMounted(() => {
  loadConfiguration();
});
</script>

<style scoped>
.csv-demo-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.demo-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.demo-header h2 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 2.2em;
}

.demo-description {
  margin: 0;
  color: #666;
  font-size: 1.1em;
  line-height: 1.5;
}

.demo-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.config-section {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.config-section h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.4em;
}

.config-status {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 30px;
  align-items: center;
}

.status-card {
  display: flex;
  align-items: center;
  gap: 20px;
}

.status-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5em;
  color: #6c757d;
  transition: all 0.3s ease;
}

.status-icon.active {
  background: #28a745;
  color: white;
}

.status-info h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 1.2em;
}

.status-info p {
  margin: 0;
  color: #666;
  font-size: 0.95em;
}

.status-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  min-width: 100px;
}

.stat-label {
  display: block;
  font-size: 0.85em;
  color: #666;
  margin-bottom: 5px;
}

.stat-value {
  display: block;
  font-size: 1.5em;
  font-weight: bold;
  color: #333;
}

.managers-section {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
}

.manager-tabs {
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.tab-button {
  flex: 1;
  padding: 15px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  color: #666;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.tab-button:hover {
  background: #e9ecef;
  color: #333;
}

.tab-button.active {
  background: white;
  color: #007bff;
  border-bottom: 3px solid #007bff;
}

.tab-button i {
  font-size: 1.1em;
}

.tab-content {
  min-height: 500px;
}

.tab-panel {
  padding: 0;
}

.info-section {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.info-section h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.4em;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.info-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.info-card h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.1em;
  border-bottom: 2px solid #007bff;
  padding-bottom: 8px;
}

.info-card ul {
  margin: 0;
  padding-left: 20px;
  color: #555;
  line-height: 1.6;
}

.info-card li {
  margin-bottom: 8px;
}

.info-card strong {
  color: #333;
}

.error-message {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  font-size: 0.95em;
}

@media (max-width: 768px) {
  .csv-demo-view {
    padding: 15px;
  }
  
  .demo-header h2 {
    font-size: 1.8em;
  }
  
  .config-status {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .status-stats {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .stat-item {
    min-width: 80px;
  }
  
  .manager-tabs {
    flex-direction: column;
  }
  
  .tab-button {
    padding: 12px 15px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .status-card {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .status-stats {
    flex-direction: column;
    gap: 10px;
  }
  
  .stat-item {
    min-width: auto;
  }
}
</style> 