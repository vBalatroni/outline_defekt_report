<script setup>
import { ref, computed } from 'vue';
import TheWelcome from '../components/TheWelcome.vue';
import TheProgressBar from '@/components/TheProgressBar.vue';
import ConfirmationStep from '@/components/ConfirmationStep.vue';
import Button from '@/components/Button.vue';
import GeneralDataStep from '@/components/GeneralDataStep.vue';

const step = ref(0);
const confirmed = ref(false);
const showModal = ref(false);
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
    freightForwarderName: { type: 'text', label: 'Freight Forwarder Name', id: 'freightForwarderName', isRequired: true, value: '' },
    accountNumber: { type: 'text', label: 'Account Number', id: 'accountNumber', isRequired: true, value: '' },
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

const additionalData = ref([]);
const newData = ref('');
const downloadRecap = ref(false);

const progressWidth = computed(() => `${(step.value - 1) * 20}%`);

const nextStep = () => {
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

      <div v-else-if="step === 3">
        <h3>Compila Dati Aggiuntivi</h3>
        <button class="btn btn-primary" @click="showModal = true">Apri Modale</button>
        <button class="btn btn-secondary mt-3" @click="prevStep">Indietro</button>
        <button class="btn btn-primary mt-3 ms-2" @click="nextStep">Avanti</button>
      </div>

      <div v-if="showModal" class="modal d-block" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Compila Dati</h5>
            </div>
            <div class="modal-body">
              <input v-model="newData" type="text" class="form-control" placeholder="Inserisci dato" />
            </div>
            <div class="modal-footer">
              <button class="btn btn-danger" @click="showModal = false">Cancella</button>
              <button class="btn btn-primary" @click="saveData">Salva</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
