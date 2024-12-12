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
  min-height: 100vh;
  min-height: 100dvh;
}

#app {
  min-height: 100vh;
  min-height: 100dvh;
  background-color: #f5f5f5;
}

.container {
  width: 100%;
  max-width: 75rem;
  margin: 0 auto;
  padding: 2rem;
  box-sizing: border-box;
  min-height: 100vh;
  min-height: 100dvh;
}

@media (max-width: 80rem) {
  .container {
    max-width: 60rem;
  }
}

@media (max-width: 64rem) {
  .container {
    max-width: 90%;
    padding: 1.5rem;
  }

  .section-container {
    padding: 1.25rem;
  }
}

@media (max-width: 48rem) {
  body {
    background-color: #fff;
  }

  #app {
    background-color: #fff;
  }

  .container {
    padding: 1rem;
  }

  .section-container {
    box-shadow: none;
    border: 0.0625rem solid var(--border-color);
  }

  .section-container {
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  h2 {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }

  .button {
    padding: 0.5rem 0.75rem;
  }

  .button.primary {
    padding: 0.5rem 1rem;
  }

  input {
    padding: 0.5rem;
    font-size: 0.875rem;
  }

  .result-table th,
  .result-table td {
    padding: 0.75rem;
    font-size: 0.875rem;
  }
}

@media (max-width: 30rem) {
  .container {
    padding: 0.75rem;
  }

  .section-container {
    padding: 0.75rem;
    margin-bottom: 1rem;
  }

  .upload-area {
    padding: 1.5rem 1rem;
  }

  .upload-icon {
    font-size: 2.5rem;
  }
}

.section-container {
  background-color: var(--background-color);
  border-radius: 0.5rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
  padding: 1.5rem;
}

h2 {
  font-size: 1.125rem;
  font-weight: 500;
  margin: 0 0 1rem 0;
  padding: 0;
  color: var(--text-color);
}

.button {
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.button:hover {
  background-color: #43a047;
}

.button.primary {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

input {
  padding: 0.5rem;
  border: 0.0625rem solid var(--border-color);
  border-radius: 0.25rem;
  font-size: 0.875rem;
  width: 100%;
  margin-bottom: 1rem;
}

.upload-area {
  border: 0.125rem dashed var(--border-color);
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  background-color: #fafafa;
  cursor: pointer;
  transition: all 0.2s ease;
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
}

.result-table th,
.result-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 0.0625rem solid var(--border-color);
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
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
</style>
