<script setup>
import { ref, computed } from 'vue';
import TheWelcome from '../components/TheWelcome.vue';
import TheProgressBar from '@/components/TheProgressBar.vue';
import ConfirmationStep from '@/components/ConfirmationStep.vue';
import Button from '@/components/Button.vue';
import GeneralDataStep from '@/components/GeneralDataStep.vue';
import ProductsStep from '@/components/ProductsStep.vue';

const step = ref(0);
const confirmed = ref(false);
const formData = ref({
  name: '',
  surname: '',
});
const generalData = ref({
  companyData: { 
    companyName: { type: 'text', label: 'Company Name', id: 'companyName', isRequired: false, value: '' },
    vatNumber: { type: 'text', label: 'VAT Number', id: 'vatNumber', isRequired: false, value: '' },
  },
  freightForwarderData: {
    freightForwarderName: { type: 'text', label: 'Freight Forwarder Name', id: 'freightForwarderName', isRequired: false, value: '' },
    accountNumber: { type: 'text', label: 'Account Number', id: 'accountNumber', isRequired: false, value: '' },
  },
  companyAddress: {
    address: { type: 'text', label: 'Address', id: 'address', isRequired: false, value: '' },
    city: { type: 'text', label: 'City', id: 'city', isRequired: false, value: '' },
    country: { type: 'text', label: 'Country', id: 'country', isRequired: false, value: '' },
    zipCode: { type: 'text', label: 'Zip Code', id: 'zipCode', isRequired: false, value: '' },
    contactPersonName: { type: 'text', label: 'Contact Person Name', id: 'contactPersonName', isRequired: false, value: '' },
    eMail: { type: 'email', label: 'Email', id: 'eMail', isRequired: false, value: '' },
    phoneNumber: { type: 'tel', label: 'Phone Number', id: 'phoneNumber', isRequired: false, value: '' },
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

const productData = ref({
  basicInfo: {
    category: { type: 'select', label: 'Category', id: 'category', isRequired: true, value: '', options: ['Category 1', 'Category 2', 'Category 3'] },
    model: { type: 'select', label: 'Model', id: 'model', isRequired: true, value: '', options: ['Model 1', 'Model 2', 'Model 3'] },
    serialNumber: { type: 'text', label: 'Serial Number', id: 'serialNumber', isRequired: true, value: '' },
  },
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
  }
});

const additionalData = ref([]);
const newData = ref('');
const downloadRecap = ref(false);

const progressWidth = computed(() => `${(step.value - 1) * 20}%`);

const nextStep = () => {
  console.log('we')
  confirmed.value = true;
  if (step.value < 6) step.value++;
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

const submitForm = () => {
  alert("Form inviato con successo!");
  step.value = 6;
};
</script>

<template>
  <main>
    <div class="container px-0 mx-auto">
      <div v-if="confirmed">
        <TheProgressBar :progressWidth="progressWidth" />
      </div>

      <div v-if="step === 0" class="confirmation-step col-12">
        {{ confirmed }}
        <ConfirmationStep :confirmed.sync="confirmed" @next-step="nextStep" />
      </div>

      <div v-else-if="step === 1" class="col-12">
        <GeneralDataStep :generalData="generalData" @next-step="nextStep" @prev-step="prevStep" />
      </div>

      <div v-else-if="step === 2">
        <ProductsStep :productData="productData" @next-step="nextStep" @prev-step="prevStep"/>
      </div>

      
    </div>
  </main>
</template>
