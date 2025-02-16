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
