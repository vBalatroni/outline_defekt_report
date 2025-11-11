import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { loadProductMapping, saveProductMapping } from '@/utils/storageUtils';
import productDataJson from '@/assets/productData.json';

export const defaultIntroContent = {
  title: 'Before starting',
  subtitle: 'Have you completed all the necessary checks before filling out the Defekt Report?',
  bulletPoints: [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    'Pellentesque et tortor congue, congue libero at, interdum ex.',
    'Mauris faucibus ipsum in  feugiat feugiat.',
    'Aenean sit amet velit cursus, suscipit mi ut, aliquet sapien.',
    'Aliquam eleifend nulla pulvinar, feugiat sem id, pretium turpis.',
  ],
  checkboxLabel: 'I confirm that the required checks have been completed.',
  startButtonLabel: 'Start',
};

const cloneDefaultIntro = () => JSON.parse(JSON.stringify(defaultIntroContent));

const defaultValidationConfig = {
  serial: {
    enabled: false,
  },
};

const defaultProductMapping = productDataJson;

// Template per i dati generali del form, per poterli resettare facilmente
const getDefaultGeneralDataTemplate = () => ({
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
  },
  addSymptomSet: (key, data) => false,
  updateSymptomSet: (originalKey, nextKey, data) => false,
  deleteSymptomSet: (key) => {},
});

