<script setup>
import { ref, computed, watch } from 'vue';
import TheWelcome from '../components/TheWelcome.vue';
import TheProgressBar from '@/components/TheProgressBar.vue';
import ConfirmationStep from '@/components/ConfirmationStep.vue';
import Button from '@/components/Button.vue';
import GeneralDataStep from '@/components/GeneralDataStep.vue';
import ProductsStep from '@/components/ProductsStep.vue';
import SummaryStep from '@/components/SummaryStep.vue';
import SuccessStep from '@/components/SuccessStep.vue';

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
      serialNumbers: ['dspSerialNumber'],
      versions: ['fwVersion'],
      additionalInfo: ['media','note']
    }
  },
  'Category 2': {
    visibleFields: {
      symptomInfo: ['symptomArea', 'symptomFound', 'extendedCondition'],
      technicalInfo: ['outputLoad', 'loadConnectionMode'],
      serialNumbers: ['ampliSerialNumber'],
      versions: ['swVersion'],
      additionalInfo: ['installationType', 'importantInformation']
    }
  },
  'Category 3': {
    visibleFields: {
      symptomInfo: ['symptomFound', 'symptomOccurrence', 'extendedCondition'],
      technicalInfo: ['mainsVoltageType', 'outputLoad'],
      serialNumbers: ['dspSerialNumber', 'ampliSerialNumber'],
      versions: ['fwVersion', 'swVersion'],
      additionalInfo: ['note', 'importantInformation']
    }
  }
};

// Verify categoryConfigs is correctly added to productData
console.log('Category Configs:', categoryConfigs);

const productData = ref({
  basicInfo: {
    category: { type: 'select', label: 'Category', id: 'category', isRequired: true, value: '', options: ['Category 1', 'Category 2', 'Category 3'] },
    model: { type: 'select', label: 'Model', id: 'model', isRequired: true, value: '', options: ['Model 1', 'Model 2', 'Model 3'] },
    serialNumber: { type: 'text', label: 'Serial Number', id: 'serialNumber', isRequired: true, value: '' },
  },
  // Add categoryConfigs to productData
  categoryConfigs: categoryConfigs,
  symptomInfo: {
    symptomArea: { type: 'select', label: 'Symptom Area', id: 'symptomArea', isRequired: true, value: '', options: ['Area 1', 'Area 2', 'Area 3'] },
    symptomFound: { type: 'select', label: 'Symptom Found', id: 'symptomFound', isRequired: true, value: '', options: ['Symptom 1', 'Symptom 2', 'Symptom 3'] },
    symptomOccurrence: { type: 'select', label: 'Symptom Occurrence', id: 'symptomOccurrence', isRequired: true, value: '', options: ['Always', 'Sometimes', 'Rarely'] },
    extendedCondition: { type: 'text', label: 'Extended Condition', id: 'extendedCondition', isRequired: false, value: '' },
  },
  technicalInfo: {
    mainsVoltageType: { type: 'select', label: 'Mains Voltage Type', id: 'mainsVoltageType', isRequired: true, value: '', options: ['AC', 'DC'] },
    mainsVoltageRange: { type: 'text', label: 'Mains Voltage Range', id: 'mainsVoltageRange', isRequired: true, value: '' },
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
                content.push(`Symptom: ${defekt.symptomInfo.symptomFound.value}`);
                content.push(`Area: ${defekt.symptomInfo.symptomArea.value}`);
                content.push(`Occurrence: ${defekt.symptomInfo.symptomOccurrence.value}`);
            });
        }
        content.push('\n');
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
    productToEdit.value = savedProducts.value[index];
    step.value = 2; // Go back to Products step
};

const handlePrevStep = () => {
    productToEdit.value = null;
    step.value--;
};
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
