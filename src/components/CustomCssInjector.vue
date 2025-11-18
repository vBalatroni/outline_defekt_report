<template>
  <!-- Componente invisibile che inietta CSS nel DOM -->
</template>

<script setup>
import { computed, watch, onMounted, onBeforeUnmount, nextTick, ref } from 'vue';
import { useProductStore } from '@/stores/productStore';

const store = useProductStore();

let styleElement = null;
const localCss = ref(null);

// In sviluppo locale, carica il file CSS locale
if (import.meta.env.DEV) {
  fetch('/local-custom.css')
    .then(res => res.text())
    .then(css => {
      localCss.value = css.trim();
      console.log('Local CSS loaded from /local-custom.css');
      // Inietta il CSS locale dopo il caricamento
      nextTick(() => {
        injectCss();
      });
    })
    .catch(err => {
      console.warn('Local CSS file not found or error loading:', err);
      // Se il file non esiste, continua senza CSS locale
    });
}

const customCss = computed(() => {
  // In sviluppo, usa il CSS locale se disponibile, altrimenti quello dal backend
  if (import.meta.env.DEV && localCss.value) {
    return localCss.value;
  }
  
  // In produzione, usa sempre il CSS dal backend
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
  
  // Log informativo
  if (import.meta.env.DEV && localCss.value) {
    console.log('✅ CSS locale caricato da /local-custom.css');
  } else {
    console.log('✅ Custom CSS dal backend:', css.substring(0, 50) + '...');
  }
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

// Watch su localCss per re-iniettare quando viene caricato in sviluppo
watch(localCss, () => {
  if (import.meta.env.DEV && localCss.value) {
    nextTick(() => {
      injectCss();
    });
  }
});

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

