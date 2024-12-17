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
      </div>
    </div>

    <div class="images-section" v-if="selectedFiles.length > 0">
      <div class="images-grid">
        <div v-for="(file, index) in selectedFiles" :key="index" class="image-item" :id="`receipt-${formatFileId(index)}`" :class="{ 'highlighted': false }">
          <img 
            :src="imageUrls[index]" 
            :alt="getDisplayFileName(file, index)"
            @click="openImageModal(index)"
          >
          <button class="remove-button" @click="removeFile(index)">
            <i class="fas fa-times"></i>
          </button>
          <div class="image-name">{{ getDisplayFileName(file, index) }}</div>
        </div>
      </div>
    </div>

    <div class="process-content" v-if="selectedFiles.length > 0">
      <button 
        @click="startAnalysis" 
        class="button primary-action"
        :class="{ 'analyzing': isAnalyzing }"
        :disabled="isAnalyzing"
      >
        <i class="fas fa-receipt" v-if="!isAnalyzing"></i>
        {{ isAnalyzing ? '解析中...' : '領収書を解析' }}
      </button>
    </div>
  </section>

  <!-- イメージモーダル -->
  <div v-if="selectedImageIndex !== null" class="image-modal" @click="closeImageModal">
    <div class="modal-content" @click.stop>
      <div 
        class="image-container"
        @mousedown.prevent="startPan"
        @mousemove.prevent="pan"
        @mouseup.prevent="stopPan"
        @mouseleave.prevent="stopPan"
        @wheel.prevent="handleZoom"
        @click.stop
      >
        <img 
          :src="selectedImageIndex !== null ? imageUrls[selectedImageIndex] : ''" 
          :alt="selectedImageIndex !== null ? getDisplayFileName(selectedFiles[selectedImageIndex], selectedImageIndex) : ''"
          :style="imageStyle"
          @mousedown.prevent
          @click.prevent
          draggable="false"
        >
      </div>
      <button class="modal-close" @click="closeImageModal">
        <i class="fas fa-times"></i>
      </button>
      <div class="zoom-controls">
        <button @click.stop="adjustZoom(-0.2)" class="zoom-button">
          <i class="fas fa-minus"></i>
        </button>
        <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
        <button @click.stop="adjustZoom(0.2)" class="zoom-button">
          <i class="fas fa-plus"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits, defineProps, onBeforeUnmount, watch, computed } from 'vue';
import { showNotification } from '../utils/notification';
import { RECEIPT_CONSTANTS } from '../constants/receipt';

const props = defineProps<{
  isAnalyzing: boolean
}>();

const emit = defineEmits(['analyze']);
const fileInput = ref<HTMLInputElement | null>(null);
const selectedFiles = ref<File[]>([]);
const imageUrls = ref<string[]>([]);

const formatFileId = (index: number): string => {
  return String(index + 1).padStart(RECEIPT_CONSTANTS.ID.PAD_LENGTH, '0');
};

const getDisplayFileName = (file: File, index: number): string => {
  return `${formatFileId(index)}-${file.name}`;
};

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
  return true;
};

const addFiles = (files: File[]) => {
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
  if (!props.isAnalyzing) {
    emit('analyze', selectedFiles.value);
  }
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

// モーダル関連の状態
const selectedImageIndex = ref<number | null>(null);

const openImageModal = (index: number) => {
  selectedImageIndex.value = index;
  document.body.style.overflow = 'hidden';
  // ズームとパンをリセット
  scale.value = 1;
  offsetX.value = 0;
  offsetY.value = 0;
};

const closeImageModal = () => {
  selectedImageIndex.value = null;
  document.body.style.overflow = '';
  // ズームとパンをリセット
  scale.value = 1;
  offsetX.value = 0;
  offsetY.value = 0;
  // イベントリスナーを削除
  document.removeEventListener('mousemove', pan);
  document.removeEventListener('mouseup', stopPan);
};

// ズームとパン関連の状態
const scale = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);
const isPanning = ref(false);
const startX = ref(0);
const startY = ref(0);

