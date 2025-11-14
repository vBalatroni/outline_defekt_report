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
        HTML Raw
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
        rows="8"
        spellcheck="false"
      ></textarea>
      <small class="editor-hint">Inserisci HTML raw. Esempio: &lt;p&gt;Testo&lt;/p&gt; o &lt;ul&gt;&lt;li&gt;Item&lt;/li&gt;&lt;/ul&gt;</small>
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
        <div class="pane-header">HTML Raw</div>
        <textarea
          :value="textValue"
          :placeholder="placeholder"
          @input="handleTextUpdate"
          class="text-editor"
          rows="8"
          spellcheck="false"
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

// Mostra l'HTML raw direttamente
const textValue = computed({
  get: () => props.modelValue || '',
  set: (val) => {
    // L'utente inserisce HTML raw direttamente
    emit('update:modelValue', val || '');
  },
});

const handleUpdate = (html) => {
  emit('update:modelValue', html);
};

const handleTextUpdate = (event) => {
  // L'utente inserisce HTML raw direttamente
  emit('update:modelValue', event.target.value || '');
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

.editor-hint {
  display: block;
  margin-top: 0.5rem;
  color: #6b7280;
  font-size: 0.75rem;
  font-style: italic;
}

@media (max-width: 768px) {
  .split-container {
    grid-template-columns: 1fr;
  }
}
</style>

