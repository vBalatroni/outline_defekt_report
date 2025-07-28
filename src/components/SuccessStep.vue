<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProductStore } from '@/stores/productStore';
import SectionHeader from './StepHeader.vue';
import Button from './Button.vue';

const router = useRouter();
const store = useProductStore();

onMounted(() => {
    // Reset the form state as we have successfully completed the flow.
    store.resetForm();
});

const handleClose = () => {
    // Potremmo decidere di fare altro, tipo tornare alla home o resettare lo stato.
    // Per ora, l'azione di chiusura rimane.
    window.close();
};

const startAgain = () => {
    // This action now only needs to navigate. The state is already reset.
    router.push({ name: 'step-confirmation' });
}
</script>

<template>
    <div class="success-step">
        <div class="success-wrapper">
            <SectionHeader title="Defekt Report Submitted" />
            <p class="success-message mt-4">
                Thank you for submitting your Defekt Report. You can now close this page.
            </p>
            <div class="button-wrapper mt-5">
                <Button 
                    :type="'primary'" 
                    :text="'Close Page'" 
                    @click="handleClose"
                />
                <!-- Esempio di un pulsante per ricominciare -->
                <!-- 
                <Button 
                    :type="'secondary'" 
                    :text="'Start Again'" 
                    @click="startAgain"
                    class="ms-3"
                />
                -->
            </div>
        </div>
    </div>
</template>

<style scoped>
.success-step {
    margin-top: 2rem;
}

.success-message {
    font-size: 1.2rem;
}

.button-wrapper {
    display: flex;
    justify-content: flex-start;
}
</style>
