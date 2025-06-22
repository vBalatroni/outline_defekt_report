import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { loadFormConfig, saveFormConfig, loadProductMapping, saveProductMapping } from '@/utils/storageUtils';
import { parseFormConfigJson, mergeFormConfig } from '@/utils/formConfigUtils';
import productDataJson from '@/assets/productData.json';

// Use the imported JSON data as the default product mapping
const defaultProductMapping = productDataJson;

// Default form configuration
const defaultFormConfig = {
  dropdowns: {
    symptomOccurrence: {
      name: 'Symptom Occurrence',
      values: defaultProductMapping.symptomOccurrences
    },
    mainsVoltageType: {
      name: 'Mains Voltage Type',
      values: defaultProductMapping.mainVoltageTypes
    },
    mainsVoltageRange: {
      name: 'Mains Voltage Range',
      dependentOn: 'mainsVoltageType',
      dependentValues: defaultProductMapping.mainVoltageRanges
    },
    outputLoad: {
      name: 'Output Load',
      values: defaultProductMapping.outputLoadOptions
    },
    loadConnectionMode: {
      name: 'Load Connection Mode',
      values: defaultProductMapping.loadConnectionModes
    },
    installationType: {
      name: 'Installation Type',
      values: defaultProductMapping.installationTypes
    }
  },
  fieldVisibility: {},
  categoryConfigs: {
    'Active Speaker': {
      visibleFields: {
        symptomInfo: ['symptomArea', 'symptomFound', 'symptomOccurrence'],
        technicalInfo: ['mainsVoltageType', 'mainsVoltageRange', 'outputLoad', 'loadConnectionMode'],
        additionalInfo: ['installationType', 'note', 'importantInformation']
      }
    },
    'Passive Speaker': {
      visibleFields: {
        symptomInfo: ['symptomArea', 'symptomFound', 'symptomOccurrence'],
        additionalInfo: ['installationType', 'note', 'importantInformation']
      }
    },
    'Processor': {
      visibleFields: {
        symptomInfo: ['symptomArea', 'symptomFound', 'symptomOccurrence'],
        technicalInfo: ['mainsVoltageType', 'mainsVoltageRange'],
        additionalInfo: ['installationType', 'note', 'importantInformation']
      }
    },
    'Rack Amplifier': {
      visibleFields: {
        symptomInfo: ['symptomArea', 'symptomFound', 'symptomOccurrence'],
        technicalInfo: ['mainsVoltageType', 'mainsVoltageRange', 'outputLoad', 'loadConnectionMode'],
        additionalInfo: ['installationType', 'note', 'importantInformation']
      }
    },
    'Measurement System': {
      visibleFields: {
        symptomInfo: ['symptomArea', 'symptomFound', 'symptomOccurrence'],
        technicalInfo: ['mainsVoltageType', 'mainsVoltageRange'],
        additionalInfo: ['installationType', 'note', 'importantInformation']
      }
    }
  },
  conditionalOptions: {}
};

