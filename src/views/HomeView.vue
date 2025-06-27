<script setup>
import { ref, computed, watch, provide, onMounted } from 'vue';
import TheWelcome from '../components/TheWelcome.vue';
import TheProgressBar from '@/components/TheProgressBar.vue';
import ConfirmationStep from '@/components/ConfirmationStep.vue';
import Button from '@/components/Button.vue';
import GeneralDataStep from '@/components/GeneralDataStep.vue';
import ProductsStep from '@/components/ProductsStep.vue';
import SummaryStep from '@/components/SummaryStep.vue';
import SuccessStep from '@/components/SuccessStep.vue';
import { useProductStore } from '@/stores/productStore';

const productStore = useProductStore();

const step = ref(0);
const confirmed = ref(false);
const formData = ref({
  name: '',
  surname: '',
});
const generalData = ref({
  companyData: { 
    companyName: { type: 'text', label: 'Company Name', id: 'companyName', isRequired: true, value: '' },
    vatNumber: { type: 'text', label: 'VAT Number', id: 'vatNumber', isRequired: true, value: '' },
  },
  freightForwarderData: {
    freightForwarderName: { type: 'text', label: 'Freight Forwarder Name', id: 'freightForwarderName', isRequired: false, value: '' },
    accountNumber: { type: 'text', label: 'Account Number', id: 'accountNumber', isRequired: false, value: '' },
  },
  companyAddress: {
    address: { type: 'text', label: 'Address', id: 'address', isRequired: true, value: '' },
    city: { type: 'text', label: 'City', id: 'city', isRequired: true, value: '' },
    country: { type: 'text', label: 'Country', id: 'country', isRequired: true, value: '' },
    zipCode: { type: 'text', label: 'Zip Code', id: 'zipCode', isRequired: true, value: '' },
    contactPersonName: { type: 'text', label: 'Contact Person Name', id: 'contactPersonName', isRequired: true, value: '' },
    eMail: { type: 'email', label: 'Email', id: 'eMail', isRequired: true, value: '' },
    phoneNumber: { type: 'tel', label: 'Phone Number', id: 'phoneNumber', isRequired: true, value: '' },
  },
  otherReturnAddress: {
    address: { type: 'text', label: 'Address', id: 'otherAddress', isRequired: false, value: '' },
    city: { type: 'text', label: 'City', id: 'otherCity', isRequired: false, value: '' },
    country: { type: 'text', label: 'Country', id: 'otherCountry', isRequired: false, value: '' },
    zipCode: { type: 'text', label: 'Zip Code', id: 'otherZipCode', isRequired: false, value: '' },
    contactPersonName: { type: 'text', label: 'Contact Person Name', id: 'otherContactPersonName', isRequired: false, value: '' },
    eMail: { type: 'email', label: 'Email', id: 'otherEmail', isRequired: false, value: '' },
    phoneNumber: { type: 'tel', label: 'Phone Number', id: 'otherPhoneNumber', isRequired: false, value: '' },
  }
});

// Define category configurations
const categoryConfigs = {
  'Active Speaker': {
    visibleFields: {
      symptomInfo: ['symptomArea', 'symptomFound', 'symptomOccurrence'],
      technicalInfo: ['mainsVoltageType', 'mainsVoltageRange'],
      additionalInfo: ['media','note']
    }
  },
  'Passive Speaker': {
    visibleFields: {
      symptomInfo: ['symptomArea', 'symptomFound', 'symptomOccurrence'],
      additionalInfo: ['media', 'note']
    }
  },
  'Processor': {
    visibleFields: {
      symptomInfo: ['symptomArea', 'symptomFound', 'symptomOccurrence'],
      technicalInfo: ['mainsVoltageType', 'mainsVoltageRange'],
      additionalInfo: ['media','note']
    }
  }
};

// Verify categoryConfigs is correctly added to productData
console.log('Category Configs:', categoryConfigs);

// Use computed properties from the store instead of local definitions
const categoryModels = computed(() => productStore.categoryModels);