// スタイルの計算
const imageStyle = computed(() => ({
  transform: `translate(${offsetX.value}px, ${offsetY.value}px) scale(${scale.value})`,
  cursor: isPanning.value ? 'grabbing' : 'grab',
  transformOrigin: 'center'
}));

// ズーム処理
const handleZoom = (event: WheelEvent) => {
  event.preventDefault();
  const delta = -Math.sign(event.deltaY) * RECEIPT_CONSTANTS.ZOOM.STEP;
  const newScale = Math.max(
    RECEIPT_CONSTANTS.ZOOM.MIN_SCALE,
    Math.min(RECEIPT_CONSTANTS.ZOOM.MAX_SCALE, scale.value + delta)
  );
  
  if (newScale !== scale.value) {
    // マウス位置を基準にズーム
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // スケール変更に応じてオフセットを調整
    const scaleChange = newScale - scale.value;
    offsetX.value += (mouseX - rect.width / 2) * scaleChange;
    offsetY.value += (mouseY - rect.height / 2) * scaleChange;
    
    scale.value = newScale;
  }
};

// ボタンによるズーム調整
const adjustZoom = (delta: number) => {
  const newScale = Math.max(
    RECEIPT_CONSTANTS.ZOOM.MIN_SCALE,
    Math.min(RECEIPT_CONSTANTS.ZOOM.MAX_SCALE, scale.value + delta)
  );
  scale.value = newScale;
};

// パン処理
const startPan = (event: MouseEvent) => {
  event.preventDefault();
  isPanning.value = true;
  startX.value = event.clientX - offsetX.value;
  startY.value = event.clientY - offsetY.value;
  
  // マウスムーブとマウスアップのイベントリスナーを追加
  document.addEventListener('mousemove', pan);
  document.addEventListener('mouseup', stopPan);
};

const pan = (event: MouseEvent) => {
  if (!isPanning.value) return;
  
  event.preventDefault();
  offsetX.value = event.clientX - startX.value;
  offsetY.value = event.clientY - startY.value;
};

const stopPan = (event?: MouseEvent) => {
  if (event) {
    event.preventDefault();
  }
  isPanning.value = false;
  
  // イベントリスナーを削除
  document.removeEventListener('mousemove', pan);
  document.removeEventListener('mouseup', stopPan);
};
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
  transition: all 0.3s ease;
}

.image-item.highlighted {
  border: 3px solid var(--primary-color);
  box-shadow: 0 0 15px rgba(76, 175, 80, 0.3);
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

.button.primary-action {
  padding: 1rem 2rem;
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 2rem;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.button.primary-action:hover {
  opacity: 0.9;
}

.button.primary-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button.primary-action i {
  font-size: 1.2rem;
}

.button.primary-action.analyzing {
  position: relative;
  padding-left: 2.5rem;
}

.button.primary-action.analyzing::before {
  content: '';
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  border: 2px solid #fff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: translateY(-50%) rotate(360deg);
  }
}

/* モーダルスタイル */
.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 3rem;
  box-sizing: border-box;
}

.modal-content {
  position: relative;
  width: auto;
  height: auto;
  max-width: min(1000px, calc(100vw - 6rem));
  max-height: calc(100vh - 6rem);
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.modal-content img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: calc(100vh - 10rem);
  object-fit: contain;
  display: block;
  margin: auto;
}

.modal-close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.9);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #666;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  z-index: 1;
}

.modal-close:hover {
  background-color: #f44336;
  color: white;
}

/* 画像のホバー効果 */
.image-item img {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.image-item img:hover {
  transform: scale(1.05);
}

.image-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  cursor: grab;
  touch-action: none;
  background-color: white;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.image-container:active {
  cursor: grabbing;
}

.image-container img {
  max-width: 100%;
  max-height: calc(100vh - 10rem);
  object-fit: contain;
  transition: transform 0.1s ease;
  user-select: none;
  pointer-events: none;
  padding: 1rem;
}

.zoom-controls {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: white;
  padding: 0.5rem;
  border-radius: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.zoom-button {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: none;
  background-color: var(--primary-color);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.zoom-button:hover {
  opacity: 0.9;
}

.zoom-level {
  min-width: 4rem;
  text-align: center;
  font-size: 0.9rem;
  color: #666;
}
</style> 