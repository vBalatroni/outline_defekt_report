<template>
  <div class="wysiwyg-or-text-editor">
    <div class="editor-mode-toggle">
      <button
        type="button"
        class="mode-btn"
        :class="{ active: mode === 'wysiwyg' }"
        @click="mode = 'wysiwyg'"
        :disabled="!allowWysiwyg"
      >
        WYSIWYG
      </button>
      <button
        type="button"
        class="mode-btn"
        :class="{ active: mode === 'text' }"
        @click="mode = 'text'"
      >
        Testo
      </button>
      <button
        type="button"
        class="mode-btn"
        :class="{ active: mode === 'split' }"
        @click="mode = 'split'"
        :disabled="!allowWysiwyg"
      >
        Split
      </button>
    </div>
    
    <div v-if="mode === 'wysiwyg' && allowWysiwyg" class="editor-container">
      <WysiwygEditor
        :model-value="modelValue"
        :placeholder="placeholder"
        @update:model-value="handleUpdate"
      />
    </div>
    
    <div v-else-if="mode === 'text'" class="editor-container">
      <textarea
        :value="textValue"
        :placeholder="placeholder"
        @input="handleTextUpdate"
        class="text-editor"
        rows="4"
      ></textarea>
    </div>
    
    <div v-else-if="mode === 'split' && allowWysiwyg" class="split-container">
      <div class="split-pane">
        <div class="pane-header">WYSIWYG</div>
        <WysiwygEditor
          :model-value="modelValue"
          :placeholder="placeholder"
          @update:model-value="handleUpdate"
        />
      </div>
      <div class="split-pane">
        <div class="pane-header">Testo Raw</div>
        <textarea
          :value="textValue"
          :placeholder="placeholder"
          @input="handleTextUpdate"
          class="text-editor"
          rows="4"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import WysiwygEditor from './WysiwygEditor.vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
  allowWysiwyg: {
    type: Boolean,
    default: true,
  },
  defaultMode: {
    type: String,
    default: 'wysiwyg', // 'wysiwyg', 'text', 'split'
  },
});

const emit = defineEmits(['update:modelValue']);

const mode = ref(props.allowWysiwyg ? props.defaultMode : 'text');

// Helper per estrarre testo da HTML
const htmlToText = (html) => {
  if (!html) return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

// Helper per convertire testo in HTML (escape)
const textToHtml = (text) => {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const textValue = computed({
  get: () => htmlToText(props.modelValue),
  set: (val) => {
    // Quando si modifica il testo, convertilo in HTML semplice
    const html = val ? `<p>${textToHtml(val)}</p>` : '';
    emit('update:modelValue', html);
  },
});

const handleUpdate = (html) => {
  emit('update:modelValue', html);
};

const handleTextUpdate = (event) => {
  const text = event.target.value;
  // Converti il testo in HTML semplice
  if (!text.trim()) {
    emit('update:modelValue', '');
  } else {
    // Dividi per righe e crea paragrafi o lista
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      emit('update:modelValue', '');
      return;
    }
    
    // Se ci sono più righe, crea una lista, altrimenti un paragrafo
    const html = lines.length > 1
      ? `<ul>${lines.map(line => `<li>${textToHtml(line.trim())}</li>`).join('')}</ul>`
      : `<p>${textToHtml(lines[0])}</p>`;
    emit('update:modelValue', html);
  }
};

watch(() => props.allowWysiwyg, (allow) => {
  if (!allow && mode.value !== 'text') {
    mode.value = 'text';
  }
});
</script>

<style scoped>
.wysiwyg-or-text-editor {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.editor-mode-toggle {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background-color: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.mode-btn {
  flex: 1;
  padding: 0.4rem 0.75rem;
  border: 1px solid transparent;
  background-color: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s ease;
}

.mode-btn:hover:not(:disabled) {
  background-color: #f3f4f6;
  color: #374151;
}

.mode-btn.active {
  background-color: #0d6efd;
  color: #fff;
  border-color: #0d6efd;
}

.mode-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.editor-container {
  width: 100%;
}

.split-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  width: 100%;
}

.split-pane {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pane-header {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.text-editor {
  width: 100%;
  padding: 0.65rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: 'Courier New', monospace;
  background-color: #fff;
  resize: vertical;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.text-editor:focus {
  outline: none;
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.15rem rgba(13, 110, 253, 0.15);
}

@media (max-width: 768px) {
  .split-container {
    grid-template-columns: 1fr;
  }
}
</style>