export const useProductStore = defineStore('product', () => {
  // State
  const formConfig = ref(null);
  const productMapping = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  // Getters
  const categories = computed(() => {
    return productMapping.value?.categories || defaultProductMapping.categories;
  });

  const categoryModels = computed(() => {
    return productMapping.value?.categoryModels || defaultProductMapping.categoryModels;
  });

  const modelSymptomAreas = computed(() => {
    return productMapping.value?.modelSymptomAreas || defaultProductMapping.modelSymptomAreas;
  });

  const symptomsByArea = computed(() => {
    return productMapping.value?.symptomsByArea || defaultProductMapping.symptomsByArea;
  });

  const dropdowns = computed(() => {
    return formConfig.value?.dropdowns || defaultFormConfig.dropdowns;
  });

  const fieldVisibility = computed(() => {
    return formConfig.value?.fieldVisibility || defaultFormConfig.fieldVisibility;
  });

  const categoryConfigs = computed(() => {
    return formConfig.value?.categoryConfigs || defaultFormConfig.categoryConfigs;
  });

  const conditionalOptions = computed(() => {
    return formConfig.value?.conditionalOptions || defaultFormConfig.conditionalOptions;
  });

  const isConfigured = computed(() => {
    return formConfig.value !== null || productMapping.value !== null;
  });

  const hasCustomConfiguration = computed(() => {
    return formConfig.value !== null && productMapping.value !== null;
  });

  // Actions
  const loadConfiguration = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      // Load from storage
      const storedFormConfig = loadFormConfig();
      const storedProductMapping = loadProductMapping();

      if (storedFormConfig) {
        formConfig.value = storedFormConfig;
      }

      if (storedProductMapping) {
        productMapping.value = storedProductMapping;
      }

      console.log('Configuration loaded:', { 
        formConfig: formConfig.value, 
        productMapping: productMapping.value,
        usingDefaults: !storedFormConfig && !storedProductMapping
      });
    } catch (err) {
      error.value = 'Failed to load configuration: ' + err.message;
      console.error('Error loading configuration:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const updateFormConfig = async (newConfig) => {
    try {
      isLoading.value = true;
      error.value = null;

      // Parse and merge configuration
      const parsedConfig = parseFormConfigJson(newConfig);
      const mergedConfig = mergeFormConfig(parsedConfig);

      // Update state
      formConfig.value = mergedConfig;

      // Save to storage
      saveFormConfig(mergedConfig);

      console.log('Form configuration updated:', mergedConfig);
    } catch (err) {
      error.value = 'Failed to update form configuration: ' + err.message;
      console.error('Error updating form configuration:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const updateProductMapping = async (newMapping) => {
    try {
      isLoading.value = true;
      error.value = null;

      // Update state
      productMapping.value = newMapping;

      // Save to storage
      saveProductMapping(newMapping);

      console.log('Product mapping updated:', newMapping);
    } catch (err) {
      error.value = 'Failed to update product mapping: ' + err.message;
      console.error('Error updating product mapping:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const updateCompleteConfiguration = async (configData) => {
    try {
      isLoading.value = true;
      error.value = null;

      // Update both form config and product mapping
      if (configData.formConfig) {
        await updateFormConfig(configData.formConfig);
      }

      if (configData.productMapping) {
        await updateProductMapping(configData.productMapping);
      }

      console.log('Complete configuration updated:', configData);
    } catch (err) {
      error.value = 'Failed to update complete configuration: ' + err.message;
      console.error('Error updating complete configuration:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const getModelsForCategory = (category) => {
    return categoryModels.value[category] || [];
  };

  const getSymptomAreasForModel = (model) => {
    return modelSymptomAreas.value[model] || [];
  };

  const getSymptomsForArea = (area) => {
    return symptomsByArea.value[area] || [];
  };

  const getDropdownValues = (dropdownName, formData = {}) => {
    const dropdown = dropdowns.value[dropdownName];
    if (!dropdown) return [];

    let values = dropdown.values || [];

    // Handle dependent dropdowns
    if (dropdown.dependentOn && dropdown.dependentValues) {
      const dependentValue = formData[dropdown.dependentOn];
      if (dependentValue && dropdown.dependentValues[dependentValue]) {
        values = dropdown.dependentValues[dependentValue];
      }
    }

    // Handle conditional options
    if (conditionalOptions.value[dropdownName]) {
      values = filterConditionalOptions(values, conditionalOptions.value[dropdownName], formData);
    }

    return values;
  };

  const isFieldVisible = (model, field, formData = {}) => {
    const visibilityRule = fieldVisibility.value[model]?.[field];
    if (!visibilityRule) return true;

    // Check basic show/hide
    if (!visibilityRule.show) return false;

    // Check dependency conditions
    if (visibilityRule.dependsOn) {
      const dependsValue = formData[visibilityRule.dependsOn];
      if (dependsValue !== visibilityRule.dependsValue) return false;
    }

    // Check complex conditions
    if (visibilityRule.conditions) {
      return visibilityRule.conditions.every(condition => {
        const { field: conditionField, operator, value } = condition;
        const fieldValue = formData[conditionField];

        switch (operator) {
          case 'equals':
            return fieldValue === value;
          case 'not_equals':
            return fieldValue !== value;
          case 'contains':
            return fieldValue && fieldValue.includes(value);
          case 'in':
            return Array.isArray(value) && value.includes(fieldValue);
          case 'exists':
            return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
          default:
            return true;
        }
      });
    }

    return true;
  };

  const getCategoryVisibleFields = (category) => {
    return categoryConfigs.value[category]?.visibleFields || {};
  };

  const resetToDefaults = () => {
    formConfig.value = null;
    productMapping.value = null;
    error.value = null;
    
    // Clear from storage
    saveFormConfig(null);
    saveProductMapping(null);
    
    console.log('Reset to default configuration');
  };

  const exportCurrentConfiguration = () => {
    const configData = {
      formConfig: formConfig.value || defaultFormConfig,
      productMapping: productMapping.value || defaultProductMapping
    };
    
    return configData;
  };

  const importConfiguration = async (configData) => {
    try {
      isLoading.value = true;
      error.value = null;

      if (configData.productMapping) {
        await updateProductMapping(configData.productMapping);
      }

      if (configData.formConfig) {
        await updateFormConfig(configData.formConfig);
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

  // Helper function for conditional options
  const filterConditionalOptions = (options, conditions, formData) => {
    return options.filter(option => {
      const optionConditions = conditions[option];
      if (!optionConditions) return true;

      return optionConditions.every(condition => {
        const { field, operator, value } = condition;
        const fieldValue = formData[field];

        switch (operator) {
          case 'equals':
            return fieldValue === value;
          case 'not_equals':
            return fieldValue !== value;
          case 'contains':
            return fieldValue && fieldValue.includes(value);
          case 'not_contains':
            return !fieldValue || !fieldValue.includes(value);
          case 'in':
            return Array.isArray(value) && value.includes(fieldValue);
          case 'not_in':
            return !Array.isArray(value) || !value.includes(fieldValue);
          case 'exists':
            return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
          case 'not_exists':
            return fieldValue === undefined || fieldValue === null || fieldValue === '';
          default:
            return true;
        }
      });
    });
  };

  // Method to reload data from JSON file
  const reloadFromJson = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      // Reset to default JSON data
      productMapping.value = defaultProductMapping;
      
      // Clear any custom configuration from storage
      saveProductMapping(null);
      
      console.log('Data reloaded from JSON file:', defaultProductMapping);
    } catch (err) {
      error.value = 'Failed to reload from JSON: ' + err.message;
      console.error('Error reloading from JSON:', err);
    } finally {
      isLoading.value = false;
    }
  };

  // Method to export current data to JSON format
  const exportToJson = () => {
    try {
      const currentData = productMapping.value || defaultProductMapping;
      const jsonString = JSON.stringify(currentData, null, 2);
      
      // Create a blob and download it
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

  return {
    // State
    formConfig,
    productMapping,
    isLoading,
    error,

    // Getters
    categories,
    categoryModels,
    modelSymptomAreas,
    symptomsByArea,
    dropdowns,
    fieldVisibility,
    categoryConfigs,
    conditionalOptions,
    isConfigured,
    hasCustomConfiguration,

    // Actions
    loadConfiguration,
    updateFormConfig,
    updateProductMapping,
    updateCompleteConfiguration,
    getModelsForCategory,
    getSymptomAreasForModel,
    getSymptomsForArea,
    getDropdownValues,
    isFieldVisible,
    getCategoryVisibleFields,
    resetToDefaults,
    exportCurrentConfiguration,
    importConfiguration,
    reloadFromJson,
    exportToJson
  };
}); 