export const useProductStore = defineStore('product', () => {
  // STATE
  const productMapping = ref(null);
  const isLoading = ref(false);
  const error = ref(null);
  
  // State for the multi-step form
  const formState = ref({
    isConfirmed: false,
    sessionId: null,
    generalData: getDefaultGeneralDataTemplate(),
    savedProducts: [],
  });
  
  // Persist form state while a session is active
  watch(formState, (state) => {
    if (state.sessionId) {
      const dataToPersist = {
        generalData: state.generalData,
        savedProducts: state.savedProducts
      };
      localStorage.setItem('defekt_report_form_data', JSON.stringify(dataToPersist));
    } else {
      localStorage.removeItem('defekt_report_form_data');
    }
  }, { deep: true });

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

  const symptomSetOptions = computed(() => {
    const sets = productMapping.value?.symptomSets || {};
    return Object.entries(sets).map(([key, val]) => ({ value: key, label: val.label || key }));
  });

  const defectSections = computed(() => {
    return productMapping.value?.defectSections || ['symptomInfo', 'technicalInfo', 'serialNumbers', 'versions', 'additionalInfo'];
  });

  // ACTIONS
  const loadConfiguration = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      // 1) Prova a caricare dal backend Nest
      try {
        const resp = await fetch('/config/latest', { credentials: 'include' });
        if (resp.ok) {
          const data = await resp.json();
          if (data && data.content) {
            const incoming = data.content;
            ensureIntroContent(incoming);
            ensureValidationConfig(incoming);
            productMapping.value = incoming;
            console.log('Configuration loaded from backend.');
            return;
          }
        }
      } catch (e) {
        console.warn('Backend config not available, falling back to bundled productData.json');
      }

      // 2) Fallback: usa il file bundle
      let currentMapping = JSON.parse(JSON.stringify(defaultProductMapping));
      ensureIntroContent(currentMapping);
      ensureValidationConfig(currentMapping);
      productMapping.value = currentMapping;
      console.log('Configuration loaded from file.');

    } catch (e) {
      console.error(e);
      error.value = 'Failed to load configuration';
    } finally {
      isLoading.value = false;
    }
  };

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
    formState.value.sessionId = null;
    formState.value.generalData = generateGeneralDataFromConfig(productMapping.value?.generalFieldsConfig) || getDefaultGeneralDataTemplate();
    formState.value.savedProducts = [];
    localStorage.removeItem('defekt_report_form_data');
    console.log('Form state and persisted data have been reset.');
  };

  const startSession = () => {
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    formState.value.sessionId = newSessionId;
    sessionStorage.setItem('defekt_report_session_id', newSessionId);
    console.log('Form session started:', newSessionId);
    // Ensure current generalFieldsConfig is applied to the live form when starting a new session
    const cfg = productMapping.value?.generalFieldsConfig;
    const generated = generateGeneralDataFromConfig(cfg);
    if (generated) {
      formState.value.generalData = generated;
    }
  };

  const loadSession = () => {
    const storedSessionId = sessionStorage.getItem('defekt_report_session_id');
    if (storedSessionId) {
      formState.value.sessionId = storedSessionId;
      console.log('Form session loaded from sessionStorage:', storedSessionId);

      const persistedData = localStorage.getItem('defekt_report_form_data');
      if (persistedData) {
        try {
          const parsedData = JSON.parse(persistedData);
          formState.value.generalData = parsedData.generalData;
          formState.value.savedProducts = parsedData.savedProducts;
          console.log('Successfully hydrated form state from localStorage.');
        } catch (error) {
          console.error('Failed to parse persisted form data:', error);
        }
      }
    }
  };

  // UTILITIES MAPPING
  const getModelsForCategory = (category) => {
    return (productMapping.value?.categoryModels?.[category]) || [];
  };

  const getModelFields = (model) => {
    return (productMapping.value?.modelFieldConfigs?.[model]) || [];
  };

  const getSymptomAreasForModel = (model) => {
    const fields = getModelFields(model);
    const areaField = fields.find(f => f.isSymptomArea);
    if (!areaField) return [];
    const sets = productMapping.value?.symptomSets || {};
    return (areaField.options || [])
      .filter(setKey => !!sets[setKey])
      .map(setKey => sets[setKey].label);
  };

  const getSymptomSetSymptoms = (setKey) => {
    const set = productMapping.value?.symptomSets?.[setKey];
    // Support both shapes: { options: [...] } and { symptoms: [...] }
    return set?.options || set?.symptoms || [];
  };

  const updateProductMapping = (mapping) => {
    ensureIntroContent(mapping);
  ensureValidationConfig(mapping);
    productMapping.value = mapping;
  };

  const updateModelFieldConfigs = (newConfigs) => {
    if (!productMapping.value) return;
    productMapping.value.modelFieldConfigs = newConfigs;
  };

  // =====================
  // General fields config
  // =====================
  const generateGeneralDataFromConfig = (config) => {
    if (!config || !config.sections) return null;
    const result = {};
    Object.entries(config.sections).forEach(([sectionKey, fields]) => {
      result[sectionKey] = {};
      (fields || []).sort((a,b) => (a.order ?? 0) - (b.order ?? 0)).forEach((f) => {
        result[sectionKey][f.id] = {
          id: f.id,
          label: f.label || f.id,
          value: '',
          type: f.type || 'text',
          isRequired: !!f.isRequired,
        };
      });
    });
    // Ensure optional section exists
    if (!result.otherReturnAddress) {
      result.otherReturnAddress = getDefaultGeneralDataTemplate().otherReturnAddress;
    }
    return result;
  };

  const updateGeneralFieldsConfig = (newConfig) => {
    if (!productMapping.value) return;
    productMapping.value.generalFieldsConfig = newConfig;
  };

  const applyGeneralFieldsConfigToForm = () => {
    const cfg = productMapping.value?.generalFieldsConfig;
    const generated = generateGeneralDataFromConfig(cfg);
    if (generated) {
      formState.value.generalData = generated;
    }
  };

  // When config loads, if generalFieldsConfig is present and no active session, hydrate generalData
  watch(productMapping, (val) => {
    if (!val) return;
    if (!formState.value.sessionId && val.generalFieldsConfig) {
      const generated = generateGeneralDataFromConfig(val.generalFieldsConfig);
      if (generated) formState.value.generalData = generated;
    }
  }, { deep: true });

  // =====================
  // Category management
  // =====================
  const addCategory = (name) => {
    const trimmed = String(name || '').trim();
    if (!trimmed) return false;
    const current = JSON.parse(JSON.stringify(productMapping.value));
    current.categories = Array.isArray(current.categories) ? current.categories : [];
    if (current.categories.includes(trimmed)) return false;
    current.categories.push(trimmed);
    current.categoryModels = current.categoryModels || {};
    if (!current.categoryModels[trimmed]) current.categoryModels[trimmed] = [];
    productMapping.value = current;
    return true;
  };

  const renameCategory = (oldName, newName) => {
    const from = String(oldName || '').trim();
    const to = String(newName || '').trim();
    if (!from || !to || from === to) return false;
    const current = JSON.parse(JSON.stringify(productMapping.value));
    if (!current.categories || !current.categories.includes(from)) return false;
    if (current.categories.includes(to)) return false;
    current.categories = current.categories.map(c => (c === from ? to : c));
    current.categoryModels = current.categoryModels || {};
    const models = current.categoryModels[from] || [];
    delete current.categoryModels[from];
    current.categoryModels[to] = Array.isArray(current.categoryModels[to]) ? current.categoryModels[to].concat(models) : models;
    productMapping.value = current;
    return true;
  };

  const deleteCategory = (name, moveModelsTo = null) => {
    const cat = String(name || '').trim();
    if (!cat) return { ok: false, reason: 'invalid' };
    const current = JSON.parse(JSON.stringify(productMapping.value));
    const idx = (current.categories || []).indexOf(cat);
    if (idx === -1) return { ok: false, reason: 'not_found' };
    const models = (current.categoryModels || {})[cat] || [];
    if (models.length > 0) {
      const dest = String(moveModelsTo || '').trim();
      if (!dest || !current.categories.includes(dest) || dest === cat) {
        return { ok: false, reason: 'needs_destination' };
      }
      current.categoryModels[dest] = current.categoryModels[dest] || [];
      current.categoryModels[dest].push(...models);
    }
    // Remove the category
    current.categories.splice(idx, 1);
    delete current.categoryModels[cat];
    productMapping.value = current;
    return { ok: true };
  };

  const moveModelToCategory = (modelName, fromCategory, toCategory) => {
    const model = String(modelName || '').trim();
    const from = String(fromCategory || '').trim();
    const to = String(toCategory || '').trim();
    if (!model || !from || !to || from === to) return false;
    const current = JSON.parse(JSON.stringify(productMapping.value));
    current.categoryModels = current.categoryModels || {};
    current.categoryModels[from] = current.categoryModels[from] || [];
    current.categoryModels[to] = current.categoryModels[to] || [];
    const idx = current.categoryModels[from].indexOf(model);
    if (idx === -1) return false;
    current.categoryModels[from].splice(idx, 1);
    if (!current.categoryModels[to].includes(model)) current.categoryModels[to].push(model);
    productMapping.value = current;
    return true;
  };

  const setSymptomSets = (nextSets) => {
    const mapping = productMapping.value ? JSON.parse(JSON.stringify(productMapping.value)) : {};
    mapping.symptomSets = nextSets;
    ensureValidationConfig(mapping);
    ensureIntroContent(mapping);
    productMapping.value = mapping;
  };

  const addSymptomSet = (key, data) => {
    const trimmedKey = String(key || '').trim();
    if (!trimmedKey) return false;
    const current = JSON.parse(JSON.stringify(productMapping.value?.symptomSets || {}));
    if (current[trimmedKey]) return false;
    current[trimmedKey] = {
      label: data?.label || trimmedKey,
      symptoms: Array.isArray(data?.symptoms) ? data.symptoms : [],
    };
    setSymptomSets(current);
    return true;
  };

  const updateSymptomSet = (originalKey, nextKey, data) => {
    const from = String(originalKey || '').trim();
    const to = String(nextKey || '').trim();
    if (!from || !productMapping.value?.symptomSets?.[from]) return false;
    const current = JSON.parse(JSON.stringify(productMapping.value.symptomSets || {}));
    if (from !== to && current[to]) return false;
    const payload = {
      label: data?.label || to || from,
      symptoms: Array.isArray(data?.symptoms) ? data.symptoms : [],
    };
    if (from !== to && to) {
      delete current[from];
      current[to] = payload;
    } else {
      current[from] = payload;
    }
    setSymptomSets(current);
    return true;
  };

  const deleteSymptomSet = (key) => {
    const target = String(key || '').trim();
    if (!target) return;
    const current = JSON.parse(JSON.stringify(productMapping.value?.symptomSets || {}));
    if (!current[target]) return;
    delete current[target];
    setSymptomSets(current);
  };

  return {
    productMapping,
    isLoading,
    error,
    formState,

    categories,
    categoryModels,
    symptomSets,
    symptomSetOptions,
    defectSections,

    loadConfiguration,
    setConfirmation,
    addProduct,
    updateProduct,
    deleteProduct,
    resetForm,
    startSession,
    loadSession,

    getModelsForCategory,
    getModelFields,
    getSymptomAreasForModel,
    getSymptomSetSymptoms,
    updateProductMapping,
    updateModelFieldConfigs,
    updateGeneralFieldsConfig,
    applyGeneralFieldsConfigToForm,
    addCategory,
    renameCategory,
    deleteCategory,
    moveModelToCategory,
    addSymptomSet,
    updateSymptomSet,
    deleteSymptomSet,
  };
}); 

