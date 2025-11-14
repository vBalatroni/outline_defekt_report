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

// Helper per estrarre testo da HTML per il pulsante
const getButtonText = () => {
    const html = introContent.value.startButtonLabel || '';
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
};

// Helper per renderizzare i bullet points come HTML
const renderBulletPoints = () => {
    const bullets = introContent.value.bulletPoints || [];
    if (bullets.length === 0) return '';
    
    // Se i bullet points sono già HTML (contengono tag), usa direttamente
    // Altrimenti crea una lista HTML
    const items = bullets.map(bullet => {
        // Se contiene tag HTML, usa direttamente
        if (typeof bullet === 'string' && (bullet.includes('<') || bullet.includes('&lt;'))) {
            return `<li>${bullet}</li>`;
        }
        // Altrimenti escape e usa come testo
        return `<li>${escapeHtml(bullet)}</li>`;
    }).join('');
    
    return `<ul class="step-list mt-0">${items}</ul>`;
};

// Helper per escape HTML (solo se necessario)
const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};
</script>

<template>
    <div class="confirmation-step">
        <div class="confirmation-wrapper">
            <StepHeader :title="introContent.title" :subtitle="introContent.subtitle"/>
            <div class="step-body">
                <div class="step-list" v-html="renderBulletPoints()"></div>
                <div class="form-check custom-checkbox d-flex">
                    <input v-model="isConfirmed" type="checkbox" class="form-check-input" id="confirmCheck" />
                    <label class="form-check-label" for="confirmCheck" v-html="introContent.checkboxLabel"></label>
                </div>
                <div class="button-group">
                    <Button :type="'primary'" :text="getButtonText()" :isDisabled="!isConfirmed" @click="nextStep"></Button>
                </div>
            </div>
        </div>
    </div>
</template>


