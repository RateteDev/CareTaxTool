<template>
  <div class="connection-settings section-container">
    <h2>接続先設定</h2>
    <div class="settings-group">
      <div class="setting-item">
        <label for="model-name">モデル名:</label>
        <div class="input-group">
          <input 
            type="text" 
            id="model-name" 
            v-model="modelName" 
            placeholder="モデル名を入力"
          >
          <button 
            @click="updateModel" 
            class="button"
            :disabled="!modelName"
          >更新</button>
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
import { geminiApi } from '../utils/gemini';

const isDeveloperMode = ref(false);
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
  if (!isDeveloperMode.value) {
    showNotification('開発者モードでのみモデル名を変更できます', 'warning');
    return;
  }

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

input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: white;
  color: var(--text-color);
  font-size: 0.9rem;
  transition: border-color 0.2s ease;
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
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  min-width: 60px;
  transition: background-color 0.2s ease;
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
  min-width: 36px;
  background-color: #6c757d;
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