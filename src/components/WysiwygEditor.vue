<template>
  <div class="wysiwyg-editor-wrapper">
    <div v-if="editor" class="wysiwyg-toolbar">
      <button
        type="button"
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ 'is-active': editor.isActive('bold') }"
        class="toolbar-btn"
        title="Grassetto"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ 'is-active': editor.isActive('italic') }"
        class="toolbar-btn"
        title="Corsivo"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleStrike().run()"
        :class="{ 'is-active': editor.isActive('strike') }"
        class="toolbar-btn"
        title="Barrato"
      >
        <s>S</s>
      </button>
      <div class="toolbar-divider"></div>
      <button
        type="button"
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="{ 'is-active': editor.isActive('bulletList') }"
        class="toolbar-btn"
        title="Lista puntata"
      >
        <span>• Lista</span>
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleOrderedList().run()"
        :class="{ 'is-active': editor.isActive('orderedList') }"
        class="toolbar-btn"
        title="Lista numerata"
      >
        <span>1. Lista</span>
      </button>
      <div class="toolbar-divider"></div>
      <button
        type="button"
        @click="editor.chain().focus().setParagraph().run()"
        :class="{ 'is-active': editor.isActive('paragraph') }"
        class="toolbar-btn"
        title="Paragrafo"
      >
        P
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
        class="toolbar-btn"
        title="Titolo 1"
      >
        H1
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
        class="toolbar-btn"
        title="Titolo 2"
      >
        H2
      </button>
      <button
        type="button"
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
        class="toolbar-btn"
        title="Titolo 3"
      >
        H3
      </button>
    </div>
    <div class="wysiwyg-editor" :class="{ 'is-focused': isFocused }">
      <EditorContent :editor="editor" />
    </div>
  </div>
</template>

<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { watch, onBeforeUnmount, ref } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const isFocused = ref(false);

const editor = useEditor({
  extensions: [
    StarterKit,
    TextStyle,
    Color,
  ],
  content: props.modelValue,
  placeholder: props.placeholder,
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML());
  },
  onFocus: () => {
    isFocused.value = true;
  },
  onBlur: () => {
    isFocused.value = false;
  },
  editorProps: {
    attributes: {
      class: 'wysiwyg-content',
    },
  },
});

watch(() => props.modelValue, (value) => {
  const isSame = editor.value?.getHTML() === value;
  if (!isSame) {
    editor.value?.commands.setContent(value || '', false);
  }
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<style scoped>
.wysiwyg-editor-wrapper {
  display: flex;
  flex-direction: column;
}

.wysiwyg-toolbar {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  background-color: #f9fafb;
  border: 1px solid #d1d5db;
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  flex-wrap: wrap;
}

.toolbar-btn {
  padding: 0.35rem 0.65rem;
  border: 1px solid transparent;
  background-color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  color: #374151;
}

.toolbar-btn:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.toolbar-btn.is-active {
  background-color: #0d6efd;
  color: #fff;
  border-color: #0d6efd;
}

.toolbar-divider {
  width: 1px;
  height: 1.5rem;
  background-color: #d1d5db;
  margin: 0 0.25rem;
}

.wysiwyg-editor {
  border: 1px solid #d1d5db;
  border-radius: 0 0 6px 6px;
  background-color: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.wysiwyg-editor.is-focused {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.15rem rgba(13, 110, 253, 0.15);
}

:deep(.wysiwyg-content) {
  padding: 0.65rem 0.75rem;
  min-height: 100px;
  outline: none;
  font-size: 0.95rem;
  line-height: 1.5;
}

:deep(.wysiwyg-content p) {
  margin: 0.5em 0;
}

:deep(.wysiwyg-content p:first-child) {
  margin-top: 0;
}

:deep(.wysiwyg-content p:last-child) {
  margin-bottom: 0;
}

:deep(.wysiwyg-content p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #9ca3af;
  pointer-events: none;
  height: 0;
}

:deep(.ProseMirror) {
  outline: none;
}

:deep(.ProseMirror-focused) {
  outline: none;
}
</style>

