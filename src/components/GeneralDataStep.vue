<script setup>
import { defineProps } from 'vue';
import SectionHeader from './StepHeader.vue';
const props = defineProps({
    generalData: {
        type: Object,
        required: true
    },

});
</script>
<template>
     <div class="general-data-step">
        <div class="general-data-wrapper">
            <SectionHeader title="General Information" />
            <input v-model="generalData.companyData.companyName.label" type="text" class="form-control" placeholder="Nome" />
            <button class="btn btn-secondary mt-3" @click="prevStep">Indietro</button>
            <button class="btn btn-primary mt-3 ms-2" @click="nextStep">Avanti</button>
        </div>
    </div>
</template>
<style>
</style>