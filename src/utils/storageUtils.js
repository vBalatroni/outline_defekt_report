/**
 * Utility functions for managing storage of form configuration and product mapping data
 */

const STORAGE_KEYS = {
  FORM_CONFIG: 'formConfig',
  PRODUCT_MAPPING: 'productMapping',
  UPLOADED_CONFIGS: 'uploadedConfigs',
  UPLOADED_MAPPINGS: 'uploadedMappings'
};

/**
 * Save form configuration to localStorage
 * @param {Object} config - Form configuration object
 */
export function saveFormConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEYS.FORM_CONFIG, JSON.stringify(config));
  } catch (error) {
    console.error('Error saving form configuration:', error);
  }
}

/**
 * Load form configuration from localStorage
 * @returns {Object|null} Form configuration object or null if not found
 */
export function loadFormConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FORM_CONFIG);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading form configuration:', error);
    return null;
  }
}

/**
 * Save product mapping to localStorage
 * @param {Object} mapping - Product mapping object
 */
export function saveProductMapping(mapping) {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCT_MAPPING, JSON.stringify(mapping));
  } catch (error) {
    console.error('Error saving product mapping:', error);
  }
}

/**
 * Load product mapping from localStorage
 * @returns {Object|null} Product mapping object or null if not found
 */
export function loadProductMapping() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PRODUCT_MAPPING);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading product mapping:', error);
    return null;
  }
}

/**
 * Save uploaded configuration file
 * @param {string} filename - Name of the uploaded file
 * @param {Object} config - Configuration data
 */
export function saveUploadedConfig(filename, config) {
  try {
    const uploaded = getUploadedConfigs();
    uploaded[filename] = {
      data: config,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.UPLOADED_CONFIGS, JSON.stringify(uploaded));
  } catch (error) {
    console.error('Error saving uploaded configuration:', error);
  }
}

/**
 * Get all uploaded configuration files
 * @returns {Object} Object with uploaded configurations
 */
export function getUploadedConfigs() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.UPLOADED_CONFIGS);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading uploaded configurations:', error);
    return {};
  }
}

/**
 * Delete uploaded configuration file
 * @param {string} filename - Name of the file to delete
 */
export function deleteUploadedConfig(filename) {
  try {
    const uploaded = getUploadedConfigs();
    delete uploaded[filename];
    localStorage.setItem(STORAGE_KEYS.UPLOADED_CONFIGS, JSON.stringify(uploaded));
  } catch (error) {
    console.error('Error deleting uploaded configuration:', error);
  }
}

/**
 * Save uploaded product mapping file
 * @param {string} filename - Name of the uploaded file
 * @param {Object} mapping - Mapping data
 */
export function saveUploadedMapping(filename, mapping) {
  try {
    const uploaded = getUploadedMappings();
    uploaded[filename] = {
      data: mapping,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.UPLOADED_MAPPINGS, JSON.stringify(uploaded));
  } catch (error) {
    console.error('Error saving uploaded mapping:', error);
  }
}

/**
 * Get all uploaded product mapping files
 * @returns {Object} Object with uploaded mappings
 */
export function getUploadedMappings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.UPLOADED_MAPPINGS);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading uploaded mappings:', error);
    return {};
  }
}

/**
 * Delete uploaded product mapping file
 * @param {string} filename - Name of the file to delete
 */
export function deleteUploadedMapping(filename) {
  try {
    const uploaded = getUploadedMappings();
    delete uploaded[filename];
    localStorage.setItem(STORAGE_KEYS.UPLOADED_MAPPINGS, JSON.stringify(uploaded));
  } catch (error) {
    console.error('Error deleting uploaded mapping:', error);
  }
}

/**
 * Clear all stored data
 */
export function clearAllStorage() {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
}

/**
 * Get storage usage information
 * @returns {Object} Storage usage stats
 */
export function getStorageUsage() {
  try {
    const stats = {};
    let totalSize = 0;
    
    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      const data = localStorage.getItem(storageKey);
      const size = data ? new Blob([data]).size : 0;
      stats[key] = {
        size: size,
        sizeKB: (size / 1024).toFixed(2)
      };
      totalSize += size;
    });
    
    stats.total = {
      size: totalSize,
      sizeKB: (totalSize / 1024).toFixed(2)
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting storage usage:', error);
    return {};
  }
}

/**
 * Export all stored data as JSON
 * @returns {Object} All stored data
 */
export function exportAllData() {
  try {
    const data = {};
    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        data[key] = JSON.parse(stored);
      }
    });
    return data;
  } catch (error) {
    console.error('Error exporting data:', error);
    return {};
  }
}

/**
 * Import data from JSON
 * @param {Object} data - Data to import
 */
export function importData(data) {
  try {
    Object.entries(data).forEach(([key, value]) => {
      const storageKey = STORAGE_KEYS[key];
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(value));
      }
    });
  } catch (error) {
    console.error('Error importing data:', error);
  }
} 