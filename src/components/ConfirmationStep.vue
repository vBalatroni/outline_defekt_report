<script setup>
import { computed } from 'vue'; // Import computed
import { useRouter } from 'vue-router';
import { useProductStore } from '@/stores/productStore'; // Import store
import StepHeader from './StepHeader.vue';
import Button from './Button.vue';
import Divider from './Divider.vue';

// Initialize store and router
const store = useProductStore();
const router = useRouter();

// Create a computed property to bind v-model directly to the store state
const isConfirmed = computed({
  get: () => store.formState.isConfirmed,
  set: (value) => store.setConfirmation(value)
});

const nextStep = () => {
    router.push({ name: 'step-general-data' });
};
</script>

<template>
    <div class="confirmation-step">
        <div class="confirmation-wrapper">
            <StepHeader title="Before starting" subtitle="Have you completed all the necessary checks before filling out the Defekt Report?"/>
            <div class="step-body px-2 py-4">
                <ul class="step-list mt-0">
                    <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</li>
                    <li>Pellentesque et tortor congue, congue libero at, interdum ex.</li>
                    <li>Mauris faucibus ipsum in  feugiat feugiat.</li>
                    <li>Aenean sit amet velit cursus, suscipit mi ut, aliquet sapien.</li>
                    <li>Aliquam eleifend nulla pulvinar, feugiat sem id, pretium turpis.</li>
                </ul>
                <div class="form-check custom-checkbox d-flex">
                    <input v-model="isConfirmed" type="checkbox" class="form-check-input" id="confirmCheck" />
                    <label class="form-check-label" for="confirmCheck">I confirm that the required checks have been completed.</label>
                </div>
                <div class="button-group mt-4">
                    <!-- <Button :type="'secondary'" :text="'Cancel'" :isDisabled="false" ></Button> -->
                    <Button :type="'primary'" :text="'Start'" :isDisabled="!isConfirmed" @click="nextStep"></Button>
                </div>
            </div>
            <Divider/>
        </div>
    </div>
</template>