const productData = ref({
  basicInfo: {
    category: { 
      type: 'select', 
      label: 'Category', 
      id: 'category', 
      isRequired: true, 
      value: '', 
      options: []
    },
    model: { 
      type: 'select', 
      label: 'Model', 
      id: 'model', 
      isRequired: true, 
      value: '', 
      options: [] 
    },
    serialNumber: { 
      type: 'text', 
      label: 'Serial Number', 
      id: 'serialNumber', 
      isRequired: true, 
      value: '' 
    },
  },
  // Add categoryConfigs to productData
  categoryConfigs: categoryConfigs,
  symptomInfo: {
    symptomArea: { 
      type: 'select', 
      label: 'Symptom Area', 
      id: 'symptomArea', 
      isRequired: true, 
      value: '', 
      options: [] 
    },
    symptomFound: { 
      type: 'select', 
      label: 'Symptom Found', 
      id: 'symptomFound', 
      isRequired: true, 
      value: '', 
      options: [] 
    },
    symptomOccurrence: { 
      type: 'select', 
      label: 'Symptom Occurrence', 
      id: 'symptomOccurrence', 
      isRequired: true, 
      value: '', 
      options: [
        "After a while",
        "After long time switched off",
        "After product upgrade",
        "Constantly",
        "Due to a physical damage",
        "In a cold environment",
        "In a hot environment",
        "In a wet environment",
        "Intermittently",
        "Liquid contamination",
        "One time event",
        "Switched on the first time",
        "Under stressed condition",
        "Under vibration",
        "When switching"
    ] 
    },
    extendedCondition: { type: 'text', label: 'Extended Condition', id: 'extendedCondition', isRequired: false, value: '' },
  },
  technicalInfo: {
    mainsVoltageType: { 
      type: 'select', 
      label: 'Mains Voltage Type', 
      id: 'mainsVoltageType', 
      isRequired: true, 
      value: '', 
      options: ['Single_phase',
    'Bi_phase',
    'Three_phase_with_neutral',
    'Three_phase_without_neutral'] // Remove hardcoded options, will be set in ProductsStep
    },
    mainsVoltageRange: { 
      type: 'select',  // Changed to select type
      label: 'Mains Voltage Range', 
      id: 'mainsVoltageRange', 
      isRequired: true, 
      value: '',
      options: ['<100VAC', '200-240V', '>240VAC', '>240V'] // Will be populated based on voltage type
    },
    outputLoad: { type: 'text', label: 'Output Load', id: 'outputLoad', isRequired: true, value: '' },
    loadConnectionMode: { type: 'select', label: 'Load Connection Mode', id: 'loadConnectionMode', isRequired: true, value: '', options: ['Mode 1', 'Mode 2', 'Mode 3'] },
  },
  serialNumbers: {
    dspSerialNumber: { type: 'text', label: 'DSP Serial Number', id: 'dspSerialNumber', isRequired: true, value: '' },
    ampliSerialNumber: { type: 'text', label: 'Ampli Serial Number', id: 'ampliSerialNumber', isRequired: true, value: '' },
  },
  versions: {
    fwVersion: { type: 'text', label: 'FW Version', id: 'fwVersion', isRequired: true, value: '' },
    swVersion: { type: 'text', label: 'SW Version', id: 'swVersion', isRequired: true, value: '' },
  },
  additionalInfo: {
    installationType: { type: 'select', label: 'Installation Type', id: 'installationType', isRequired: true, value: '', options: ['Type 1', 'Type 2', 'Type 3'] },
    note: { type: 'textarea', label: 'Note', id: 'note', isRequired: false, value: '' },
    importantInformation: { type: 'textarea', label: 'Important Information', id: 'importantInformation', isRequired: false, value: '' },
    media: {type: 'media', label: 'Media', id: 'media', isRequired: false, value: ''},
  }
});

const additionalData = ref([]);
const newData = ref('');
const savedProducts = ref([]);
const productToEdit = ref(null);

const stepValidations = ref({
    0: false,  // Confirmation step
    1: false,  // General Data step
    2: false,  // Products step
    3: false,  // Summary step
    4: false,  // Success step
});

const getStepPercentage = (stepNumber) => {
    switch (stepNumber) {
        case 0: return 5;   // Confirmation step (5%)
        case 1: return 20;  // General info (25% total)
        case 2: return 25;  // Products (50% total)
        case 3: return 25;  // Summary (75% total)
        case 4: return 25;  // Success (100% total)
        default: return 0;
    }
};

// Update progress calculation to use specific percentages
const progressWidth = computed(() => {
    let total = 0;
    Object.entries(stepValidations.value).forEach(([step, isValid]) => {
        if (isValid) {
            total += getStepPercentage(parseInt(step));
        }
    });
    return `${total}%`;
});

// Handle confirmation step completion
watch(() => confirmed.value, (newValue) => {
    handleStepValidation(0, newValue);
});

// Auto-validate both steps immediately when reaching success step
watch(() => step.value, (newStep) => {
    if (newStep === 3) {
        handleStepValidation(3, true);
    } else if (newStep === 4) {
        // Ensure all previous steps are validated
        handleStepValidation(0, true);
        handleStepValidation(1, true);
        handleStepValidation(2, true);
        handleStepValidation(3, true);
        handleStepValidation(4, true);
    }
}, { immediate: true });

const handleStepValidation = (stepNumber, isValid) => {
    stepValidations.value[stepNumber] = isValid;
};

