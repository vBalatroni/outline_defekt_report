<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import FileUpload from './FileUpload.vue';

const props = defineProps({
    id: String,
    label: {
        type: String,
        required: true
    },
    isRequired: {
        type: Boolean,
        default: false
    },
    type: {
        type: String,
        default: 'text'
    },
    modelValue: {
        type: [String, Number],
        default: ''
    },
    options: {
        type: Array,
        default: () => []
    },
    disabled: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:modelValue', 'input-change']);

const value = computed({
    get() {
        return props.modelValue;
    },
    set(val) {
        emit('update:modelValue', val);
        emit('input-change', { id: props.id, value: val });
    }
});

const safeOptions = computed(() => {
    return Array.isArray(props.options) ? props.options : [];
});

</script>

<template>
    <div class="input-field">
        <label :for="id">{{ label }} <span v-if="isRequired">*</span></label>
        <template v-if="type === 'select'">
            <select 
                :id="id" 
                :required="isRequired" 
                v-model="value" 
                :disabled="disabled"
                class="form-control"
            >
                <option value="" disabled>Select an option</option>
                <template v-for="option in safeOptions" :key="option.value || option">
                    <option :value="option.value || option">
                        {{ option.label || option }}
                    </option>
                </template>
            </select>
        </template>
        <template v-else-if="type === 'file'">
            <FileUpload v-model="value" />
        </template>
        <template v-else>
            <input 
                :type="type" 
                :id="id" 
                :required="isRequired" 
                v-model="value" 
                :disabled="disabled"
                class="form-control"
            />
        </template>
    </div>
</template>

<style scoped>
.input-field input:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
}
</style>
