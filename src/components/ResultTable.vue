<template>
  <section class="result-section section-container" v-if="results.length > 0">
    <h2>解析結果</h2>
    <div class="result-table-wrapper">
      <table class="result-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>氏名</th>
            <th>医療機関</th>
            <th>診察・医療</th>
            <th>医薬品購入</th>
            <th>介護保険</th>
            <th>その他</th>
            <th>支払額</th>
            <th>補填額</th>
            <th>日付</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(result, index) in results" :key="index">
            <td>
              <a href="#" class="id-link" @click.prevent="scrollToImage(result.id)">{{ result.id }}</a>
            </td>
            <td>{{ result.name }}</td>
            <td>{{ result.institution }}</td>
            <td class="category-cell">
              <i 
                :class="['fas', result.medical ? 'fa-check' : 'fa-times']"
                :style="{ color: result.medical ? 'var(--success-color)' : '#999' }"
              ></i>
            </td>
            <td class="category-cell">
              <i 
                :class="['fas', result.pharmacy ? 'fa-check' : 'fa-times']"
                :style="{ color: result.pharmacy ? 'var(--success-color)' : '#999' }"
              ></i>
            </td>
            <td class="category-cell">
              <i 
                :class="['fas', result.nursing ? 'fa-check' : 'fa-times']"
                :style="{ color: result.nursing ? 'var(--success-color)' : '#999' }"
              ></i>
            </td>
            <td class="category-cell">
              <i 
                :class="['fas', result.other ? 'fa-check' : 'fa-times']"
                :style="{ color: result.other ? 'var(--success-color)' : '#999' }"
              ></i>
            </td>
            <td>{{ formatNumber(result.payment) }}円</td>
            <td>{{ formatNumber(result.refund) }}円</td>
            <td>{{ formatDate(result.date) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="button-group">
      <button @click="formatData" class="format-button" :disabled="isFormatting">
        <i class="fas fa-magic" v-if="!isFormatting"></i>
        {{ isFormatting ? 'データ整形中...' : 'データを整形' }}
      </button>
    </div>
  </section>

  <section class="result-section section-container" v-if="formattedResults.length > 0">
    <h2>整形結果</h2>
    <div class="result-table-wrapper">
      <table class="result-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>氏名</th>
            <th>医療機関</th>
            <th>診察・医療</th>
            <th>医薬品購入</th>
            <th>介護保険</th>
            <th>その他</th>
            <th>支払額</th>
            <th>補填額</th>
            <th>日付</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(result, index) in formattedResults" :key="index">
            <td>{{ result.id }}</td>
            <td>{{ result.name }}</td>
            <td>{{ result.institution }}</td>
            <td class="category-cell">
              <i 
                :class="['fas', result.medical ? 'fa-check' : 'fa-times']"
                :style="{ color: result.medical ? 'var(--success-color)' : '#999' }"
              ></i>
            </td>
            <td class="category-cell">
              <i 
                :class="['fas', result.pharmacy ? 'fa-check' : 'fa-times']"
                :style="{ color: result.pharmacy ? 'var(--success-color)' : '#999' }"
              ></i>
            </td>
            <td class="category-cell">
              <i 
                :class="['fas', result.nursing ? 'fa-check' : 'fa-times']"
                :style="{ color: result.nursing ? 'var(--success-color)' : '#999' }"
              ></i>
            </td>
            <td class="category-cell">
              <i 
                :class="['fas', result.other ? 'fa-check' : 'fa-times']"
                :style="{ color: result.other ? 'var(--success-color)' : '#999' }"
              ></i>
            </td>
            <td>{{ formatNumber(result.payment) }}円</td>
            <td>{{ formatNumber(result.refund) }}円</td>
            <td>{{ formatDate(result.date) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="button-group">
      <button @click="copyAsJson" class="copy-button">JSONコピー</button>
      <button @click="copyAsExcel" class="copy-button">Excel用コピー</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { defineProps, ref } from 'vue';
import { showNotification } from '../utils/notification';
import { MedicalReceipt } from '../types/MedicalReceipt';
import { geminiApi } from '../utils/GeminiAPI';

const props = defineProps<{
  results: MedicalReceipt[];
}>();

const isFormatting = ref(false);
const formattedResults = ref<MedicalReceipt[]>([]);

const scrollToImage = (id: string) => {
  document.querySelectorAll('.image-item').forEach(item => {
    item.classList.remove('highlighted');
  });

  const imageElement = document.getElementById(`receipt-${id}`);
  if (imageElement) {
    imageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    imageElement.classList.add('highlighted');
    setTimeout(() => {
      imageElement.classList.remove('highlighted');
    }, 3000);
  }
};

const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

const formatDate = (date: string): string => {
  if (!date) return '';
  try {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  } catch {
    return date;
  }
};

const formatData = async () => {
  if (isFormatting.value) return;
  
  try {
    isFormatting.value = true;
    showNotification('データの整形を開始します...', 'info');
    
    const { results, explanation } = await geminiApi.formatData(props.results);
    formattedResults.value = results;
    
    if (explanation) {
      showNotification(explanation, 'info');
    }
    
    showNotification('データの整形が完了しました', 'success');
  } catch (error) {
    showNotification((error as Error).message, 'error');
  } finally {
    isFormatting.value = false;
  }
};

const copyAsJson = () => {
  const jsonString = JSON.stringify(formattedResults.value.length > 0 ? formattedResults.value : props.results, null, 2);
  navigator.clipboard.writeText(jsonString)
    .then(() => showNotification('JSONをクリップボードにコピーしました', 'success'))
    .catch(() => showNotification('コピーに失敗しました', 'error'));
};

const copyAsExcel = () => {
  const targetResults = formattedResults.value.length > 0 ? formattedResults.value : props.results;
  const rows = targetResults.map(result => [
    result.name,
    result.institution,
    result.medical ? '該当する' : '',
    result.pharmacy ? '該当する' : '',
    result.nursing ? '該当する' : '',
    result.other ? '該当する' : '',
    result.payment ? result.payment.toString() : '',
    result.refund ? result.refund.toString() : '',
    result.date
  ].join('\t'));

  navigator.clipboard.writeText(rows.join('\n'))
    .then(() => showNotification('Excel用データをクリップボードにコピーしました', 'success'))
    .catch(() => showNotification('コピーに失敗しました', 'error'));
};
</script>

<style scoped>
.result-section {
  margin: 1rem 0;
}

.result-table-wrapper {
  overflow-x: auto;
  margin: 0;
  background-color: white;
  border-radius: 4px;
}

.result-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
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
  color: #666;
  white-space: nowrap;
}

.result-table tr:hover {
  background-color: #f8f9fa;
}

.category-cell {
  text-align: center;
}

.category-cell i {
  font-size: 1.1rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.copy-button {
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: opacity 0.2s ease;
}

.copy-button:hover {
  opacity: 0.9;
}

.format-button {
  padding: 0.75rem 1.5rem;
  background-color: #6c5ce7;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: opacity 0.2s ease;
}

.format-button:hover {
  opacity: 0.9;
}

.format-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.format-button i {
  font-size: 1rem;
}

.id-link {
  color: var(--primary-color);
  text-decoration: none;
  cursor: pointer;
  font-weight: 500;
}

.id-link:hover {
  text-decoration: underline;
}
</style> 