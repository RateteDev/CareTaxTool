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
          <div class="input-wrapper">
            <input 
              :type="showApiKey ? 'text' : 'password'" 
              id="api-key" 
              v-model="apiKey" 
              placeholder="API Keyを入力してください"
              autocomplete="off"
              @paste="handleApiKeyPaste"
            >
            <button 
              class="visibility-toggle"
              @click="toggleApiKeyVisibility"
              :title="showApiKey ? '非表示' : '表示'"
              type="button"
            >
              <i :class="showApiKey ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
        </div>
      </div>
      <div class="button-group">
        <button 
          @click="updateApiKey" 
          class="button primary-action"
          :disabled="!apiKey"
        >更新</button>
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
  showNotification('接続先設定を更新しました', 'success');
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
  showNotification('接続先設定を更新しました', 'success');
  
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
  gap: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.setting-item label {
  flex: 0 0 100px;
  text-align: right;
  color: #666;
  font-size: 0.9rem;
}

.input-group {
  flex: 1;
  display: flex;
  gap: 0.5rem;
  max-width: 400px;
}

.input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper input {
  width: 100%;
  padding: 0.5rem;
  padding-right: 2.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.9rem;
  color: var(--text-color);
  background-color: white;
  margin: 0;
  box-sizing: border-box;
}

.input-wrapper input:hover {
  border-color: var(--primary-color);
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.visibility-toggle {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
  height: 24px;
}

.visibility-toggle:hover {
  color: var(--primary-color);
}

.model-select {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: white;
  color: var(--text-color);
  font-size: 0.9rem;
  cursor: pointer;
}

.model-select:hover {
  border-color: var(--primary-color);
}

.button-group {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
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
  white-space: nowrap;
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

h2 {
  font-size: 1.1rem;
  margin: 0 0 1.5rem 0;
  padding: 0;
  color: var(--text-color);
  font-weight: 500;
  text-align: center;
}
</style> 