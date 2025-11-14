<template>
  <div class="intro-editor">
    <div class="editor-header">
      <div class="header-title">
        <h2>Acceptance Page</h2>
        <span v-if="hasUnsavedChanges" class="unsaved-indicator">● Unsaved changes</span>
        <span v-if="loadingIndicator" class="admin-reload-indicator">
          <span class="admin-spinner"></span>
          Reloading...
        </span>
      </div>
      <div class="header-actions">
        <button
          class="admin-btn admin-btn-muted"
          type="button"
          @click="resetToDefaults"
          :disabled="isSaving"
        >
          Reset to defaults
        </button>
        <button
          class="admin-btn admin-btn-muted"
          type="button"
          @click="reloadFromServer"
          :disabled="isReloading"
        >
          Reload from server
        </button>
        <button
          class="admin-btn admin-btn-primary"
          type="button"
          @click="saveIntroContent"
          :disabled="isSaving || !hasUnsavedChanges"
        >
          {{ isSaving ? 'Saving...' : 'Save to Server' }}
        </button>
      </div>
    </div>

    <div class="admin-toast-stack" aria-live="polite" aria-atomic="true">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="admin-toast"
        :class="`admin-toast-${t.type || 'info'}`"
      >
        <span class="admin-toast-message">{{ t.message }}</span>
        <button class="admin-toast-close" @click="removeToast(t.id)">×</button>
      </div>
    </div>

    <div class="editor-card">
      <div class="grid">
        <div class="form-group">
          <label for="intro-title">Title</label>
          <WysiwygEditor
            id="intro-title"
            v-model="introForm.title"
            placeholder="Inserisci il titolo..."
          />
        </div>
        <div class="form-group">
          <label for="intro-subtitle">Subtitle</label>
          <WysiwygEditor
            id="intro-subtitle"
            v-model="introForm.subtitle"
            placeholder="Inserisci il sottotitolo..."
          />
        </div>
        <div class="form-group">
          <label for="intro-checkbox">Checkbox label</label>
          <WysiwygEditor
            id="intro-checkbox"
            v-model="introForm.checkboxLabel"
            placeholder="Inserisci l'etichetta della checkbox..."
          />
        </div>
        <div class="form-group">
          <label for="intro-button">Primary button label</label>
          <WysiwygEditor
            id="intro-button"
            v-model="introForm.startButtonLabel"
            placeholder="Inserisci l'etichetta del pulsante..."
          />
        </div>
      </div>

      <div class="form-group">
        <label for="intro-bullets">Checklist items</label>
        <WysiwygEditor
          id="intro-bullets"
          v-model="bulletText"
          placeholder="Inserisci gli elementi della checklist..."
        />
        <small>Puoi formattare il testo e creare liste.</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch, computed, nextTick } from 'vue';
import { useProductStore, defaultIntroContent } from '@/stores/productStore';
import WysiwygEditor from '@/components/WysiwygEditor.vue';

const store = useProductStore();

const introForm = reactive({
  title: '',
  subtitle: '',
  checkboxLabel: '',
  startButtonLabel: '',
});

const bulletText = ref('');
const isSaving = ref(false);
const isReloading = ref(false);
const hasUnsavedChanges = ref(false);
const isSyncing = ref(false);
const formSnapshot = ref('');

const toasts = ref([]);
const showToast = ({ message, type = 'info', duration = 4000 }) => {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  toasts.value.push({ id, message, type });
  if (duration) {
    setTimeout(() => removeToast(id), duration);
  }
};
const removeToast = (id) => {
  toasts.value = toasts.value.filter((t) => t.id !== id);
};

const loadingIndicator = computed(() => isReloading.value || store.isLoading);
const currentIntro = computed(() => store.productMapping?.introContent || defaultIntroContent);

// Funzione helper per estrarre testo da HTML o gestire liste HTML
const extractBulletPoints = (html) => {
  if (!html || !html.trim()) return [];
  
  // Crea un elemento temporaneo per parsare l'HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Cerca liste (ul/ol)
  const lists = tempDiv.querySelectorAll('ul, ol');
  if (lists.length > 0) {
    const items = [];
    lists.forEach(list => {
      list.querySelectorAll('li').forEach(li => {
        const text = li.textContent.trim();
        if (text) items.push(text);
      });
    });
    if (items.length > 0) return items;
  }
  
  // Se non ci sono liste, cerca paragrafi o div
  const paragraphs = tempDiv.querySelectorAll('p, div');
  if (paragraphs.length > 0) {
    const items = paragraphs
      .map(p => p.textContent.trim())
      .filter(Boolean);
    if (items.length > 0) return items;
  }
  
  // Fallback: estrai tutto il testo e dividi per newline
  const text = tempDiv.textContent || tempDiv.innerText || '';
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
};

