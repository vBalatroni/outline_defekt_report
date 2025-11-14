<template>
  <!-- Componente invisibile che inietta CSS nel DOM -->
</template>

<script setup>
import { computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useProductStore } from '@/stores/productStore';

const store = useProductStore();

let styleElement = null;

const customCss = computed(() => {
  const css = store.productMapping?.customCss;
  if (!css || !css.trim()) return null;
  // Rimuovi eventuali tag <style> esistenti per evitare duplicati
  const cleanCss = css.trim().replace(/<\/?style[^>]*>/gi, '').trim();
  return cleanCss || null;
});

const injectCss = () => {
  // Rimuovi lo style element esistente se presente (cerca anche per ID nel caso non sia stato tracciato)
  const existing = document.getElementById('custom-form-css');
  if (existing) {
    existing.remove();
  }
  if (styleElement) {
    styleElement.remove();
    styleElement = null;
  }

  const css = customCss.value;
  if (!css) return;

  // Crea un nuovo elemento <style>
  styleElement = document.createElement('style');
  styleElement.id = 'custom-form-css';
  styleElement.type = 'text/css';
  styleElement.textContent = css;
  document.head.appendChild(styleElement);
  console.log('Custom CSS injected:', css.substring(0, 50) + '...');
};

const removeCss = () => {
  const existing = document.getElementById('custom-form-css');
  if (existing) {
    existing.remove();
  }
  if (styleElement) {
    styleElement.remove();
    styleElement = null;
  }
};

// Watch sia su customCss che su productMapping per reagire ai cambiamenti
watch(customCss, () => {
  nextTick(() => {
    injectCss();
  });
}, { immediate: true });

// Watch su productMapping.customCss specificamente per evitare watch troppo profondi
watch(() => store.productMapping?.customCss, () => {
  nextTick(() => {
    injectCss();
  });
}, { immediate: false });

// Watch su isLoading per applicare CSS quando la configurazione è stata caricata
watch(() => store.isLoading, (isLoading) => {
  if (!isLoading) {
    // Quando il caricamento è completato, applica il CSS
    nextTick(() => {
      injectCss();
    });
  }
});

onMounted(() => {
  // Aspetta che il DOM sia pronto e che la configurazione sia caricata
  nextTick(() => {
    // Se la configurazione è già caricata, applica subito
    if (!store.isLoading && store.productMapping) {
      injectCss();
    }
  });
});

onBeforeUnmount(() => {
  removeCss();
});
</script>

