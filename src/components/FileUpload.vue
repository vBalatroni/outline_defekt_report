<template>
  <div class="file-upload">
    <div class="upload-area" @dragover.prevent @drop.prevent="handleDrop">
      <input type="file" @change="handleFileChange" accept="image/*" ref="fileInput" class="file-input" multiple>
      <div class="upload-prompt" @click="triggerFileInput">
        <p>Drag & Drop images here or <strong>click to select files</strong>.</p>
      </div>
    </div>
    <div v-if="modelValue && modelValue.length > 0" class="preview-grid">
      <div v-for="(imageSrc, index) in modelValue" :key="index" class="preview-item">
        <img :src="imageSrc" alt="Image preview" class="image-preview">
        <button @click="removeImage(index)" class="btn-remove">X</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
});
const emit = defineEmits(['update:modelValue']);

const fileInput = ref(null);

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileChange = (event) => {
  const files = event.target.files;
  if (files) {
    processFiles(files);
  }
};

const handleDrop = (event) => {
  const files = event.dataTransfer.files;
  if (files) {
    processFiles(files);
  }
};

const processFiles = (files) => {
  const newImages = [...props.modelValue];
  let filesToProcess = Array.from(files).filter(file => file.type.startsWith('image/'));
  
  if (filesToProcess.length === 0) {
      if (files.length > 0) alert('Please select image files.');
      return;
  }

  let processedCount = 0;
  
  filesToProcess.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      newImages.push(e.target.result);
      processedCount++;
      if (processedCount === filesToProcess.length) {
        emit('update:modelValue', newImages);
      }
    };
    reader.readAsDataURL(file);
  });
};

const removeImage = (index) => {
  const newImages = [...props.modelValue];
  newImages.splice(index, 1);
  emit('update:modelValue', newImages);
};
</script>

<style scoped>
.file-upload {
  width: 100%;
}
.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  background-color: #f9f9f9;
  transition: background-color 0.2s;
  margin-bottom: 1rem;
}
.upload-area:hover {
  background-color: #f0f0f0;
}
.file-input {
  display: none;
}
.preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 1rem;
}
.preview-item {
  position: relative;
}
.image-preview {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #ddd;
}
.btn-remove {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  line-height: 1;
}
</style> 