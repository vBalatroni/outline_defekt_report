<script setup>
import { computed } from 'vue'; // Import computed
import { useRouter } from 'vue-router';
import { useProductStore, defaultIntroContent } from '@/stores/productStore'; // Import store
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

const introContent = computed(() => {
    const content = store.productMapping?.introContent || {};
    const merged = { ...defaultIntroContent, ...content };
    const bullets = Array.isArray(content.bulletPoints)
        ? content.bulletPoints.filter(item => typeof item === 'string' && item.trim().length)
        : [];
    merged.bulletPoints = bullets.length ? bullets : defaultIntroContent.bulletPoints;
    merged.checkboxLabel = content.checkboxLabel || defaultIntroContent.checkboxLabel;
    merged.startButtonLabel = content.startButtonLabel || defaultIntroContent.startButtonLabel;
    merged.title = content.title || defaultIntroContent.title;
    merged.subtitle = content.subtitle || defaultIntroContent.subtitle;
    return merged;
});

const nextStep = () => {
    // Start the session before navigating away
    store.startSession();
    router.push({ name: 'step-general-data' });
};
</script>

<template>
    <div class="confirmation-step">
        <div class="confirmation-wrapper">
            <StepHeader :title="introContent.title" :subtitle="introContent.subtitle"/>
            <div class="step-body px-2 py-4">
                <ul class="step-list mt-0">
                    <li v-for="(bullet, index) in introContent.bulletPoints" :key="index">{{ bullet }}</li>
                </ul>
                <div class="form-check custom-checkbox d-flex">
                    <input v-model="isConfirmed" type="checkbox" class="form-check-input" id="confirmCheck" />
                    <label class="form-check-label" for="confirmCheck">{{ introContent.checkboxLabel }}</label>
                </div>
                <div class="button-group mt-4">
                    <!-- <Button :type="'secondary'" :text="'Cancel'" :isDisabled="false" ></Button> -->
                    <Button :type="'primary'" :text="introContent.startButtonLabel" :isDisabled="!isConfirmed" @click="nextStep"></Button>
                </div>
            </div>
            <Divider/>
        </div>
    </div>
</template>


