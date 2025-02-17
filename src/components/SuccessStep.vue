<script setup>
import SectionHeader from './StepHeader.vue';
import Button from './Button.vue';

const handleClose = () => {
    window.close();
};
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
