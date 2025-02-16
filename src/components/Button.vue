<script setup>
import { defineProps } from 'vue';
const props = defineProps({
    isDisabled: {
        type: Boolean,
        default: false
    },
    text: {
        type: String,
        default: 'Button'
    },
    type: {
        type: String,
        default: 'primary'
    }

})
</script>

<template>
    <button :class="['button', type + '-button', isDisabled ? 'disabled' : '']">{{ text }}</button>
</template>

<style>
.button {
    padding: 12px 36px;
    border: none;
    border-radius: 0;
    cursor: pointer;
    text-transform: uppercase;
    font-size: 20px;
}
.primary-button {
    background-color: var(--black-color);
    color: var(--light-color);
}

.secondary-button {
    background-color: white;
    color: var(--black-color);
    border: 2px solid var(--black-color);
}
.button.disabled {
    pointer-events: none;
    opacity: .5;
}
</style>