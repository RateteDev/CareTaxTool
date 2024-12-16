<template>
  <div class="connection-settings section-container">
    <h2>接続先設定</h2>
    <div class="settings-group">
      <div class="setting-item">
        <label for="model-name">モデル名:</label>
        <div class="input-group">
          <select 
            id="model-name" 
            v-model="modelName" 
            class="model-select"
            @change="updateModel"
          >
            <option value="gemini-1.5-flash">gemini-1.5-flash</option>
            <option value="gemini-2.0-flash-exp">gemini-2.0-flash-exp</option>
          </select>
        </div>
      </div>
      <div class="setting-item">
        <label for="api-key">API Key:</label>
        <div class="input-group">
          <input 
            :type="showApiKey ? 'text' : 'password'" 
            id="api-key" 
            v-model="apiKey" 
            placeholder="API Keyを入力してください"
            autocomplete="off"
            @paste="handleApiKeyPaste"
          >
          <button 
            class="button icon-button"
            @click="toggleApiKeyVisibility"
            :title="showApiKey ? '非表示' : '表示'"
          >
            <i :class="showApiKey ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
          </button>
          <button 
            @click="updateApiKey" 
            class="button"
            :disabled="!apiKey"
          >更新</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { showNotification } from '../utils/notification';
import { geminiApi } from '../utils/GeminiAPI';

const modelName = ref('gemini-1.5-flash');
const apiKey = ref('');
const showApiKey = ref(false);
const lastUpdated = ref<string>('');

// ローカルストレージから設定を復元
const savedApiKey = localStorage.getItem('geminiApiKey');
const savedModelName = localStorage.getItem('modelName');
const savedLastUpdated = localStorage.getItem('lastUpdated');

onMounted(() => {
  console.log('ConnectionSettings: コンポーネントがマウントされました');
  
  if (savedApiKey) {
    console.log('ConnectionSettings: 保存済みのAPI Keyを復元します');
    apiKey.value = savedApiKey;
    geminiApi.setApiKey(savedApiKey);
    showNotification('API Keyを復元しました', 'info');
  }

  if (savedModelName) {
    console.log('ConnectionSettings: 保存済みのモデル名を復元します');
    modelName.value = savedModelName;
    geminiApi.setModelName(savedModelName);
  }

  if (savedLastUpdated) {
    lastUpdated.value = savedLastUpdated;
  }
});

const updateModel = () => {
  console.log('ConnectionSettings: モデル名を更新します:', modelName.value);
  localStorage.setItem('modelName', modelName.value);
  geminiApi.setModelName(modelName.value);
  showNotification('モデル名を更新しました', 'success');
};

const updateApiKey = () => {
  if (!apiKey.value.trim()) {
    showNotification('API Keyを入力してください', 'warning');
    return;
  }

  console.log('ConnectionSettings: API Keyを更新します');
  localStorage.setItem('geminiApiKey', apiKey.value);
  localStorage.setItem('lastUpdated', new Date().toLocaleString('ja-JP'));
  lastUpdated.value = new Date().toLocaleString('ja-JP');
  geminiApi.setApiKey(apiKey.value);
  showNotification('API Keyを更新しました', 'success');
  
  // セキュリティのため、更新後は非表示に戻す
  showApiKey.value = false;
};

const toggleApiKeyVisibility = () => {
  showApiKey.value = !showApiKey.value;
};

const handleApiKeyPaste = (event: ClipboardEvent) => {
  // ペースト時に余分な空白を削除
  event.preventDefault();
  const pastedText = event.clipboardData?.getData('text') || '';
  apiKey.value = pastedText.trim();
};
</script>

<style scoped>
.connection-settings {
  margin-bottom: 2rem;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-item label {
  color: var(--text-color);
  font-size: 0.9rem;
  font-weight: 500;
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

.model-select {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background-color: white;
  color: var(--text-color);
  font-size: 0.9rem;
  transition: border-color 0.2s ease;
  height: 2.75rem;
  box-sizing: border-box;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8.825L1.175 4 2.238 2.938 6 6.7l3.763-3.762L10.825 4z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;
}

.model-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.model-select:hover {
  border-color: var(--primary-color);
}

input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background-color: white;
  color: var(--text-color);
  font-size: 0.9rem;
  transition: border-color 0.2s ease;
  height: 2.75rem;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: var(--primary-color);
}

input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

input::placeholder {
  color: #999;
}

.button {
  padding: 0.75rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  min-width: 60px;
  transition: background-color 0.2s ease;
  height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button:not(:disabled):hover {
  opacity: 0.9;
}

.icon-button {
  padding: 0.5rem;
  min-width: 2.75rem;
  background-color: #6c757d;
  height: 2.75rem;
}

input[type="checkbox"] {
  margin: 0;
  width: 16px;
  height: 16px;
}

.help-text {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.25rem;
}

.debug-info {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #666;
}
</style> 