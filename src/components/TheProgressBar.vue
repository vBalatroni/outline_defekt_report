<script setup>
import { ref, computed } from 'vue';
const props = defineProps({
    progressWidth: {
        type: Number,
        required: true
    }
});

</script>
<template>
    <div class="progress progress-custom mb-3">
        <div 
          class="progress-bar" 
          role="progressbar" 
          :style="{ width: progressWidth }"
        ></div>
      </div>
</template>
