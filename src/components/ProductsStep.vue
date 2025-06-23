<script setup>
import { ref, computed, watch } from 'vue';
import { useProductStore } from '@/stores/productStore';
import InputField from './InputField.vue';
import StepHeader from './StepHeader.vue';

const props = defineProps({
    modelValue: {
        type: Object,
        required: true,
    },
});

const emit = defineEmits(['update:modelValue']);
const productStore = useProductStore();

const formData = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
});

const categories = computed(() => productStore.categories);

const availableModels = computed(() => {
    if (formData.value.productCategory) {
        return productStore.getModelsForCategory(formData.value.productCategory);
    }
    return [];
});

const modelFields = computed(() => {
    if (formData.value.productModel) {
        return productStore.getModelFields(formData.value.productModel);
    }
    return [];
});

const sortedModelFields = computed(() => {
    if (!modelFields.value) return [];
    return [...modelFields.value].sort((a, b) => (a.order || 0) - (b.order || 0));
});

watch(() => formData.value.productCategory, () => {
    formData.value.productModel = '';
    formData.value.dynamicFields = {};
});

watch(() => formData.value.productModel, (newModel) => {
    formData.value.dynamicFields = {};
    if (newModel) {
        productStore.getModelFields(newModel).forEach(field => {
            formData.value.dynamicFields[field.id] = '';
        });
    }
}, { immediate: true });

watch(() => formData.value.dynamicFields, (newFields, oldFields) => {
    if (!oldFields || !modelFields.value) return;

    modelFields.value.forEach(childField => {
        if (childField.dependsOn) {
            const parentId = childField.dependsOn;
            if (newFields[parentId] !== oldFields[parentId]) {
                formData.value.dynamicFields[childField.id] = '';
            }
        }
    });
}, { deep: true });

const getFieldOptions = (field) => {
    if (field.isSymptomArea) {
        if (Array.isArray(field.options)) {
            return field.options.map(key => {
                const set = productStore.symptomSets[key];
                return set ? { value: key, label: set.label } : null;
            }).filter(Boolean);
        }
        return [];
    }

    if (field.dependsOn) {
        const parentValue = formData.value.dynamicFields[field.dependsOn];
        if (!parentValue) return [];

        const mapping = field.valueMapping ? field.valueMapping[parentValue] : null;
        if (!mapping) return [];

        if (mapping.type === 'symptomSet') {
            return productStore.getSymptomSetSymptoms(mapping.key);
        } else if (mapping.type === 'static') {
            return mapping.options || [];
        }

        return [];
    }

    return field.options || [];
};

const isFieldVisible = (field) => {
    if (!field.conditions || field.conditions.length === 0) {
        return true;
    }

    return field.conditions.every(condition => {
        const targetValue = condition.field in formData.value 
            ? formData.value[condition.field]
            : formData.value.dynamicFields[condition.field];

        if (targetValue === undefined) {
            return false;
        }

        switch (condition.operator) {
            case 'equals':
                return targetValue == condition.value;
            case 'not_equals':
                return targetValue != condition.value;
            case 'contains':
                return String(targetValue).includes(condition.value);
            case 'exists':
                return targetValue !== null && targetValue !== undefined && targetValue !== '';
            default:
                return false;
        }
    });
};

const isFieldDisabled = (field) => {
    return field.dependsOn && !formData.value.dynamicFields[field.dependsOn];
};

</script>

<template>
    <div>
        <StepHeader title="Product Information" />
        <div class="form-grid">
            <InputField
                id="productCategory"
                label="Product Category"
                v-model="formData.productCategory"
                :options="categories"
                type="select"
                :isRequired="true"
            />
            <InputField
                id="productModel"
                label="Product Model"
                v-model="formData.productModel"
                :options="availableModels"
                type="select"
                :disabled="!formData.productCategory"
                :isRequired="true"
            />
        </div>

        <div v-if="formData.productModel && modelFields.length > 0" class="dynamic-fields-grid">
            <template v-for="field in sortedModelFields" :key="field.id">
                <InputField
                    v-if="isFieldVisible(field)"
                    :id="field.id"
                    :label="field.label"
                    v-model="formData.dynamicFields[field.id]"
                    :type="field.type"
                    :options="getFieldOptions(field)"
                    :isRequired="field.required"
                    :disabled="isFieldDisabled(field)"
                />
            </template>
        </div>
    </div>
</template>

<style scoped>
.form-grid, .dynamic-fields-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-top: 1.5rem;
}
</style>