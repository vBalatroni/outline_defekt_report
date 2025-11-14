<script setup>
import { defineProps } from 'vue';
import Divider from './Divider.vue';
const props = defineProps({
    title: {
        type: String,
        required: true
    },
    subtitle: {
        type: String,
        required: false
    }
});
</script>
<template>
    <header class="step-header">
        <div class="step-header-top">
            <img src="/favicon.png" alt="Logo" class="step-logo" />
            <div class="step-header-content">
                <h1 v-if="title" class="step-title" v-html="title"></h1>
                <p v-if="subtitle" class="step-subtitle" v-html="subtitle"></p>
            </div>
        </div>
        <Divider v-if="title || subtitle" />
    </header>
</template>