const nextStep = () => {
  confirmed.value = true;
  if (step.value === 3) {
    // Validate all steps before moving to success
    Object.keys(stepValidations.value).forEach(step => {
        handleStepValidation(Number(step), true);
    });
    submitForm();
  } else if (step.value < 4) {
    step.value++;
  }
  productToEdit.value = null; // Clear edit mode when moving forward
};

const prevStep = () => {
  if (step.value > 1) step.value--;
};

const saveData = () => {
  if (newData.value) {
    additionalData.value.push(newData.value);
    newData.value = '';
    showModal.value = false;
  }
};

const generateRecapContent = () => {
    const content = [];
    
    // Add header
    content.push('DEFEKT REPORT RECAP\n');
    content.push('===================\n\n');

    // Add company information
    content.push('COMPANY INFORMATION');
    content.push('------------------');
    Object.entries(generalData.value.companyData).forEach(([key, field]) => {
        if (field.value) content.push(`${field.label}: ${field.value}`);
    });
    content.push('');

    // Add freight forwarder information
    content.push('FREIGHT FORWARDER');
    content.push('----------------');
    Object.entries(generalData.value.freightForwarderData).forEach(([key, field]) => {
        if (field.value) content.push(`${field.label}: ${field.value}`);
    });
    content.push('');

    // Add company address
    content.push('COMPANY ADDRESS');
    content.push('--------------');
    Object.entries(generalData.value.companyAddress).forEach(([key, field]) => {
        if (field.value) content.push(`${field.label}: ${field.value}`);
    });
    content.push('');

    // Add return address if present
    if (generalData.value.otherReturnAddress.address.value) {
        content.push('RETURN ADDRESS');
        content.push('-------------');
        Object.entries(generalData.value.otherReturnAddress).forEach(([key, field]) => {
            if (field.value) content.push(`${field.label}: ${field.value}`);
        });
        content.push('');
    }

    // Add products information
    content.push('PRODUCTS');
    content.push('--------');
    savedProducts.value.forEach((product, index) => {
        content.push(`Product ${index + 1}:`);
        content.push(`Model: ${product.basicInfo.model.value}`);
        content.push(`Serial Number: ${product.basicInfo.serialNumber.value}`);
        content.push(`Category: ${product.basicInfo.category.value}`);
        
        if (product.defekts?.length) {
            content.push('\nDefects:');
            product.defekts.forEach((defekt, dIndex) => {
                content.push(`\nDefect ${dIndex + 1}:`);
                
                // Symptom Information
                content.push('Symptom Information:');
                content.push(`- Area: ${defekt.symptomInfo.symptomArea.value}`);
                content.push(`- Symptom: ${defekt.symptomInfo.symptomFound.value}`);
                content.push(`- Occurrence: ${defekt.symptomInfo.symptomOccurrence.value}`);
                if (defekt.symptomInfo.extendedCondition.value) {
                    content.push(`- Extended Condition: ${defekt.symptomInfo.extendedCondition.value}`);
                }

                // Technical Information
                content.push('\nTechnical Information:');
                if (defekt.technicalInfo.mainsVoltageType.value) {
                    content.push(`- Mains Voltage Type: ${defekt.technicalInfo.mainsVoltageType.value}`);
                    content.push(`- Mains Voltage Range: ${defekt.technicalInfo.mainsVoltageRange.value}`);
                }
                if (defekt.technicalInfo.outputLoad.value) {
                    content.push(`- Output Load: ${defekt.technicalInfo.outputLoad.value}`);
                }
                if (defekt.technicalInfo.loadConnectionMode.value) {
                    content.push(`- Load Connection Mode: ${defekt.technicalInfo.loadConnectionMode.value}`);
                }

                // Serial Numbers
                if (defekt.serialNumbers) {
                    content.push('\nSerial Numbers:');
                    if (defekt.serialNumbers.dspSerialNumber.value) {
                        content.push(`- DSP: ${defekt.serialNumbers.dspSerialNumber.value}`);
                    }
                    if (defekt.serialNumbers.ampliSerialNumber.value) {
                        content.push(`- Amplifier: ${defekt.serialNumbers.ampliSerialNumber.value}`);
                    }
                }

                // Versions
                if (defekt.versions) {
                    content.push('\nVersions:');
                    if (defekt.versions.fwVersion.value) {
                        content.push(`- Firmware: ${defekt.versions.fwVersion.value}`);
                    }
                    if (defekt.versions.swVersion.value) {
                        content.push(`- Software: ${defekt.versions.swVersion.value}`);
                    }
                }

                // Additional Information
                content.push('\nAdditional Information:');
                if (defekt.additionalInfo.installationType.value) {
                    content.push(`- Installation Type: ${defekt.additionalInfo.installationType.value}`);
                }
                if (defekt.additionalInfo.note.value) {
                    content.push(`- Note: ${defekt.additionalInfo.note.value}`);
                }
                if (defekt.additionalInfo.importantInformation.value) {
                    content.push(`- Important Information: ${defekt.additionalInfo.importantInformation.value}`);
                }
                content.push(''); // Add blank line between defects
            });
        }
        content.push('\n'); // Add blank line between products
    });

    return content.join('\n');
};

