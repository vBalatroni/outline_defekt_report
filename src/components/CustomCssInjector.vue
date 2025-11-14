<template>
  <!-- Componente invisibile che inietta CSS nel DOM -->
</template>

<script setup>
import { computed, watch, onMounted, onBeforeUnmount } from 'vue';
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
  // Rimuovi lo style element esistente se presente
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
};

const removeCss = () => {
  if (styleElement) {
    styleElement.remove();
    styleElement = null;
  }
};

watch(customCss, () => {
  injectCss();
}, { immediate: true });

onMounted(() => {
  injectCss();
});

onBeforeUnmount(() => {
  removeCss();
});
</script>

