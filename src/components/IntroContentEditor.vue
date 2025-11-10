<template>
  <div class="intro-editor">
    <div class="editor-card">
      <div class="grid">
        <div class="form-group">
          <label for="intro-title">Title</label>
          <input id="intro-title" v-model="introForm.title" type="text" />
        </div>
        <div class="form-group">
          <label for="intro-subtitle">Subtitle</label>
          <input id="intro-subtitle" v-model="introForm.subtitle" type="text" />
        </div>
        <div class="form-group">
          <label for="intro-checkbox">Checkbox label</label>
          <input id="intro-checkbox" v-model="introForm.checkboxLabel" type="text" />
        </div>
        <div class="form-group">
          <label for="intro-button">Primary button label</label>
          <input id="intro-button" v-model="introForm.startButtonLabel" type="text" />
        </div>
      </div>

      <div class="form-group">
        <label for="intro-bullets">Checklist items</label>
        <textarea
          id="intro-bullets"
          v-model="bulletText"
          rows="6"
          placeholder="One item per line"
        ></textarea>
        <small>Scrivi un elemento per riga.</small>
      </div>

      <div class="actions">
        <Button
          :type="'secondary'"
          :text="'Reset to defaults'"
          :isDisabled="isSaving"
          :htmlType="'button'"
          @click="resetToDefaults"
        />
        <Button
          :type="'primary'"
          :text="isSaving ? 'Saving…' : 'Save to server'"
          :isDisabled="isSaving"
          :htmlType="'button'"
          @click="saveIntroContent"
        />
      </div>

      <p v-if="feedback.message" :class="['feedback', feedback.type]">
        {{ feedback.message }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue';
import Button from '@/components/Button.vue';
import { useProductStore, defaultIntroContent } from '@/stores/productStore';

const store = useProductStore();

const introForm = reactive({
  title: '',
  subtitle: '',
  checkboxLabel: '',
  startButtonLabel: '',
});

const bulletText = ref('');
const isSaving = ref(false);
const feedback = reactive({ message: '', type: 'info' });

const currentIntro = computed(() => store.productMapping?.introContent || defaultIntroContent);

const applyIntroToForm = (source) => {
  introForm.title = source.title || '';
  introForm.subtitle = source.subtitle || '';
  introForm.checkboxLabel = source.checkboxLabel || '';
  introForm.startButtonLabel = source.startButtonLabel || '';
  const bullets = Array.isArray(source.bulletPoints) ? source.bulletPoints : defaultIntroContent.bulletPoints;
  bulletText.value = bullets.join('\n');
};

watch(currentIntro, (val) => {
  applyIntroToForm(val || defaultIntroContent);
}, { immediate: true, deep: true });

const resetFeedback = () => {
  feedback.message = '';
  feedback.type = 'info';
};

const resetToDefaults = () => {
  applyIntroToForm(defaultIntroContent);
  resetFeedback();
};

const saveIntroContent = async () => {
  if (isSaving.value) return;
  resetFeedback();
  isSaving.value = true;
  try {
    const mapping = JSON.parse(JSON.stringify(store.productMapping || {}));
    const bulletPoints = bulletText.value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    mapping.introContent = {
      title: introForm.title.trim() || defaultIntroContent.title,
      subtitle: introForm.subtitle.trim() || defaultIntroContent.subtitle,
      checkboxLabel: introForm.checkboxLabel.trim() || defaultIntroContent.checkboxLabel,
      startButtonLabel: introForm.startButtonLabel.trim() || defaultIntroContent.startButtonLabel,
      bulletPoints: bulletPoints.length ? bulletPoints : defaultIntroContent.bulletPoints,
    };

    const response = await fetch('/config/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapping, null, 2),
    });

    const payload = await response.text();
    if (!response.ok) {
      throw new Error(payload || `Server responded with ${response.status}`);
    }

    store.updateProductMapping(mapping);
    feedback.message = 'Intro content updated successfully.';
    feedback.type = 'success';
  } catch (error) {
    console.error(error);
    feedback.message = error.message || 'Failed to save intro content.';
    feedback.type = 'error';
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.intro-editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.feedback {
  font-size: 0.9rem;
}

.feedback.success {
  color: #0f5132;
}

.feedback.error {
  color: #842029;
}
</style>

