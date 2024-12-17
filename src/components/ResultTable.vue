<template>
  <section class="result-section section-container" v-if="results.length > 0">
    <h2>{{ headerText }}</h2>
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
            <td>
              <input 
                type="text" 
                v-model="result.name" 
                class="editable-input"
                @change="handleEdit"
                :disabled="isFormatting"
              >
            </td>
            <td>
              <input 
                type="text" 
                v-model="result.institution" 
                class="editable-input"
                @change="handleEdit"
                :disabled="isFormatting"
              >
            </td>
            <td class="category-cell">
              <i 
                :class="['fas', result.medical ? 'fa-check' : 'fa-times', 'clickable']"
                :style="{ color: result.medical ? 'var(--success-color)' : '#999' }"
                @click="!isFormatting && toggleCategory(index, 'medical')"
              ></i>
            </td>
            <td class="category-cell">
              <i 
                :class="['fas', result.pharmacy ? 'fa-check' : 'fa-times', 'clickable']"
                :style="{ color: result.pharmacy ? 'var(--success-color)' : '#999' }"
                @click="!isFormatting && toggleCategory(index, 'pharmacy')"
              ></i>
            </td>
            <td class="category-cell">
              <i 
                :class="['fas', result.nursing ? 'fa-check' : 'fa-times', 'clickable']"
                :style="{ color: result.nursing ? 'var(--success-color)' : '#999' }"
                @click="!isFormatting && toggleCategory(index, 'nursing')"
              ></i>
            </td>
            <td class="category-cell">
              <i 
                :class="['fas', result.other ? 'fa-check' : 'fa-times', 'clickable']"
                :style="{ color: result.other ? 'var(--success-color)' : '#999' }"
                @click="!isFormatting && toggleCategory(index, 'other')"
              ></i>
            </td>
            <td>
              <input 
                type="number" 
                v-model.number="result.payment" 
                class="editable-input number-input"
                @change="handleEdit"
                :disabled="isFormatting"
              ><span>円</span>
            </td>
            <td>
              <input 
                type="number" 
                v-model.number="result.refund" 
                class="editable-input number-input"
                @change="handleEdit"
                :disabled="isFormatting"
              ><span>円</span>
            </td>
            <td>
              <input 
                type="date" 
                v-model="result.date"
                class="editable-input date-input"
                @change="handleEdit"
                :disabled="isFormatting"
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="button-group">
      <button class="button primary-action" @click="copyToClipboard" :disabled="isFormatting">
        <i class="far fa-copy"></i>
        Excel用にコピー
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue';
import { showNotification } from '../utils/notification';
import { MedicalReceipt } from '../types/MedicalReceipt';

const props = defineProps<{
  results: MedicalReceipt[];
  isFormatting?: boolean;
}>();

// 進捗状況に応じた見出しテキスト
const headerText = computed(() => {
  if (props.isFormatting) {
    return 'データを整形中...';
  }
  return '解析結果';
});

// 編集処理
const handleEdit = () => {
  showNotification('データを更新しました', 'success');
};

// カテゴリーの切り替え
const toggleCategory = (index: number, category: 'medical' | 'pharmacy' | 'nursing' | 'other') => {
  if (props.results[index]) {
    props.results[index][category] = !props.results[index][category];
    handleEdit();
  }
};

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

// Excel用のデータをコピー
const copyToClipboard = () => {
  // ヘータ行の作成（ヘッダーなし、ID列なし）
  const rows = props.results.map(result => [
    result.name, // 医療を受けた人
    result.institution, // 病院・薬局などの名称
    result.medical ? '該当する' : '', // 診療・治療
    result.pharmacy ? '該当する' : '', // 医薬品購入
    result.nursing ? '該当する' : '', // 介護保険サービス
    result.other ? '該当する' : '', // その他の医療費
    String(result.payment).padStart(9, ' '), // 支払った医療費の金額（半角数字9桁以内）
    String(result.refund).padStart(9, ' '), // 補填される金額（半角数字9桁以内）
    result.date // 支払年月日
  ]);

  // タブ区切りのテキストを作成（ヘッダーなし）
  const tsv = rows.map(row => row.join('\t')).join('\n');

  // クリップボードにコピー
  navigator.clipboard.writeText(tsv)
    .then(() => {
      showNotification('Excel用にデータをコピーしました', 'success');
    })
    .catch(() => {
      showNotification('データのコピーに失敗しました', 'error');
    });
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
  min-width: auto;
}

.result-table th,
.result-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  height: 24px;
  line-height: 24px;
  vertical-align: middle;
  position: relative;
}

.result-table th {
  background-color: #f8f9fa;
  font-weight: 500;
  color: #666;
  white-space: nowrap;
  text-align: center;
}

.result-table tr:hover {
  background-color: #f8f9fa;
}

.category-cell {
  text-align: center;
  width: 70px;
  position: relative;
}

.category-cell i {
  font-size: 1rem;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transform-origin: center;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
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

.id-link {
  color: var(--primary-color);
  text-decoration: none;
  cursor: pointer;
  font-weight: 500;
  display: block;
  text-align: center;
}

.id-link:hover {
  text-decoration: underline;
}

.editable-input {
  width: 100%;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  font-size: inherit;
  color: inherit;
  font-family: inherit;
  height: 24px;
  line-height: 24px;
  position: absolute;
  top: 50%;
  left: 0.75rem;
  transform: translateY(-50%);
  margin: 0;
}

.editable-input:hover {
  border-color: var(--border-color);
  background-color: white;
}

.editable-input:focus {
  border-color: var(--primary-color);
  background-color: white;
  outline: none;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.number-input {
  width: 55px;
  text-align: right;
  padding-right: 2px;
  right: 1.5rem;
  left: auto;
  -moz-appearance: textfield;
}

.number-input::-webkit-outer-spin-button,
.number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.date-input {
  width: 95px;
  text-align: center;
  padding: 0;
  cursor: pointer;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.date-input::-webkit-calendar-picker-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: auto;
  height: auto;
  color: transparent;
  background: transparent;
}

.date-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  display: none;
}

.date-input::-webkit-clear-button {
  -webkit-appearance: none;
  display: none;
}

.clickable {
  cursor: pointer;
  transition: transform 0.2s ease, margin 0.2s ease;
}

.clickable:hover {
  transform: scale(1.2) translate(-8px, -8px);
}

/* カテゴリー列のスタイル */
td:nth-child(4),
td:nth-child(5),
td:nth-child(6),
td:nth-child(7) {
  text-align: center;
}

/* 支払額と補填額のセルのスタイル */
td:nth-child(8),
td:nth-child(9) {
  position: relative;
  white-space: nowrap;
  width: 80px;
  text-align: right;
}

td:nth-child(8) span,
td:nth-child(9) span {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
}

/* 医療機関名のセルの幅を固定 */
td:nth-child(3) {
  width: 220px;
  text-align: left;
}

/* ID列の幅を固定 */
td:nth-child(1) {
  width: 50px;
  text-align: center;
}

/* 氏名列の幅を固定 */
td:nth-child(2) {
  width: 100px;
  text-align: center;
}

/* 日付列の幅を固定 */
td:nth-child(10) {
  width: 95px;
  text-align: center;
  position: relative;
}

.editable-input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background-color: #f5f5f5;
}

/* データ整形中は hover 効果を無効化 */
tr:has(.editable-input:disabled) .clickable {
  cursor: not-allowed;
  transform: none;
}

tr:has(.editable-input:disabled) .clickable:hover {
  transform: none;
}
</style> 