function ensureIntroContent(mapping) {
  if (!mapping) return;
  if (!mapping.introContent) {
    mapping.introContent = cloneDefaultIntro();
  } else {
    const merged = { ...cloneDefaultIntro(), ...mapping.introContent };
    const bullets = Array.isArray(mapping.introContent.bulletPoints)
      ? mapping.introContent.bulletPoints.filter((item) => typeof item === 'string' && item.trim().length)
      : [];
    merged.bulletPoints = bullets.length ? bullets : cloneDefaultIntro().bulletPoints;
    merged.checkboxLabel = mapping.introContent.checkboxLabel || defaultIntroContent.checkboxLabel;
    merged.startButtonLabel = mapping.introContent.startButtonLabel || defaultIntroContent.startButtonLabel;
    merged.title = mapping.introContent.title || defaultIntroContent.title;
    merged.subtitle = mapping.introContent.subtitle || defaultIntroContent.subtitle;
    mapping.introContent = merged;
  }
}

function ensureValidationConfig(mapping) {
  if (!mapping) return;
  const existing = mapping.validationConfig || {};
  const serial = existing.serial || {};
  mapping.validationConfig = {
    ...defaultValidationConfig,
    ...existing,
    serial: {
      ...defaultValidationConfig.serial,
      ...serial,
      enabled: typeof serial.enabled === 'boolean' ? serial.enabled : !!defaultValidationConfig.serial.enabled,
    },
  };
}