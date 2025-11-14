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
    <div class="step-header">
        <h2 v-if="title" class="step-title" v-html="title"></h2>
        <Divider> </Divider>
        <p v-if="subtitle" class="step-subtitle" v-html="subtitle"></p>
    </div>
</template>
