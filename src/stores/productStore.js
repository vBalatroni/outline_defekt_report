import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { loadProductMapping, saveProductMapping } from '@/utils/storageUtils';
import productDataJson from '@/assets/productData.json';

const defaultProductMapping = productDataJson;

// Template per i dati generali del form, per poterli resettare facilmente
const getGeneralDataTemplate = () => ({
  companyData: {
    customerNumber: { id: "customerNumber", label: "Customer Number", value: "", type: "text", isRequired: true },
    companyName: { id: "companyName", label: "Company Name", value: "", type: "text", isRequired: true },
    contactPerson: { id: "contactPerson", label: "Contact Person", value: "", type: "text", isRequired: true },
    email: { id: "email", label: "Email", value: "", type: "email", isRequired: true },
    phone: { id: "phone", label: "Phone", value: "", type: "tel", isRequired: true }
  },
  freightForwarderData: {
    name: { id: "name", label: "Name", value: "", type: "text", isRequired: false },
    contactPerson: { id: "contactPerson", label: "Contact Person", value: "", type: "text", isRequired: false },
    phone: { id: "phone", label: "Phone", value: "", type: "tel", isRequired: false },
    email: { id: "email", label: "Email", value: "", type: "email", isRequired: false }
  },
  companyAddress: {
    street: { id: "street", label: "Street", value: "", type: "text", isRequired: true },
    city: { id: "city", label: "City", value: "", type: "text", isRequired: true },
    zip: { id: "zip", label: "ZIP Code", value: "", type: "text", isRequired: true },
    country: { id: "country", label: "Country", value: "", type: "text", isRequired: true }
  },
  otherReturnAddress: {
    street: { id: "street", label: "Street", value: "", type: "text", isRequired: true },
    city: { id: "city", label: "City", value: "", type: "text", isRequired: true },
    zip: { id: "zip", label: "ZIP Code", value: "", type: "text", isRequired: true },
    country: { id: "country", label: "Country", value: "", type: "text", isRequired: true }
  }
});

export const useProductStore = defineStore('product', () => {
  // STATE
  const productMapping = ref(null);
  const isLoading = ref(false);
  const error = ref(null);
  
  // State for the multi-step form
  const formState = ref({
    isConfirmed: false,
    sessionId: null, // Add sessionId to the form state
    generalData: getGeneralDataTemplate(),
    savedProducts: [],
  });


  // GETTERS
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

      // STEP 1: Always load the fresh default configuration from the file.
      // We are commenting out the localStorage logic to avoid stale data during development.
      let currentMapping = JSON.parse(JSON.stringify(defaultProductMapping));
      
      /*
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
      */
      
      productMapping.value = currentMapping;
      
      console.log('Configuration loaded directly from file:', { 
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

  const getCategoryVisibleFields = (category) => {
    if (!productMapping.value || !productMapping.value.modelFieldConfigs) {
      return {};
    }
  
    const allFields = Object.values(productMapping.value.modelFieldConfigs).flat();
    const visibleFields = {};
  
    allFields.forEach(field => {
      if (!field.conditions || field.conditions.length === 0) {
        if (!visibleFields[field.section]) visibleFields[field.section] = [];
        visibleFields[field.section].push(field.id);
      } else {
        const isVisible = field.conditions.some(condition => 
          condition.field === 'productCategory' && condition.value === category
        );
        if (isVisible) {
          if (!visibleFields[field.section]) visibleFields[field.section] = [];
          visibleFields[field.section].push(field.id);
        }
      }
    });
  
    return visibleFields;
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

  // ACTIONS FOR THE FORM
  const setConfirmation = (value) => {
    formState.value.isConfirmed = value;
  };

  const addProduct = (product) => {
    formState.value.savedProducts.push(product);
  };
  
  const updateProduct = (index, product) => {
    if (formState.value.savedProducts[index]) {
      formState.value.savedProducts[index] = product;
    }
  };

  const deleteProduct = (index) => {
    formState.value.savedProducts.splice(index, 1);
  };

  const resetForm = () => {
    formState.value.isConfirmed = false;
    formState.value.sessionId = null; // Reset sessionId
    formState.value.generalData = getGeneralDataTemplate();
    formState.value.savedProducts = [];
    console.log('Form state has been reset.');
  };

  const startSession = () => {
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      formState.value.sessionId = newSessionId;
      sessionStorage.setItem('defekt_report_session_id', newSessionId);
      console.log('Form session started:', newSessionId);
  };

  const loadSession = () => {
      const storedSessionId = sessionStorage.getItem('defekt_report_session_id');
      if (storedSessionId) {
          formState.value.sessionId = storedSessionId;
          console.log('Form session loaded from sessionStorage:', storedSessionId);
      }
  };

  return {
    // State
    productMapping,
    isLoading,
    error,
    formState,

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
    getCategoryVisibleFields,
    resetToDefaults,
    exportToJson,
    importConfiguration,
    getSymptomSetSymptoms,
    addSymptomSet,
    updateSymptomSet,
    deleteSymptomSet,
    
    // Form Actions
    setConfirmation,
    addProduct,
    updateProduct,
    deleteProduct,
    resetForm,
    startSession,
    loadSession
  };
}); 