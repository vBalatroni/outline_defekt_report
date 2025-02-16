<script setup>
import { ref, computed } from 'vue';
import TheWelcome from '../components/TheWelcome.vue';
import TheProgressBar from '@/components/TheProgressBar.vue';
import ConfirmationStep from '@/components/ConfirmationStep.vue';
import Button from '@/components/Button.vue';

const step = ref(1);
const confirmed = ref(false);
const showModal = ref(false);
const formData = ref({
  name: '',
  surname: ''
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
    <div class="container mx-auto">
      <div v-if="confirmed">
        <TheProgressBar :progressWidth="progressWidth" />
      </div>

      <div v-if="step === 1" class="confirmation-step col-12">
        {{ confirmed }}

        <ConfirmationStep :confirmed.sync="confirmed" @next-step="nextStep" />
      </div>

      <div v-else-if="step === 2">
        <h3>Dati Anagrafici</h3>
        <input v-model="formData.name" type="text" class="form-control" placeholder="Nome" />
        <input v-model="formData.surname" type="text" class="form-control mt-2" placeholder="Cognome" />
        <button class="btn btn-secondary mt-3" @click="prevStep">Indietro</button>
        <button class="btn btn-primary mt-3 ms-2" @click="nextStep">Avanti</button>
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

<style scoped>
body {
  font-family: var(--font-family);
}

.container {
  max-width: 1090px;
  margin: auto;
}

.step-list {
  text-align: left;
  margin: 20px 0;
  padding-left: 20px;
}

.step-list li {
  font-size: 1rem;
}

.custom-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal {
  background: rgba(0, 0, 0, 0.5);
}
</style>
