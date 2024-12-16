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
      <button 
        @click="startAnalysis" 
        class="button analyze"
        :class="{ 'analyzing': isAnalyzing }"
        :disabled="isAnalyzing"
      >
        <i class="fas fa-receipt" v-if="!isAnalyzing"></i>
        {{ isAnalyzing ? '解析中...' : '領収書を解析' }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, defineEmits, defineProps, onBeforeUnmount, watch } from 'vue';
import { showNotification } from '../utils/notification';

const props = defineProps<{
  isAnalyzing: boolean
}>();

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
  margin-bottom: 2rem;
}

.selection-section h2 {
  font-size: 1.1rem;
  margin: 0 0 1.5rem 0;
  padding: 0;
  color: var(--text-color);
  font-weight: 500;
}

.upload-area {
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  padding: 3rem 1rem;
  text-align: center;
  cursor: pointer;
  background-color: #fafafa;
  transition: all 0.2s ease;
}

.upload-area:hover {
  border-color: var(--primary-color);
  background-color: #f5f5f5;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: #666;
}

.upload-content p {
  margin: 0;
  font-size: 0.95rem;
}

.upload-limits {
  color: #999;
  font-size: 0.85rem !important;
  margin-top: 0.75rem !important;
}

.upload-icon {
  font-size: 3rem;
  color: #9e9e9e;
  margin-bottom: 0.5rem;
}

.images-section {
  margin-top: 2rem;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.5rem;
}

.image-item {
  position: relative;
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.image-item img {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.image-name {
  padding: 0.75rem;
  font-size: 0.85rem;
  color: #666;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  background-color: #fafafa;
  border-top: 1px solid var(--border-color);
}

.remove-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background-color: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 0.9rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.remove-button:hover {
  background-color: #f44336;
  color: white;
}

.process-content {
  margin-top: 2rem;
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
}

.button.analyze {
  padding: 1rem 2rem;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}

.button.analyze i {
  font-size: 1.2rem;
}

.button.analyze.analyzing {
  opacity: 0.8;
}
</style> 