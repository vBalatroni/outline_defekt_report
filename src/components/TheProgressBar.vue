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
    <div class="progress mb-3">
        <div 
          class="progress-bar" 
          role="progressbar" 
          :style="{ width: progressWidth }"
        ></div>
      </div>
</template>

<style>
.progress {
    height: 20px;
    background-color: var(--light-color);
    transition: width 0.6s ease;
    border-radius: 0;
}  
.progress-bar {
    background-color: var(--black-color);
    transition: width 0.6s ease;
}
</style>