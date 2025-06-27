import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { loadProductMapping, saveProductMapping } from '@/utils/storageUtils';
import productDataJson from '@/assets/productData.json';

const defaultProductMapping = productDataJson;

export const useProductStore = defineStore('product', () => {
  // State
  const productMapping = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  // Getters
  const categories = computed(() => {
    return productMapping.value?.categories || [];
  });

  const categoryModels = computed(() => {
    return productMapping.value?.categoryModels || {};
  });

  const symptomSets = computed(() => {
    return productMapping.value?.symptomSets || {};
  });

  const defectSections = computed(() => {
    if (!productMapping.value) return [];
    const reservedKeys = [
      'categories', 
      'categoryModels', 
      'modelFieldConfigs', 
      'symptomSets', 
      'basicInfo', 
      'categoryConfigs'
    ];
    return Object.keys(productMapping.value).filter(key => !reservedKeys.includes(key));
  });

  const symptomSetOptions = computed(() => {
    if (!productMapping.value || !productMapping.value.symptomSets) {
      return [];
    }
    return Object.entries(productMapping.value.symptomSets).map(([key, value]) => ({
      value: key,
      label: value.label
    }));
  });

  const isConfigured = computed(() => {
    return productMapping.value !== null;
  });

  // Actions
  const loadConfiguration = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      let currentMapping = JSON.parse(JSON.stringify(defaultProductMapping));
      const storedProductMapping = loadProductMapping();

      if (storedProductMapping) {
        Object.keys(storedProductMapping).forEach(key => {
          if (storedProductMapping[key] && typeof storedProductMapping[key] === 'object' && !Array.isArray(storedProductMapping[key])) {
            currentMapping[key] = { ...currentMapping[key], ...storedProductMapping[key] };
          } else if (storedProductMapping[key] !== undefined) {
            currentMapping[key] = storedProductMapping[key];
          }
        });
      }
      
      productMapping.value = currentMapping;
      
      console.log('Configuration loaded:', { 
        productMapping: productMapping.value
      });
    } catch (err) {
      error.value = 'Failed to load configuration: ' + err.message;
      console.error('Error loading configuration:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const updateProductMapping = async (newMapping) => {
    try {
      isLoading.value = true;
      error.value = null;
      productMapping.value = newMapping;
      saveProductMapping(newMapping);
      console.log('Product mapping updated:', newMapping);
    } catch (err) {
      error.value = 'Failed to update product mapping: ' + err.message;
      console.error('Error updating product mapping:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const updateModelFieldConfigs = (newConfigs) => {
    if (productMapping.value) {
      productMapping.value.modelFieldConfigs = newConfigs;
    }
  };

  const getModelsForCategory = (category) => {
    return categoryModels.value[category] || [];
  };

  const getSymptomSetSymptoms = (setKey) => {
    if (!productMapping.value || !productMapping.value.symptomSets || !productMapping.value.symptomSets[setKey]) {
      return [];
    }
    return productMapping.value.symptomSets[setKey].symptoms || [];
  };

  const getModelFields = (modelName) => {
    if (!productMapping.value || !productMapping.value.modelFieldConfigs) {
      return [];
    }
    return productMapping.value.modelFieldConfigs[modelName] || [];
  };

  const addSymptomSet = (key, setData) => {
    if (productMapping.value.symptomSets[key]) {
      return false; // Key already exists
    }
    const newMapping = JSON.parse(JSON.stringify(productMapping.value));
    newMapping.symptomSets[key] = setData;
    productMapping.value = newMapping;
    saveProductMapping(newMapping);
    return true;
  };

  const updateSymptomSet = (originalKey, newKey, setData) => {
    const newMapping = JSON.parse(JSON.stringify(productMapping.value));
    if (originalKey !== newKey && newMapping.symptomSets[newKey]) {
      return false; // New key already exists
    }
    delete newMapping.symptomSets[originalKey];
    newMapping.symptomSets[newKey] = setData;
    productMapping.value = newMapping;
    saveProductMapping(newMapping);
    return true;
  };

  const deleteSymptomSet = (key) => {
    const newMapping = JSON.parse(JSON.stringify(productMapping.value));
    delete newMapping.symptomSets[key];
    productMapping.value = newMapping;
    saveProductMapping(newMapping);
  };

  const resetToDefaults = () => {
    productMapping.value = null;
    error.value = null;
    saveProductMapping(null);
    console.log('Reset to default configuration');
  };

  const exportToJson = () => {
    try {
      const currentData = productMapping.value || defaultProductMapping;
      const jsonString = JSON.stringify(currentData, null, 2);
      
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'productData.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Data exported to JSON file');
      return jsonString;
    } catch (err) {
      error.value = 'Failed to export to JSON: ' + err.message;
      console.error('Error exporting to JSON:', err);
      throw err;
    }
  };
  
  const importConfiguration = async (configData) => {
    try {
      isLoading.value = true;
      error.value = null;

      if (configData) {
        await updateProductMapping(configData);
      }

      console.log('Configuration imported successfully:', configData);
    } catch (err) {
      error.value = 'Failed to import configuration: ' + err.message;
      console.error('Error importing configuration:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    // State
    productMapping,
    isLoading,
    error,

    // Getters
    categories,
    categoryModels,
    isConfigured,
    symptomSets,
    symptomSetOptions,
    defectSections,

    // Actions
    loadConfiguration,
    updateProductMapping,
    updateModelFieldConfigs,
    getModelsForCategory,
    getModelFields,
    resetToDefaults,
    exportToJson,
    importConfiguration,
    getSymptomSetSymptoms,
    addSymptomSet,
    updateSymptomSet,
    deleteSymptomSet,
  };
}); 