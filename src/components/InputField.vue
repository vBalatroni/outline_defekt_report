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
                <option value="">Select an option</option>
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
                @input="handleInput"
                class="form-control"
            />
        </template>
    </div>
</template>

<style scoped>
.input-field {
    display: flex;
    flex-direction: column;
    width: 90%;
}

.input-field label {
    font-weight: 400;
    font-size: 14px;
}

.input-field input,
.input-field select {
    border: 2px solid var(--black-color);
    border-radius: 0;
    padding: 8px;
    font-size: 16px;
}
</style>
