/**
 * Utility functions for managing form configuration data
 * Includes dynamic dropdowns and conditional field visibility
 */

// Default dropdown configurations
export const defaultDropdownConfigs = {
  symptomOccurrence: {
    name: 'Symptom Occurrence',
    values: [
      'After a while',
      'After long time switched off', 
      'After product upgrade',
      'Constantly',
      'Due to a physical damage',
      'In a cold environment',
      'In a hot environment',
      'In a wet environment',
      'Intermittently',
      'Liquid contamination',
      'One time event',
      'Switched on the first time',
      'Under stressed condition',
      'Under vibration',
      'When switching'
    ]
  },
  mainsVoltageType: {
    name: 'Mains Voltage Type',
    values: [
      'Single phase',
      'Bi phase',
      'Three phase with neutral',
      'Three phase without neutral'
    ]
  },
  mainsVoltageRange: {
    name: 'Mains Voltage Range',
    dependentOn: 'mainsVoltageType',
    values: {
      'Single phase': ['<100VAC', '200-240V'],
      'Bi phase': ['200-240V', '>240V'],
      'Three phase with neutral': ['>240VAC'],
      'Three phase without neutral': ['>240VAC']
    }
  },
  outputLoad: {
    name: 'Output Load',
    values: ['2 Ohm', '4 Ohm', '8 Ohm', '16 Ohm', '>16 Ohm', 'Disconnected']
  },
  loadConnectionMode: {
    name: 'Load Connection Mode',
    values: ['Single ended', 'Bridged', 'Parallel']
  },
  installationType: {
    name: 'Installation Type',
    values: [
      'Airport',
      'Rail Station',
      'Cinema',
      'Theatre',
      'Museum',
      'Club / Disco',
      'Pub',
      'Concert',
      'Touring Rental',
      'Mall',
      'Conference',
      'Church',
      'Boat',
      'Laboratory'
    ]
  }
};

/**
 * Parse JSON data for form configuration
 * @param {Object} jsonData - JSON configuration object
 * @returns {Object} Form configuration object
 */
export function parseFormConfigJson(jsonData) {
  const config = {
    dropdowns: {},
    fieldVisibility: {},
    categoryConfigs: {},
    conditionalOptions: {}
  };

  // Parse dropdown configurations
  if (jsonData.dropdowns) {
    Object.entries(jsonData.dropdowns).forEach(([name, dropdown]) => {
      config.dropdowns[name] = {
        name: dropdown.name || name,
        values: dropdown.values || [],
        dependentOn: dropdown.dependentOn || null,
        dependentValues: dropdown.dependentValues || null,
        conditionalOptions: dropdown.conditionalOptions || null
      };
    });
  }

  // Parse field visibility rules
  if (jsonData.fieldVisibility) {
    Object.entries(jsonData.fieldVisibility).forEach(([model, fields]) => {
      config.fieldVisibility[model] = {};
      Object.entries(fields).forEach(([field, rule]) => {
        config.fieldVisibility[model][field] = {
          show: rule.show !== false, // Default to true if not specified
          dependsOn: rule.dependsOn || null,
          dependsValue: rule.dependsValue || null,
          conditions: rule.conditions || null
        };
      });
    });
  }

  // Parse category configurations
  if (jsonData.categoryConfigs) {
    Object.entries(jsonData.categoryConfigs).forEach(([category, categoryConfig]) => {
      config.categoryConfigs[category] = {
        visibleFields: categoryConfig.visibleFields || {}
      };
    });
  }

  // Parse conditional options
  if (jsonData.conditionalOptions) {
    Object.entries(jsonData.conditionalOptions).forEach(([dropdownName, conditions]) => {
      config.conditionalOptions[dropdownName] = conditions;
    });
  }

  return config;
}

/**
 * Convert form configuration to JSON format
 * @param {Object} config - Form configuration object
 * @returns {Object} JSON configuration object
 */
export function exportFormConfigToJson(config) {
  return {
    dropdowns: config.dropdowns || {},
    fieldVisibility: config.fieldVisibility || {},
    categoryConfigs: config.categoryConfigs || {},
    conditionalOptions: config.conditionalOptions || {}
  };
}

/**
 * Get dropdown values based on dependencies and conditions
 * @param {Object} config - Form configuration
 * @param {string} dropdownName - Name of the dropdown
 * @param {Object} formData - Current form data
 * @returns {Array} Available values for the dropdown
 */
export function getDropdownValues(config, dropdownName, formData = {}) {
  const dropdown = config.dropdowns[dropdownName];
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
  if (config.conditionalOptions && config.conditionalOptions[dropdownName]) {
    values = filterConditionalOptions(values, config.conditionalOptions[dropdownName], formData);
  }
  
  return values;
}

/**
 * Filter dropdown options based on conditions
 * @param {Array} options - Available options
 * @param {Array} conditions - Conditional rules
 * @param {Object} formData - Current form data
 * @returns {Array} Filtered options
 */
