<template>
  <div class="app">
    <Header />
    <Notification />
    <main>
      <ConnectionSettings />
      <ImageUpload 
        :is-analyzing="isAnalyzing"
        @analyze="handleAnalyze"
      />
      <ResultTable 
        :results="results"
        :is-formatting="isFormatting"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Header from './components/Header.vue';
import Notification from './components/Notification.vue';
import ConnectionSettings from './components/ConnectionSettings.vue';
import ImageUpload from './components/ImageUpload.vue';
import ResultTable from './components/ResultTable.vue';
import { geminiApi } from './utils/GeminiAPI';
import { showNotification } from './utils/notification';
import { MedicalReceipt } from './types/MedicalReceipt';

const results = ref<MedicalReceipt[]>([]);
const isAnalyzing = ref(false);
const isFormatting = ref(false);

const handleAnalyze = async (files: File[]) => {
  if (isAnalyzing.value) return;
  
  try {
    isAnalyzing.value = true;
    results.value = [];
    showNotification('領収書の解析を開始します...', 'info');
    
    // 画像を5枚ずつのグループに分割
    const chunks = [];
    for (let i = 0; i < files.length; i += 5) {
      chunks.push(files.slice(i, i + 5));
    }
    
    const allResults = [];
    
    // 各グループを0.3秒ずつずらして処理
    for (let i = 0; i < chunks.length; i++) {
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 300)); // 0.3秒待機
      }
      
      // グループ内の画像を並列処理
      const startIndex = i * 5;
      const processPromises = chunks[i].map((file, index) => 
        processFile(file, startIndex + index)
      );
      const chunkResults = await Promise.all(processPromises);
      allResults.push(...chunkResults);
    }
    
    // エラーのない結果のみを抽出
    const validResults = allResults.filter(result => result !== null);
    
    // 結果を ID でソート
    results.value = validResults.sort((a, b) => a.id.localeCompare(b.id));
    
    // すべての画像の処理が完了したら、データ整形を実行
    if (results.value.length > 0) {
      isFormatting.value = true;
      showNotification('データの整形を開始します...', 'info');
      const { results: formattedData, explanation } = await geminiApi.formatData(results.value);
      results.value = formattedData;
      
      if (explanation) {
        showNotification(explanation, 'info');
      }
      
      showNotification('データの整形が完了しました', 'success');
      isFormatting.value = false;
    }
    
    showNotification('すべての処理が完了しました', 'success');
  } catch (error) {
    showNotification((error as Error).message, 'error');
  } finally {
    isAnalyzing.value = false;
    isFormatting.value = false;
  }
};

const processFile = async (file: File, index: number) => {
  try {
    const reader = new FileReader();
    const imageData = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const result = await geminiApi.analyzeReceipt(imageData);
    // IDを付与
    result.id = String(index + 1).padStart(3, '0');
    showNotification(`${file.name}の解析が完了しました`, 'success');
    return result;
  } catch (error) {
    showNotification(`${file.name}の解析に失敗しました: ${(error as Error).message}`, 'error');
    return null;
  }
};
</script>

<style>
@import 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';

:root {
  --primary-color: #4CAF50;
  --error-color: #f44336;
  --success-color: #4CAF50;
  --info-color: #2196F3;
  --text-color: #333;
  --border-color: #e0e0e0;
  --background-color: #ffffff;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: #f5f5f5;
  color: var(--text-color);
  line-height: 1.5;
}

#root {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  min-height: 100dvh;
  width: 100%;
  background-color: #f5f5f5;
  padding: 2rem;
  box-sizing: border-box;
}

.section-container {
  width: 1200px;
  background-color: var(--background-color);
  border-radius: 1rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
  padding: 1.5rem;
  box-sizing: border-box;
}

h2 {
  font-size: 1.125rem;
  font-weight: 500;
  margin: 0 0 1rem 0;
  padding: 0;
  color: var(--text-color);
}

.button {
  padding: 0.75rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.button:hover {
  background-color: #43a047;
}

.button.primary {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  height: 3rem;
}

input {
  padding: 0.75rem 1rem;
  border: 0.0625rem solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  width: 100%;
  margin-bottom: 1rem;
  box-sizing: border-box;
  height: 2.75rem;
}

.upload-area {
  border: 0.125rem dashed var(--border-color);
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  background-color: #fafafa;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

.upload-area:hover {
  border-color: var(--primary-color);
  background-color: #f5f5f5;
}

.upload-icon {
  font-size: 3rem;
  color: #9e9e9e;
  margin-bottom: 1rem;
}

.result-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  box-sizing: border-box;
}

.result-table th,
.result-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 0.0625rem solid var(--border-color);
  box-sizing: border-box;
}

.result-table th {
  background-color: #fafafa;
  font-weight: 500;
  color: #666;
}

.result-table tr:hover {
  background-color: #f5f5f5;
}

.header {
  width: 1200px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  box-sizing: border-box;
}

.header h1 {
  font-size: 1.5rem;
  font-weight: 500;
  margin: 0;
}

.header-contact {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #666;
}

.header-contact a {
  color: inherit;
  text-decoration: none;
}

.header-contact a:hover {
  color: var(--primary-color);
}

.button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.button.analyzing {
  position: relative;
  padding-left: 2.5rem;
}

.button.analyzing::before {
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
</style>
