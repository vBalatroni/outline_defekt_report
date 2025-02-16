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
        <input 
            :type="type" 
            :id="id" 
            :required="isRequired" 
            :value="modelValue" 
            @input="handleInput"
        />
    </div>
</template>

<style scoped>
/* Add any necessary styles here */
</style>
