<template>
  <div class="container">
    <Header />
    <Notification />
    <ConnectionSettings />
    <ImageUpload @analyze="handleAnalyze" />
    <ResultTable :results="results" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Header from './components/Header.vue';
import Notification from './components/Notification.vue';
import ConnectionSettings from './components/ConnectionSettings.vue';
import ImageUpload from './components/ImageUpload.vue';
import ResultTable from './components/ResultTable.vue';
import { geminiApi } from './utils/gemini';
import { showNotification } from './utils/notification';
import { MedicalReceipt } from './types/receipt';

const results = ref<MedicalReceipt[]>([]);

const handleAnalyze = async (files: File[]) => {
  try {
    const newResults: MedicalReceipt[] = [];
    for (const file of files) {
      const reader = new FileReader();
      const imageData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await geminiApi.analyzeReceipt(imageData);
      newResults.push(result);
    }
    results.value = [...results.value, ...newResults];
    showNotification('領収書の解析が完了しました', 'success');
  } catch (error) {
    showNotification((error as Error).message, 'error');
  }
};
</script>

<style>
@import 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';

:root {
  --primary-color: #40B883;
  --error-color: #f44336;
  --success-color: #40B883;
  --info-color: #2196F3;
  --text-color: #333;
  --border-color: #ddd;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: #f8f9fa;
  color: var(--text-color);
  line-height: 1.5;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

.section-container {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

h2 {
  font-size: 1rem;
  font-weight: normal;
  margin: 0;
  padding: 0.75rem 1rem;
  color: var(--text-color);
  border-bottom: 1px solid var(--border-color);
}

button {
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.5;
}

input {
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.5;
}

* {
  box-sizing: border-box;
}

/* 通知スタイル */
.notification {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 300px;
  max-width: 400px;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 0.95em;
  background: white;
  margin-bottom: 0.5rem;
}

.notification.success {
  background-color: var(--success-color);
  color: white;
}

.notification.error {
  background-color: var(--error-color);
  color: white;
}

.notification.info {
  background-color: var(--info-color);
  color: white;
}

.notification.warning {
  background-color: #ff9800;
  color: white;
}

/* ボタンスタイル */
.button {
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.button:hover {
  opacity: 0.9;
}

.button.primary {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

/* テーブルスタイル */
.result-table {
  width: 100%;
  border-collapse: collapse;
}

.result-table th,
.result-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.result-table th {
  background-color: #f8f9fa;
  font-weight: 500;
}

.result-table tr:hover {
  background-color: #f8f9fa;
}
</style>
