import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { loadFormConfig, saveFormConfig, loadProductMapping, saveProductMapping } from '@/utils/storageUtils';
import { parseFormConfigJson, mergeFormConfig } from '@/utils/formConfigUtils';

// Default product mapping data (moved from productMapping.js)
const defaultProductMapping = {
  categories: [
    'Active_Speaker',
    'Passive_Speaker',
    'Processor',
    'Rack_Amplifier',
    'Measurement_System'
  ],
  categoryModels: {
    'Active_Speaker': [
      'DVS_10P_SP', 'DVS_115_SW_iSP', 'DVS_118_SW_iSP', 'DVS_12P_iSP',
      'DVS_15P_iSP', 'DVS_8P_SP', 'FLYSUB_15_iSP', 'HARD115_SP',
      'HARD212_SP', 'HARD212NET_SP', 'HARD45_SP', 'iSM_112',
      'iSM_115', 'iSM_212', 'Ki_10SP', 'Ki_12SP', 'MICRA2_SP',
      'miniCOM.P.A.S.S._iSP', 'Monaco_215_CX_SP', 'SUB_110SP',
      'SUB_118SP', 'V10_KIT', 'V15_KIT', 'V24_BGM_KIT', 'V6.5_KIT',
      'V8CX_KIT'
    ],
    'Passive_Speaker': [
      'AI_41', 'AI_81', 'ARENA_215_CX', 'AS_6', 'BUTTERFLY_CDH_483',
      'Charlie_4', 'DBS_18_2', 'EIDOS_108S', 'EIDOS_215S', 'EIDOS_265LA',
      'FLYSUB_15', 'GTO', 'GTO_C12', 'GTO_DF', 'GTO_LOW', 'GTO_SUB',
      'HARD212', 'Ki_10', 'Ki_12', 'LAB_21_HS', 'LIPF_082', 'MANTAS',
      'MANTAS_28', 'MICRA_R', 'MICRA2', 'MONACO_215_CX', 'MOVIE_B_215',
      'MOVIE_FX_101', 'MOVIE_H_102', 'MOVIE_MV1CX', 'MOVIE_MV2CX',
      'MOVIE_S_118', 'MOVIE_S_218', 'OMNIA', 'SCALA_100_30', 'SCALA_90',
      'STADIA_100_10_LA', 'STADIA_100_20_LA', 'STADIA_100_30_LA',
      'STADIA_28', 'STSUB_215', 'SUB_110', 'SUB_118', 'SUB_218',
      'SUPERFLY', 'VEGAS_10', 'VEGAS_12', 'VEGAS_12CX', 'VEGAS_15',
      'VEGAS_15CX', 'VEGAS_24', 'VEGAS_4', 'VEGAS_6.5', 'VEGAS_8CX'
    ],
    'Processor': [
      'Genius_24', 'Genius_26', 'Genius_M_412', 'iP_24', 'iP_24_v2',
      'Newton_16', 'Newton_16_4', 'Newton_16_8'
    ],
    'Rack_Amplifier': [
      'D4_3K', 'DPA_1002', 'DPA_1004', 'GTA_Otto', 'GTA_Quattro',
      'L3000_', 'L3000E', 'LF_300', 'LF_400', 'LF_500', 'LF_550',
      'LF_600', 'LF_700', 'LF_800', 'M2800_4', 'M5000_4', 'T_Eleven',
      'T_Eleven_DSP', 'T_Five', 'T_Five_DSP', 'T_Nine', 'T_Nine_DSP',
      'T_Seven', 'T_Seven_DSP', 'T2.5', 'T4.5', 'T6.5', 'TTM12K4',
      'TTM12K4_D', 'TTM8K4', 'TTM8K4_D'
    ],
    'Measurement_System': [
      'ET250_3D', 'ET250R2_3D', 'ET50_3D', 'FASTQC_LS', 'GSA',
      'GSR', 'NG1_', 'SPL_Control_Plus'
    ]
  },
  modelSymptomAreas: {
    'DVS_10P_SP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker__'],
    'DVS_115_SW_iSP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker_'],
    'DVS_118_SW_iSP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker_'],
    'DVS_12P_iSP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker__'],
    'DVS_15P_iSP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker__'],
    'DVS_8P_SP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker__'],
    'FLYSUB_15_iSP': ['Amplifier', 'Audio_', 'Cabinet', 'Hardware', 'Power', 'Speaker_'],
    'HARD115_SP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker__'],
    'HARD212_SP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker__'],
    'HARD212NET_SP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker__'],
    'HARD45_SP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker__'],
    'iSM_112': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker__'],
    'iSM_115': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker__'],
    'iSM_212': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker__'],
    'Ki_10SP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker__'],
    'Ki_12SP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker__'],
    'MICRA2_SP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker__'],
    'miniCOM.P.A.S.S._iSP': ['Amplifier', 'Audio_', 'Cabinet', 'Hardware', 'Power', 'Speaker__'],
    'Monaco_215_CX_SP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker__'],
    'SUB_110SP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker_'],
    'SUB_118SP': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker_'],
    'V10_KIT': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker..'],
    'V15_KIT': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker..'],
    'V24_BGM_KIT': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker..'],
    'V6.5_KIT': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker..'],
    'V8CX_KIT': ['Amplifier', 'Audio_', 'Cabinet', 'Power', 'Speaker..'],
    'AI_41': ['Audio_', 'Cabinet', 'Speaker__'],
    'AI_81': ['Audio_', 'Cabinet', 'Speaker__'],
    'ARENA_215_CX': ['Audio_', 'Cabinet', 'Speaker___'],
    'AS_6': ['Audio_', 'Cabinet', 'Speaker__'],
    'BUTTERFLY_CDH_483': ['Audio_', 'Cabinet', 'Hardware', 'Speaker___'],
    'Charlie_4': ['Audio_', 'Cabinet', 'Speaker__'],
    'DBS_18_2': ['Audio_', 'Cabinet', 'Speaker_'],
    'EIDOS_108S': ['Audio_', 'Cabinet', 'Speaker_'],
    'EIDOS_215S': ['Audio_', 'Cabinet', 'Speaker_'],
    'EIDOS_265LA': ['Audio_', 'Cabinet', 'Hardware', 'Speaker__'],
    'FLYSUB_15': ['Audio_', 'Cabinet', 'Hardware', 'Speaker_'],
    'GTO': ['Audio_', 'Cabinet', 'Hardware', 'Speaker___'],
    'GTO_C12': ['Audio_', 'Cabinet', 'Hardware', 'Speaker___'],
    'GTO_DF': ['Audio_', 'Cabinet', 'Hardware', 'Speaker__'],
    'GTO_LOW': ['Audio_', 'Cabinet', 'Hardware', 'Speaker.'],
    'GTO_SUB': ['Audio_', 'Cabinet', 'Hardware', 'Speaker_'],
    'HARD212': ['Audio_', 'Cabinet', 'Speaker__'],
    'Ki_10': ['Audio_', 'Cabinet', 'Speaker__'],
    'Ki_12': ['Audio_', 'Cabinet', 'Speaker__'],
    'LAB_21_HS': ['Audio_', 'Cabinet', 'Speaker__'],
    'LIPF_082': ['Audio_', 'Cabinet', 'Hardware', 'Speaker__'],
    'MANTAS': ['Audio_', 'Cabinet', 'Hardware', 'Speaker__'],
    'MANTAS_28': ['Audio_', 'Cabinet', 'Hardware', 'Speaker__'],
    'MICRA_R': ['Audio_', 'Cabinet', 'Hardware'],
    'MICRA2': ['Audio_', 'Cabinet', 'Hardware'],
    'MONACO_215_CX': ['Audio_', 'Cabinet', 'Speaker___'],
    'MOVIE_B_215': ['Audio_', 'Cabinet', 'Speaker.'],
    'MOVIE_FX_101': ['Audio_', 'Cabinet', 'Speaker__'],
    'MOVIE_H_102': ['Audio_', 'Cabinet', 'Speaker_'],
    'MOVIE_MV1CX': ['Audio_', 'Cabinet', 'Speaker__'],
    'MOVIE_MV2CX': ['Audio_', 'Cabinet', 'Speaker___'],
    'MOVIE_S_118': ['Audio_', 'Cabinet', 'Speaker_'],
    'MOVIE_S_218': ['Audio_', 'Cabinet', 'Speaker_'],
    'OMNIA': ['Audio_', 'Cabinet', 'Hardware'],
    'SCALA_100_30': ['Audio_', 'Cabinet', 'Speaker__'],
    'SCALA_90': ['Audio_', 'Cabinet', 'Speaker__'],
    'STADIA_100_10_LA': ['Audio_', 'Cabinet', 'Speaker_'],
    'STADIA_100_20_LA': ['Audio_', 'Cabinet', 'Speaker__'],
    'STADIA_100_30_LA': ['Audio_', 'Cabinet', 'Speaker__'],
    'STADIA_28': ['Audio_', 'Cabinet', 'Speaker_'],
    'STSUB_215': ['Audio_', 'Cabinet', 'Speaker_'],
    'SUB_110': ['Audio_', 'Cabinet', 'Speaker_'],
    'SUB_118': ['Audio_', 'Cabinet', 'Speaker_'],
    'SUB_218': ['Audio_', 'Cabinet', 'Speaker_'],
    'SUPERFLY': ['Audio_', 'Cabinet', 'Hardware', 'Speaker___'],
    'VEGAS_10': ['Audio_', 'Cabinet', 'Speaker__'],
    'VEGAS_12': ['Audio_', 'Cabinet', 'Speaker__'],
    'VEGAS_12CX': ['Audio_', 'Cabinet', 'Speaker__'],
    'VEGAS_15': ['Audio_', 'Cabinet', 'Speaker__'],
    'VEGAS_15CX': ['Audio_', 'Cabinet', 'Speaker__'],
    'VEGAS_24': ['Audio_', 'Cabinet', 'Speaker__'],
    'VEGAS_4': ['Audio_', 'Cabinet', 'Speaker__'],
    'VEGAS_6.5': ['Audio_', 'Cabinet', 'Speaker__'],
    'VEGAS_8CX': ['Audio_', 'Cabinet', 'Speaker__'],
    'Genius_24': ['Audio', 'Connections', 'Control_Software', 'Mechanics', 'Power'],
    'Genius_26': ['Audio', 'Connections', 'Mechanics', 'Power'],
    'Genius_M_412': ['Audio', 'Connections', 'Power'],
    'iP_24': ['Audio', 'Connections', 'Control_Software', 'Dante', 'Firmware', 'Mechanics', 'Power'],
    'iP_24_v2': ['Audio', 'Connections', 'Control_Software', 'Dante', 'Firmware', 'Mechanics', 'Power'],
    'Newton_16': ['Audio', 'Connections', 'Control_Software', 'Dante', 'Firmware', 'Mechanics', 'Power'],
    'Newton_16_4': ['Audio', 'Connections', 'Control_Software', 'Dante', 'Firmware', 'Mechanics', 'Power'],
    'Newton_16_8': ['Audio', 'Connections', 'Control_Software', 'Dante', 'Firmware', 'Mechanics', 'Power'],
    'D4_3K': ['Armonia'],
    'DPA_1002': ['Audio', 'In_Out'],
    'DPA_1004': ['Dante', 'Display', 'Firmware', 'DSP'],
    'GTA_Otto': ['DSP', 'Firmware', 'In_Out', 'Mechanics'],
    'GTA_Quattro': ['Firmware', 'In_Out', 'Mechanics', 'In_Out'],
    'L3000_': ['In_Out', 'Mechanics', 'Power', 'Mechanics'],
    'L3000E': ['Mechanics', 'Power', 'Power', 'Power'],
    'LF_300': ['Power', 'Power', 'Power', 'Power'],
    'LF_400': ['Power', 'Power', 'Power', 'Power'],
    'LF_500': ['Power', 'Power', 'Power', 'Power'],
    'LF_550': ['Power', 'Power', 'Power', 'Power'],
    'LF_600': ['Power', 'Power', 'Power', 'Power'],
    'LF_700': ['Power', 'Power', 'Power', 'Power'],
    'LF_800': ['Power', 'Power', 'Power', 'Power'],
    'M2800_4': ['Power', 'Power', 'Power', 'Power'],
    'M5000_4': ['Power', 'Power', 'Power', 'Power'],
    'T_Eleven': ['Power', 'Power', 'Power', 'Power'],
    'T_Eleven_DSP': ['Power', 'Power', 'Power', 'Power'],
    'T_Five': ['Power', 'Power', 'Power', 'Power'],
    'T_Five_DSP': ['Power', 'Power', 'Power', 'Power'],
    'T_Nine': ['Power', 'Power', 'Power', 'Power'],
    'T_Nine_DSP': ['Power', 'Power', 'Power', 'Power'],
    'T_Seven': ['Power', 'Power', 'Power', 'Power'],
    'T_Seven_DSP': ['Power', 'Power', 'Power', 'Power'],
    'T2.5': ['Power', 'Power', 'Power', 'Power'],
    'T4.5': ['Power', 'Power', 'Power', 'Power'],
    'T6.5': ['Power', 'Power', 'Power', 'Power'],
    'TTM12K4': ['Power', 'Power', 'Power', 'Power'],
    'TTM12K4_D': ['Power', 'Power', 'Power', 'Power'],
    'TTM8K4': ['Power', 'Power', 'Power', 'Power'],
    'TTM8K4_D': ['Power', 'Power', 'Power', 'Power'],
    'ET250_3D': ['Display', 'Electronics', 'Mechanical_Issue', 'Power'],
    'ET250R2_3D': ['Display', 'Electronics', 'Mechanical_Issue', 'Power'],
    'ET50_3D': ['Display', 'Electronics', 'Mechanical_Issue', 'Power'],
    'FASTQC_LS': ['Display', 'Mechanics', 'Power'],
    'GSA': ['Audio_', 'In_Out', 'Mechanics', 'Power'],
    'GSR': ['Audio_', 'Cabinet', 'Speaker.', 'Power'],
    'NG1_': ['Audio_', 'Mechanics', 'Power'],
    'SPL_Control_Plus': ['Audio_', 'Mechanics', 'Power', 'Power']
  },
  symptomsByArea: {
    'Audio': [
      'Audio channel on protection', 'Audio level problem', 'Balance problem',
      'Crosstalk', 'Distorted audio', 'Excessive audio level', 'Hiss', 'Hum',
      'No audio', 'No muting', 'No or poor bass', 'No or poor treble',
      'Noisy audio', 'Offset voltage too high', 'Poor frequency response',
      'Pop or click noise', 'Scratching noise'
    ],
    'Power': [
      "Can't power up", 'Keep restarting', 'Power up but doesn\'t work',
      'Start up too slow', 'Switches off by itself'
    ],
    'Cabinet': [
      "Accessories_broken_or_missing",
      "Damaged plug/connectors",
      "Grille broken",
      "Loose parts inside",
      "Moving parts",
      "Painting defect",
      "Vibration noise",
      "Wrong color"
    ],
    'Audio_': [
      "Distorted audio",
      "Hiss",
      "Hum",
      "Low Level",
      "Missing high frequency",
      "Missing low frequency",
      "Missing mid frequency",
      "No audio",
      "Noisy audio",
      "Pop or click noise",
      "Scratching noise"
    ],
    'Connections': [
      "Analog IN",
      "Analog OUT",
      "All Analog",
      "AES/EBU IN",
      "AES/EBU OUT",
      "All AES/EBU",
      "MADI IN",
      "MADI OUT",
      "All MADI",
      "Ethernet Ports",
      "Other"
    ],
    'Amplifier': [
      "Damaged plug/connectors",
      "Faulty button",
      "Missing button",
      "Missing knob"
    ],
    'Mechanics': [
      "Damage plug/connectors",
      "Excessive fan speed",
      "Fan noise",
      "Faulty button",
      "Mechanical damage",
      "Parts loose inside",
      "Phisical Damage",
      "Scratching noise",
      "Vibration noise"
    ],
    'Speaker': ['Broken speaker'],
    'Control_Software': [
      "Can't discover unit on Software",
      "Can't import unit on Workspace",
      "Other Problem (please specify on note)",
      "Remain busy on worksheet",
      "Reset Problem"
    ],
    'Firmware': [
      "Can't update firmware",
      "Problem after firmware update"
    ]
  },
  mainVoltageTypes: [
    'Single_phase',
    'Bi_phase',
    'Three_phase_with_neutral',
    'Three_phase_without_neutral'
  ],
  mainVoltageRanges: {
    'Single_phase': ['<100VAC', '200-240V'],
    'Bi_phase': ['200-240V', '>240V'],
    'Three_phase_with_neutral': ['>240VAC'],
    'Three_phase_without_neutral': ['>240VAC']
  },
  outputLoadOptions: ['2 Ohm', '4 Ohm', '8 Ohm', '16 Ohm', '>16 Ohm', 'Disconnected'],
  loadConnectionModes: ['Single ended', 'Bridged', 'Parallel'],
  symptomOccurrences: [
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
  ],
  installationTypes: [
    'Airport', 'Rail Station', 'Cinema', 'Theatre', 'Museum',
    'Club / Disco', 'Pub', 'Concert', 'Touring Rental', 'Mall',
    'Conference', 'Church', 'Boat', 'Laboratory'
  ],
  voltageTypes: {
    'Active_Speaker': ['Single_phase', 'Bi_phase'],
    'Processor': ['Single_phase', 'Three_phase_with_neutral', 'Three_phase_without_neutral'],
    'Rack_Amplifier': ['Single_phase', 'Bi_phase', 'Three_phase_with_neutral'],
    'Passive_Speaker': [],
    'Measurement_System': ['Single_phase', 'Bi_phase']
  },
  voltageRangesByType: {
    'Single_phase': ['<100VAC', '200-240V'],
    'Bi_phase': ['200-240V', '>240V'],
    'Three_phase_with_neutral': ['>240VAC'],
    'Three_phase_without_neutral': ['>240VAC']
  }
};

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
    'Active_Speaker': {
      visibleFields: {
        symptomInfo: ['symptomArea', 'symptomFound', 'symptomOccurrence'],
        technicalInfo: ['mainsVoltageType', 'mainsVoltageRange', 'outputLoad', 'loadConnectionMode'],
        additionalInfo: ['installationType', 'note', 'importantInformation']
      }
    },
    'Passive_Speaker': {
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
    'Rack_Amplifier': {
      visibleFields: {
        symptomInfo: ['symptomArea', 'symptomFound', 'symptomOccurrence'],
        technicalInfo: ['mainsVoltageType', 'mainsVoltageRange', 'outputLoad', 'loadConnectionMode'],
        additionalInfo: ['installationType', 'note', 'importantInformation']
      }
    },
    'Measurement_System': {
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
    importConfiguration
  };
}); 