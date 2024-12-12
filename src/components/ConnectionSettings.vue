<template>
  <div class="api-key-section">
    <div class="developer-mode">
      <label class="checkbox-label">
        <input type="checkbox" v-model="isDeveloperMode">
        <span class="checkbox-text">開発者モード</span>
      </label>
    </div>

    <div class="connection-settings section-container">
      <h2>接続先設定</h2>
      <div class="settings-group">
        <div class="setting-item">
          <label for="model-name">モデル名:</label>
          <div class="api-key-input-group">
            <input 
              type="text" 
              id="model-name" 
              v-model="modelName" 
              placeholder="モデル名を入力"
              :disabled="!isDeveloperMode"
            >
            <button 
              @click="updateModel" 
              class="button"
              :disabled="!isDeveloperMode || !modelName"
            >更新</button>
          </div>
          <div v-if="isDeveloperMode" class="help-text">
            ※ モデル名の変更は開発者モードでのみ可能です
          </div>
        </div>
        <div class="setting-item">
          <label for="api-key">API Key:</label>
          <div class="api-key-input-group">
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
          <div v-if="isDeveloperMode" class="debug-info">
            <div>API Key長: {{ apiKey.length }}文字</div>
            <div>最終更新: {{ lastUpdated }}</div>
          </div>
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
.api-key-section {
  margin: 1rem 0;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.developer-mode {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: var(--text-color);
  font-size: 0.9rem;
}

.connection-settings {
  padding: 1rem;
  background-color: white;
}

.connection-settings h2 {
  font-size: 1rem;
  margin-bottom: 1rem;
  color: var(--text-color);
  font-weight: normal;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-item label {
  color: var(--text-color);
  font-size: 0.9rem;
}

.api-key-input-group {
  display: flex;
  gap: 0.5rem;
}

input[type="text"],
input[type="password"] {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: white;
  color: var(--text-color);
  font-size: 0.9rem;
}

input[type="text"]:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

input[type="text"]::placeholder,
input[type="password"]::placeholder {
  color: #999;
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