<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
    type: {
        type: String,
        required: true
    },
    label: {
        type: String,
        required: true
    },
    isRequired: {
        type: Boolean,
        required: true
    },
    id: {
        type: String,
        required: true
    },
    modelValue: {
        type: [String, Number],
        default: ''
    },
    options: {
        type: Array,
        default: () => []
    },
    isLoading: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:modelValue', 'input-change']);

const handleInput = (event) => {
    const value = event.target.value;
    emit('update:modelValue', value);
    emit('input-change', { id: props.id, value: value });
};
</script>

<template>
    <div class="input-field">
        <label :for="id">{{ label }} <span v-if="isRequired">*</span></label>
        <template v-if="type === 'select'">
            <select 
                :id="id" 
                :required="isRequired" 
                :value="modelValue" 
                @input="handleInput"
                class="form-control"
            >
                <option value="" disabled selected>Select an option</option>
                <option v-for="option in options" :key="option" :value="option">
                    {{ option }}
                </option>
            </select>
        </template>
        <template v-else>
            <input 
                :type="type" 
                :id="id" 
                :required="isRequired" 
                :value="modelValue" 
                :disabled="isLoading"
                :class="{ 'loading': isLoading }"
                @input="handleInput"
                class="form-control"
            />
        </template>
    </div>
</template>

<style scoped>
.input-field input.loading {
    background-color: #f5f5f5;
    cursor: not-allowed;
}
</style>
