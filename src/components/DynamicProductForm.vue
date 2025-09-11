<template>
  <div class="dynamic-product-form">
    <div v-if="!productModel">
      <p class="selection-placeholder">Please select a category and model to see the form.</p>
    </div>
    <div v-else>
      <div v-for="field in visibleFields" :key="field.id" class="form-group">
        <label :for="field.id">{{ field.label }}</label>
        
        <template v-if="field.type === 'text'">
          <input 
            type="text" 
            :id="field.id"
            v-model="formData[field.id]" 
            :required="field.required"
          />
        </template>
        
        <template v-if="field.type === 'select'">
          <select 
            :id="field.id"
            v-model="formData[field.id]" 
            :required="field.required"
            @change="handleFieldChange(field.id)"
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
                accept="image/png,image/jpeg"
                @change="handleFileUpload($event, field.id)"
                :required="field.required"
                ref="fileInputs"
                :data-field="field.id"
            />
            <div v-if="previews[field.id]" class="preview">
              <img :src="previews[field.id]" alt="preview" />
            </div>
        </template>
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

watch(() => props.modelValue, (newValue) => {
  if (JSON.stringify(newValue) !== JSON.stringify(formData.value)) {
    formData.value = { ...newValue };
  }
}, { immediate: true, deep: true });

watch(formData, (newValue) => {
  emit('update:modelValue', newValue);
}, { deep: true });

const modelFields = computed(() => {
  if (!props.productModel) return [];
  const fields = productStore.getModelFields(props.productModel);
  return fields.sort((a, b) => (a.order || 0) - (b.order || 0));
});

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
                formData.value[field.id] = '';
            }
        }
    }
};

const handleFileUpload = async (event, fieldId) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g)$/i.test(file.type)) {
        alert('Only PNG or JPG images are allowed.');
        event.target.value = '';
        return;
    }
    formData.value[fieldId] = file;
    // preview as data URL
    const reader = new FileReader();
    reader.onload = () => { previews.value[fieldId] = reader.result; };
    reader.readAsDataURL(file);
};

onMounted(() => {
    productStore.loadConfiguration();
});

</script>

<style scoped>
.dynamic-product-form {
  padding: 1rem;
}
.form-group {
  margin-bottom: 1.5rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}
.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.selection-placeholder {
  color: #777;
  text-align: center;
  padding: 2rem;
  border: 2px dashed #ddd;
  border-radius: 4px;
}
</style> 