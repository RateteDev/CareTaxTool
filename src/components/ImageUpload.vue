<template>
  <section class="selection-section section-container">
    <h2>画像ファイルの選択</h2>
    <div
      class="upload-area"
      @dragover.prevent="handleDragOver"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <div class="upload-content">
        <i class="fas fa-cloud-upload-alt upload-icon"></i>
        <p>ここに領収書画像をドラッグ＆ドロップ</p>
        <p>または</p>
        <input
          type="file"
          ref="fileInput"
          accept="image/*"
          multiple
          style="display: none;"
          @change="handleFileSelect"
        >
        <button class="button">ファイルを選択</button>
        <p class="upload-limits">
          ※ 1ファイル10MB以内、最大5ファイルまで
        </p>
      </div>
    </div>

    <div class="images-section" v-if="selectedFiles.length > 0">
      <div class="images-grid">
        <div v-for="(file, index) in selectedFiles" :key="index" class="image-item">
          <img :src="imageUrls[index]" :alt="file.name">
          <button class="remove-button" @click="removeFile(index)">
            <i class="fas fa-times"></i>
          </button>
          <div class="image-name">{{ file.name }}</div>
        </div>
      </div>
    </div>

    <div class="process-content" v-if="selectedFiles.length > 0">
      <button @click="startAnalysis" class="button analyze">
        <i class="fas fa-receipt"></i>
        領収書を解析
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, defineEmits, onBeforeUnmount, watch } from 'vue';
import { showNotification } from '../utils/notification';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

const emit = defineEmits(['analyze']);
const fileInput = ref<HTMLInputElement | null>(null);
const selectedFiles = ref<File[]>([]);
const imageUrls = ref<string[]>([]);

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  const files = event.dataTransfer?.files;
  if (files) {
    addFiles(Array.from(files));
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    addFiles(Array.from(input.files));
  }
};

const validateFile = (file: File): boolean => {
  if (!file.type.startsWith('image/')) {
    showNotification(`${file.name}は画像ファイルではありません`, 'warning');
    return false;
  }
  if (file.size > MAX_FILE_SIZE) {
    showNotification(`${file.name}は10MBを超えています`, 'warning');
    return false;
  }
  return true;
};

const addFiles = (files: File[]) => {
  if (selectedFiles.value.length + files.length > MAX_FILES) {
    showNotification(`アップロードできるファイルは最大${MAX_FILES}個までです`, 'warning');
    return;
  }

  const validFiles = files.filter(validateFile);
  const newUrls = validFiles.map(file => URL.createObjectURL(file));
  
  selectedFiles.value.push(...validFiles);
  imageUrls.value.push(...newUrls);
};

const removeFile = (index: number) => {
  URL.revokeObjectURL(imageUrls.value[index]);
  selectedFiles.value.splice(index, 1);
  imageUrls.value.splice(index, 1);
};

const startAnalysis = () => {
  if (selectedFiles.value.length === 0) {
    showNotification('画像を選択してください', 'warning');
    return;
  }
  emit('analyze', selectedFiles.value);
};

// クリーンアップ
onBeforeUnmount(() => {
  imageUrls.value.forEach(url => URL.revokeObjectURL(url));
});

// 選択ファイルが変更されたときにinputをリセット
watch(selectedFiles, () => {
  if (fileInput.value) {
    fileInput.value.value = '';
  }
});
</script>

<style scoped>
.selection-section {
  margin: 1rem 0;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.selection-section h2 {
  font-size: 1rem;
  margin: 0;
  padding: 0.75rem 1rem;
  color: #333;
  font-weight: normal;
  border-bottom: 1px solid #eee;
}

.upload-area {
  border: 1px dashed #ddd;
  border-radius: 4px;
  padding: 2rem 1rem;
  margin: 1rem;
  text-align: center;
  cursor: pointer;
  background-color: white;
}

.upload-area:hover {
  border-color: var(--primary-color);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #666;
}

.upload-content p {
  margin: 0;
  font-size: 0.9rem;
}

.upload-limits {
  color: #999;
  font-size: 0.8rem !important;
  margin-top: 0.5rem !important;
}

.upload-icon {
  font-size: 2rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.images-section {
  margin: 1rem;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.image-item {
  position: relative;
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.image-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.image-name {
  padding: 0.5rem;
  font-size: 0.8rem;
  color: #666;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background-color: #f8f9fa;
  border-top: 1px solid var(--border-color);
}

.remove-button {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background-color: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 0.8rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.process-content {
  margin: 1rem;
  text-align: center;
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
}

.button {
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  min-width: 60px;
}

.button.analyze {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.button:hover {
  opacity: 0.9;
}

.button i {
  margin-right: 0.5rem;
}
</style> 