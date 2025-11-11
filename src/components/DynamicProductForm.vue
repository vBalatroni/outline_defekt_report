<template>
  <div class="dynamic-product-form">
    <div v-if="!productModel">
      <p class="selection-placeholder">Please select a category and model to see the form.</p>
    </div>
    <div v-else>
      <div class="fields-grid">
        <div v-for="field in visibleFields" :key="field.id" class="form-group dynamic-field-group">
          <label :for="field.id" class="dynamic-field-label">{{ field.label }}</label>
          
          <template v-if="field.type === 'text'">
            <input 
              type="text" 
              :id="field.id"
              v-model="formData[field.id]" 
              :required="field.required"
              class="dynamic-field-input"
            />
          </template>
          
          <template v-if="field.type === 'select'">
            <select 
              :id="field.id"
              v-model="formData[field.id]" 
              :required="field.required"
              @change="handleFieldChange(field.id)"
              :disabled="!hasOptions(field)"
              class="dynamic-field-input"
            >
              <option disabled value="">Please select an option</option>
              <option v-for="option in getOptionsForField(field)" :key="option.value || option" :value="option.value || option">
                {{ option.label || option }}
              </option>
            </select>
          </template>

          <template v-if="field.type === 'file'">
              <input 
                  type="file" 
                  :id="field.id"
                  :accept="acceptedMimeTypes"
                  multiple
                  @change="handleFileUpload($event, field.id)"
                  :required="field.required"
                  ref="fileInputs"
                  :data-field="field.id"
                  class="dynamic-field-input"
              />
              <div
                v-if="Array.isArray(previews[field.id]) && previews[field.id].length"
                class="attachments-preview-grid"
              >
                <div
                  v-for="(preview, index) in previews[field.id]"
                  :key="preview.id"
                  class="attachment-preview"
                >
                  <template v-if="preview.previewType === 'image'">
                    <img :src="preview.url" :alt="preview.name" />
                  </template>
                  <template v-else-if="preview.previewType === 'video'">
                    <video :src="preview.url" controls muted playsinline></video>
                  </template>
                  <div class="attachment-meta">
                    <span class="attachment-name">{{ preview.name }}</span>
                    <span class="attachment-size">{{ formatSize(preview.size) }}</span>
                  </div>
                  <button
                    class="attachment-remove"
                    type="button"
                    @click="removeAttachment(field.id, index)"
                  >
                    ×
                  </button>
                </div>
              </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useProductStore } from '@/stores/productStore';

const props = defineProps({
  productCategory: { type: String, required: true },
  productModel: { type: String, required: true },
  modelValue: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['update:modelValue']);

const productStore = useProductStore();
const formData = ref({});
const previews = ref({});
const fileInputs = ref([]);

const attachmentsLimits = computed(() => {
  const cfg = productStore.productMapping?.attachmentsConfig || {};
  const toPositiveInt = (value, fallback) => {
    const num = Number(value);
    return Number.isFinite(num) && num > 0 ? Math.floor(num) : fallback;
  };
  const allowed = Array.isArray(cfg.allowedMimeTypes)
    ? cfg.allowedMimeTypes.filter((item) => typeof item === 'string' && item.trim().length)
    : [];
  const maxFiles = toPositiveInt(cfg.maxFiles, 6);
  const maxFileSizeMb = toPositiveInt(cfg.maxFileSizeMb, 15);
  const maxTotalSizeMb = toPositiveInt(cfg.maxTotalSizeMb, 80);
  return {
    maxFiles,
    maxFileSizeBytes: maxFileSizeMb * 1024 * 1024,
    maxTotalSizeBytes: maxTotalSizeMb * 1024 * 1024,
    allowedMimeTypes: allowed.length
      ? allowed
      : ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'],
  };
});

const acceptedMimeTypes = computed(() => {
  const list = attachmentsLimits.value.allowedMimeTypes;
  return list.length ? list.join(',') : 'image/*,video/*';
});

const isMimeAllowed = (mime) => {
  const allowed = attachmentsLimits.value.allowedMimeTypes;
  if (!mime) return false;
  return allowed.some((entry) => {
    if (entry.endsWith('/*')) {
      const prefix = entry.slice(0, entry.indexOf('/'));
      return mime.startsWith(`${prefix}/`);
    }
    return mime.toLowerCase() === entry.toLowerCase();
  });
};

let previewIdCounter = 0;
const nextPreviewId = () => `att-${Date.now()}-${previewIdCounter++}`;

const revokePreviewUrls = (list = []) => {
  list.forEach((item) => {
    if (item?.previewType === 'video' && item.url) {
      URL.revokeObjectURL(item.url);
    }
  });
};

const generatePreview = (file) => {
  const base = {
    id: nextPreviewId(),
    name: file.name,
    size: file.size,
    mime: file.type,
  };
  if (file.type.startsWith('image/')) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ ...base, previewType: 'image', url: reader.result });
      reader.readAsDataURL(file);
    });
  }
  if (file.type.startsWith('video/')) {
    const url = URL.createObjectURL(file);
    return Promise.resolve({ ...base, previewType: 'video', url });
  }
  return Promise.resolve({ ...base, previewType: 'file', url: '' });
};