// Funzione helper per rimuovere tag HTML e ottenere testo pulito per confronti
const stripHtml = (html) => {
  if (!html) return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

const serializeForm = () => {
  const bullets = extractBulletPoints(bulletText.value);
  return JSON.stringify({
    title: introForm.title || '',
    subtitle: introForm.subtitle || '',
    checkboxLabel: introForm.checkboxLabel || '',
    startButtonLabel: introForm.startButtonLabel || '',
    bulletPoints: bullets,
  });
};

const resetDirty = () => {
  formSnapshot.value = serializeForm();
  hasUnsavedChanges.value = false;
};

// Funzione helper per convertire array di stringhe in HTML lista
const convertBulletsToHtml = (bullets) => {
  if (!Array.isArray(bullets) || bullets.length === 0) return '';
  // Crea una lista HTML non ordinata
  const items = bullets.map(bullet => {
    // Se il bullet è già HTML, usalo direttamente, altrimenti escape
    if (typeof bullet === 'string' && (bullet.includes('<') || bullet.includes('&lt;'))) {
      return `<li>${bullet}</li>`;
    }
    // Escape HTML per sicurezza
    const div = document.createElement('div');
    div.textContent = bullet;
    return `<li>${div.innerHTML}</li>`;
  }).join('');
  return `<ul>${items}</ul>`;
};

const applyIntroToForm = (source, { resetSnapshot = true } = {}) => {
  isSyncing.value = true;
  // Mantieni HTML se presente, altrimenti usa testo semplice
  introForm.title = source.title || '';
  introForm.subtitle = source.subtitle || '';
  introForm.checkboxLabel = source.checkboxLabel || '';
  introForm.startButtonLabel = source.startButtonLabel || '';
  const bullets = Array.isArray(source.bulletPoints) ? source.bulletPoints : defaultIntroContent.bulletPoints;
  // Converti array in HTML lista
  bulletText.value = convertBulletsToHtml(bullets);
  nextTick(() => {
    if (resetSnapshot) {
      resetDirty();
    } else {
      hasUnsavedChanges.value = serializeForm() !== formSnapshot.value;
    }
    isSyncing.value = false;
  });
};

watch(currentIntro, (val) => {
  applyIntroToForm(val || defaultIntroContent, { resetSnapshot: true });
}, { immediate: true, deep: true });

watch(
  [
    () => introForm.title,
    () => introForm.subtitle,
    () => introForm.checkboxLabel,
    () => introForm.startButtonLabel,
    () => bulletText.value,
  ],
  () => {
    if (isSyncing.value) return;
    hasUnsavedChanges.value = serializeForm() !== formSnapshot.value;
  },
  { deep: true }
);

const resetToDefaults = () => {
  applyIntroToForm(defaultIntroContent, { resetSnapshot: false });
};

const buildIntroPayload = () => {
  const introSnapshot = JSON.parse(serializeForm());
  if (!introSnapshot.bulletPoints.length) {
    introSnapshot.bulletPoints = [...defaultIntroContent.bulletPoints];
  }
  return {
    title: introSnapshot.title || defaultIntroContent.title,
    subtitle: introSnapshot.subtitle || defaultIntroContent.subtitle,
    checkboxLabel: introSnapshot.checkboxLabel || defaultIntroContent.checkboxLabel,
    startButtonLabel: introSnapshot.startButtonLabel || defaultIntroContent.startButtonLabel,
    bulletPoints: introSnapshot.bulletPoints,
  };
};

const saveIntroContent = async () => {
  if (isSaving.value || !hasUnsavedChanges.value) return;
  isSaving.value = true;
  try {
    const mapping = JSON.parse(JSON.stringify(store.productMapping || {}));
    mapping.introContent = buildIntroPayload();

    const response = await fetch('/config/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapping, null, 2),
    });

    if (!response.ok) {
      const payload = await response.text();
      throw new Error(payload || `Server responded with ${response.status}`);
    }

    await store.loadConfiguration();
    showToast({ message: 'Acceptance page updated successfully.', type: 'success' });
    resetDirty();
  } catch (error) {
    console.error(error);
    showToast({ message: error.message || 'Failed to save acceptance page.', type: 'danger', duration: 6000 });
  } finally {
    isSaving.value = false;
  }
};

const reloadFromServer = async () => {
  if (isReloading.value) return;
  isReloading.value = true;
  try {
    await store.loadConfiguration();
    applyIntroToForm(currentIntro.value || defaultIntroContent);
    showToast({ message: 'Acceptance page reloaded.', type: 'info' });
  } catch (error) {
    console.error(error);
    showToast({ message: error.message || 'Failed to reload acceptance page.', type: 'danger', duration: 6000 });
  } finally {
    isReloading.value = false;
  }
};
</script>

<style scoped>
.intro-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.unsaved-indicator {
  color: #f39c12;
  font-weight: 600;
  font-size: 0.85rem;
}

.editor-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-weight: 600;
  color: #1f2937;
}

.form-group input,
.form-group textarea {
  padding: 0.65rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  background-color: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.15rem rgba(13, 110, 253, 0.15);
}

.form-group small {
  color: #6b7280;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}
</style>

