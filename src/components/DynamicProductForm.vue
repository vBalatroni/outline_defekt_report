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
            <option v-for="option in getOptionsForField(field)" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </template>

        <template v-if="field.type === 'file'">
            <input 
                type="file" 
                :id="field.id"
                @change="handleFileUpload($event, field.id)"
                :required="field.required"
            />
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
    if (field.isSymptomArea) {
        const symptomSets = productStore.symptomSets || {};
        const areaOptions = [];
        field.options.forEach(setKey => {
            if (symptomSets[setKey]) {
                areaOptions.push({ value: setKey, label: symptomSets[setKey].label });
            }
        });
        return areaOptions.map(opt => opt.label);
    }
    
    if (field.dependsOn) {
        const parentValue = formData.value[field.dependsOn];
        if (!parentValue || !field.valueMapping || !field.valueMapping[parentValue]) return [];

        const mapping = field.valueMapping[parentValue];
        if (mapping.type === 'static') {
            return mapping.options || [];
        } else if (mapping.type === 'symptomSet') {
            return productStore.getSymptomSetSymptoms(mapping.key) || [];
        }
    }

    return field.options || [];
};

const handleFieldChange = (fieldId) => {
    modelFields.value.forEach(field => {
        if (field.dependsOn === fieldId) {
            formData.value[field.id] = '';
        }
    });
};

const handleFileUpload = (event, fieldId) => {
    const file = event.target.files[0];
    if (file) {
        formData.value[fieldId] = file;
    }
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