const buildPreviews = async (fieldId, files) => {
  revokePreviewUrls(previews.value[fieldId]);
  if (!files || !files.length) {
    previews.value[fieldId] = [];
    return;
  }
  const list = await Promise.all(files.map((file) => generatePreview(file)));
  previews.value[fieldId] = list;
};

const formatSize = (bytes) => {
  if (!Number.isFinite(bytes)) return '';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${bytes} B`;
};

watch(() => props.modelValue, (newValue) => {
  if (JSON.stringify(newValue) !== JSON.stringify(formData.value)) {
    formData.value = { ...newValue };
  }
}, { immediate: true, deep: true });

// When the upstream modelValue is cleared (after Add Defect), clear previews and inputs
watch(() => props.modelValue, (val) => {
  const isEmpty = val && Object.keys(val).length === 0;
  if (isEmpty) {
    Object.keys(previews.value).forEach((key) => {
      revokePreviewUrls(previews.value[key]);
    });
    previews.value = {};
    try {
      const inputs = document.querySelectorAll('input[type="file"]');
      inputs.forEach((inp) => { inp.value = ''; });
    } catch {}
  }
}, { deep: true });

watch(formData, (newValue) => {
  emit('update:modelValue', newValue);
}, { deep: true });

const modelFields = computed(() => {
  if (!props.productModel) return [];
  const fields = productStore.getModelFields(props.productModel);
  return fields.sort((a, b) => (a.order || 0) - (b.order || 0));
});

const defectSections = computed(() => {
  return productStore.productMapping?.defectSections || ['symptomInfo', 'technicalInfo', 'serialNumbers', 'versions', 'additionalInfo'];
});

const defaultFieldSection = computed(() => (
  Array.isArray(defectSections.value) && defectSections.value.length
    ? defectSections.value[0]
    : 'additionalInfo'
));

const checkCondition = (condition) => {
    const { field: fieldId, operator, value } = condition;
    let targetValue;

    if (fieldId === 'productCategory') {
        targetValue = props.productCategory;
    } else if (fieldId === 'productModel') {
        targetValue = props.productModel;
    } else {
        targetValue = formData.value[fieldId];
    }
    
    if (targetValue === undefined) return false;

    switch(operator) {
        case 'equals': return targetValue == value;
        case 'not_equals': return targetValue != value;
        case 'contains': return Array.isArray(targetValue) ? targetValue.includes(value) : String(targetValue).includes(value);
        case 'exists': return targetValue !== null && targetValue !== undefined && targetValue !== '';
        default: return false;
    }
};

const visibleFields = computed(() => {
  return modelFields.value.filter(field => {
    if (!field.conditions || field.conditions.length === 0) {
      return true;
    }
    return field.conditions.every(checkCondition);
  });
});

const getOptionsForField = (field) => {
    // For symptom areas, we now return the full object { value, label }
    if (field.isSymptomArea) {
        const symptomSets = productStore.symptomSets || {};
        const areaOptions = [];
        if (Array.isArray(field.options)) {
            field.options.forEach(setKey => {
                if (symptomSets[setKey]) {
                    areaOptions.push({ value: setKey, label: symptomSets[setKey].label });
                }
            });
        }
        return areaOptions;
    }
    
    if (field.dependsOn) {
        const parentValue = formData.value[field.dependsOn];
        if (!parentValue || !field.valueMapping || !field.valueMapping[parentValue]) return [];

        const mapping = field.valueMapping[parentValue];
        if (mapping.type === 'static') {
            // Support both new and legacy shapes
            const opts = mapping.options || mapping.value || [];
            return Array.isArray(opts) ? opts : String(opts).split('\n').map(s => s.trim()).filter(Boolean);
        } else if (mapping.type === 'symptomSet') {
            const key = mapping.key || mapping.value; // legacy fallback
            const symptoms = key ? (productStore.getSymptomSetSymptoms(key) || []) : [];
            return symptoms;
        }
    }

    return field.options || [];
};

const handleFieldChange = (changedFieldId) => {
    // This new logic is more robust.
    // It iterates through all fields to find any that depend on the one that just changed.
    for (const field of modelFields.value) {
        if (field.dependsOn === changedFieldId) {
            // Found a dependent field. Reset its value.
            // The template will automatically re-render and call getOptionsForField,
            // which will then provide the correct new options.
            if (formData.value[field.id] !== undefined) {
                formData.value[field.id] = field.type === 'file' ? [] : '';
                if (field.type === 'file') {
                    previews.value[field.id] = [];
                }
            }
        }
    }
};

const handleFileUpload = async (event, fieldId) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    const limits = attachmentsLimits.value;
    const existing = Array.isArray(formData.value[fieldId]) ? [...formData.value[fieldId]] : [];
    const existingSize = existing.reduce((sum, file) => sum + (file.size || 0), 0);

    const accepted = [];
    let totalSize = existingSize;
    for (const file of files) {
        if (!isMimeAllowed(file.type)) {
            alert(`Formato non consentito: ${file.name}`);
            continue;
        }
        if (file.size > limits.maxFileSizeBytes) {
            alert(`Il file ${file.name} supera il limite di ${formatSize(limits.maxFileSizeBytes)}.`);
            continue;
        }
        if (existing.length + accepted.length >= limits.maxFiles) {
            alert(`Numero massimo di file (${limits.maxFiles}) raggiunto.`);
            break;
        }
        if (totalSize + file.size > limits.maxTotalSizeBytes) {
            alert(`Il totale degli allegati supera ${formatSize(limits.maxTotalSizeBytes)}.`);
            continue;
        }
        accepted.push(file);
        totalSize += file.size;
    }

    if (!accepted.length) return;

    const updated = [...existing, ...accepted];
    formData.value[fieldId] = updated;
    await buildPreviews(fieldId, updated);
};

const removeAttachment = async (fieldId, index) => {
    const current = Array.isArray(formData.value[fieldId]) ? [...formData.value[fieldId]] : [];
    if (!current.length) return;
    current.splice(index, 1);
    formData.value[fieldId] = current;
    await buildPreviews(fieldId, current);
};

const hasOptions = (field) => {
  const options = getOptionsForField(field);
  return Array.isArray(options) && options.length > 0;
};

onMounted(() => {
    productStore.loadConfiguration();
});

</script>

<style scoped>
.dynamic-product-form {
  padding: 1rem;
}
.fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
}
.dynamic-field-group {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
}
.dynamic-field-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #333;
}
.dynamic-field-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.dynamic-field-input:focus {
  outline: none;
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
}
.dynamic-field-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  color: #888;
}
.dynamic-field-help {
  margin-top: 0.35rem;
  font-size: 0.75rem;
  color: #777;
}
.selection-placeholder {
  color: #777;
  text-align: center;
  padding: 2rem;
  border: 2px dashed #ddd;
  border-radius: 4px;
}
.preview {
  margin-top: 0.75rem;
}
.preview img {
  max-width: 140px;
  max-height: 140px;
  border-radius: 6px;
  border: 1px solid #ddd;
  object-fit: cover;
  display: inline-block;
}
.attachments-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
  margin-top: 0.75rem;
}
.attachment-preview {
  position: relative;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.5rem;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.attachment-preview img,
.attachment-preview video {
  width: 100%;
  border-radius: 6px;
  object-fit: cover;
  max-height: 140px;
}
.attachment-meta {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: 0.85rem;
  color: #1f2937;
}
.attachment-size {
  color: #6b7280;
  font-size: 0.8rem;
}
.attachment-remove {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.field-editor-placeholder {

</style> 