const downloadRecap = () => {
    const content = generateRecapContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'defekt_report_recap.txt';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};

// Update submitForm function
const submitForm = () => {
    downloadRecap();
    step.value = 4;
};

const handleEditProduct = (index) => {
    const productToBeEdited = savedProducts.value[index];
    // Ensure we store the model information before editing
    productToBeEdited.modelName = productToBeEdited.basicInfo.model.value;
    productToEdit.value = productToBeEdited;
    step.value = 2; // Go back to Products step
};

const handlePrevStep = () => {
    productToEdit.value = null;
    step.value--;
};

// Helper function to update dependent dropdowns
const updateDependentOptions = (product) => {
  if (!product) return;

  // Update model options when category changes
  if (product.basicInfo.category.value) {
    product.basicInfo.model.options = productStore.getModelsForCategory(product.basicInfo.category.value) || [];
    product.basicInfo.model.value = ''; // Reset model
    product.symptomInfo.symptomArea.value = ''; // Reset area
    product.symptomInfo.symptomFound.value = ''; // Reset symptom
  }

  // Update symptom area options when model changes
  if (product.basicInfo.model.value) {
    product.symptomInfo.symptomArea.options = productStore.getSymptomAreasForModel(product.basicInfo.model.value) || [];
    product.symptomInfo.symptomArea.value = ''; // Reset area
    product.symptomInfo.symptomFound.value = ''; // Reset symptom
  }

  // Update symptom found options when area changes
  if (product.symptomInfo.symptomArea.value) {
    product.symptomInfo.symptomFound.options = productStore.getSymptomsForArea(product.symptomInfo.symptomArea.value) || [];
    product.symptomInfo.symptomFound.value = ''; // Reset symptom
  }
};

// Watch for changes in currentProduct in ProductsStep
provide('updateDependentOptions', updateDependentOptions);

// Initialize category options when store is loaded
watch(() => categoryModels.value, (newCategories) => {
  if (newCategories && Object.keys(newCategories).length > 0) {
    productData.value.basicInfo.category.options = Object.keys(newCategories);
  }
}, { immediate: true });

// Initialize the store when component is mounted
onMounted(async () => {
  await productStore.loadConfiguration();
  console.log('Product store initialized:', {
    categories: productStore.categories,
    categoryModels: productStore.categoryModels,
    modelSymptomAreas: productStore.modelSymptomAreas,
    symptomsByArea: productStore.symptomsByArea,
    categoryConfigs: productStore.categoryConfigs,
    formConfig: productStore.formConfig,
    productMapping: productStore.productMapping
  });
  
  // Test the getCategoryVisibleFields method
  if (productStore.categories && productStore.categories.length > 0) {
    const testCategory = productStore.categories[0];
    console.log(`Testing getCategoryVisibleFields for "${testCategory}":`, 
      productStore.getCategoryVisibleFields(testCategory));
  }
});
</script>

<template>
  <main>
    <div class="container px-4 px-md-0 mt-5 mx-auto">
      <div v-if="confirmed">
        <TheProgressBar :progressWidth="progressWidth" />
      </div>

      <div v-if="step === 0" class="confirmation-step col-12">
        <ConfirmationStep 
            :confirmed="confirmed" 
            @next-step="nextStep" 
        />
      </div>

      <div v-else-if="step === 1" class="col-12">
        <GeneralDataStep 
            :generalData="generalData" 
            @next-step="nextStep" 
            @prev-step="prevStep"
            @step-validation="(isValid) => handleStepValidation(1, isValid)"
        />
      </div>

      <div v-else-if="step === 2">
        <ProductsStep 
            :productData="productData" 
            :productToEdit="productToEdit"
            v-model:savedProducts="savedProducts"
            @next-step="nextStep" 
            @prev-step="handlePrevStep"
            @step-validation="(isValid) => handleStepValidation(2, isValid)"
        />
      </div>

      <div v-else-if="step === 3">
        <SummaryStep 
            :generalData="generalData"
            :savedProducts="savedProducts"
            @prev-step="handlePrevStep"
            @next-step="nextStep"
            @edit-product="handleEditProduct"
            @delete-product="(index) => savedProducts.splice(index, 1)"
        />
      </div>
      
      <div v-else-if="step === 4">
        <SuccessStep />
      </div>
      
    </div>
  </main>
</template>
