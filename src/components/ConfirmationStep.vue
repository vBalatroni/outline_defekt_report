<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue';
import StepHeader from './StepHeader.vue';
import Button from './Button.vue';
import Divider from './Divider.vue';
const props = defineProps({
    confirmed: {
        type: Boolean,
        required: true
    }
});

const emit = defineEmits(['next-step']);

const localConfirmed = ref(props.confirmed);



const nextStep = () => {
    emit('next-step');
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
                    <input v-model="localConfirmed" type="checkbox" class="form-check-input" id="confirmCheck" />
                    <label class="form-check-label" for="confirmCheck">I confirm that the required checks have been completed.</label>
                </div>
                <div class="button-group mt-4">
                    <!-- <Button :type="'secondary'" :text="'Cancel'" :isDisabled="false" ></Button> -->
                    <Button :type="'primary'" :text="'Start'" :isDisabled="!localConfirmed" @click="nextStep"></Button>
                </div>
            </div>
            <Divider/>
        </div>
    </div>
</template>