function filterConditionalOptions(options, conditions, formData) {
  return options.filter(option => {
    // Check if option has conditions
    const optionConditions = conditions[option];
    if (!optionConditions) return true; // No conditions = always show
    
    // Check all conditions for this option
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
}

/**
 * Check if a field should be visible for a specific model
 * @param {Object} config - Form configuration
 * @param {string} model - Model name
 * @param {string} field - Field name
 * @param {Object} formData - Current form data
 * @returns {boolean} Whether the field should be visible
 */
export function isFieldVisible(config, model, field, formData = {}) {
  const visibilityRule = config.fieldVisibility?.[model]?.[field];
  if (!visibilityRule) return true; // Default to visible if no rule
  
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
}

/**
 * Get visible fields for a category
 * @param {Object} config - Form configuration
 * @param {string} category - Category name
 * @returns {Object} Visible fields by section
 */
export function getCategoryVisibleFields(config, category) {
  return config.categoryConfigs?.[category]?.visibleFields || {};
}

/**
 * Generate sample form configuration JSON
 * @returns {Object} Sample JSON configuration
 */
export function generateSampleFormConfigJson() {
  return {
    dropdowns: {
      symptomOccurrence: {
        name: 'Symptom Occurrence',
        values: [
          'After a while',
          'After long time switched off',
          'After product upgrade',
          'Constantly',
          'Due to a physical damage',
          'In a cold environment',
          'In a hot environment',
          'In a wet environment',
          'Intermittently',
          'Liquid contamination',
          'One time event',
          'Switched on the first time',
          'Under stressed condition',
          'Under vibration',
          'When switching'
        ]
      },
      mainsVoltageType: {
        name: 'Mains Voltage Type',
        values: [
          'Single phase',
          'Bi phase',
          'Three phase with neutral',
          'Three phase without neutral'
        ]
      },
      mainsVoltageRange: {
        name: 'Mains Voltage Range',
        dependentOn: 'mainsVoltageType',
        dependentValues: {
          'Single phase': ['<100VAC', '200-240V'],
          'Bi phase': ['200-240V', '>240V'],
          'Three phase with neutral': ['>240VAC'],
          'Three phase without neutral': ['>240VAC']
        }
      },
      outputLoad: {
        name: 'Output Load',
        values: ['2 Ohm', '4 Ohm', '8 Ohm', '16 Ohm', '>16 Ohm', 'Disconnected']
      },
      loadConnectionMode: {
        name: 'Load Connection Mode',
        values: ['Single ended', 'Bridged', 'Parallel']
      },
      installationType: {
        name: 'Installation Type',
        values: [
          'Airport',
          'Rail Station',
          'Cinema',
          'Theatre',
          'Museum',
          'Club / Disco',
          'Pub',
          'Concert',
          'Touring Rental',
          'Mall',
          'Conference',
          'Church',
          'Boat',
          'Laboratory'
        ]
      }
    },
    fieldVisibility: {
      'DVS_10P_SP': {
        'mainsVoltageType': { show: true },
        'mainsVoltageRange': { 
          show: true, 
          dependsOn: 'mainsVoltageType', 
          dependsValue: 'Single phase' 
        },
        'outputLoad': { 
          show: true,
          conditions: [
            { field: 'mainsVoltageType', operator: 'equals', value: 'Single phase' }
          ]
        }
      },
      'AI_41': {
        'mainsVoltageType': { show: false },
        'outputLoad': { show: false }
      }
    },
    categoryConfigs: {
      'Active_Speaker': {
        visibleFields: {
          symptomInfo: ['symptomArea', 'symptomFound', 'symptomOccurrence'],
          technicalInfo: ['mainsVoltageType', 'mainsVoltageRange', 'outputLoad', 'loadConnectionMode'],
          additionalInfo: ['installationType', 'note']
        }
      },
      'Passive_Speaker': {
        visibleFields: {
          symptomInfo: ['symptomArea', 'symptomFound', 'symptomOccurrence'],
          additionalInfo: ['installationType', 'note']
        }
      },
      'Processor': {
        visibleFields: {
          symptomInfo: ['symptomArea', 'symptomFound', 'symptomOccurrence'],
          technicalInfo: ['mainsVoltageType', 'mainsVoltageRange'],
          additionalInfo: ['installationType', 'note']
        }
      }
    },
    conditionalOptions: {
      'outputLoad': {
        '2 Ohm': [
          { field: 'mainsVoltageType', operator: 'equals', value: 'Single phase' }
        ],
        '4 Ohm': [
          { field: 'mainsVoltageType', operator: 'in', value: ['Single phase', 'Bi phase'] }
        ],
        '8 Ohm': [
          { field: 'mainsVoltageType', operator: 'not_equals', value: 'Three phase with neutral' }
        ]
      },
      'installationType': {
        'Airport': [
          { field: 'mainsVoltageType', operator: 'exists' }
        ],
        'Laboratory': [
          { field: 'mainsVoltageType', operator: 'equals', value: 'Three phase with neutral' }
        ]
      }
    }
  };
}

/**
 * Merge form configuration with defaults
 * @param {Object} customConfig - Custom configuration from JSON
 * @returns {Object} Merged configuration
 */
export function mergeFormConfig(customConfig) {
  const merged = {
    dropdowns: { ...defaultDropdownConfigs },
    fieldVisibility: customConfig.fieldVisibility || {},
    categoryConfigs: customConfig.categoryConfigs || {},
    conditionalOptions: customConfig.conditionalOptions || {}
  };
  
  // Merge custom dropdowns
  Object.entries(customConfig.dropdowns || {}).forEach(([name, dropdown]) => {
    merged.dropdowns[name] = dropdown;
  });
  
  return merged;
} 