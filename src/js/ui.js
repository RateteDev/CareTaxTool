import { geminiApi } from './api.js';
import { copyToClipboard, fileToDataUrl, showNotification } from './utils.js';

export class UI {
    constructor() {
        console.log('UI: 初期化開始');
        this.uploadArea = document.getElementById('upload-area');
        this.fileInput = document.getElementById('file-input');
        this.resultContent = document.getElementById('result-content');
        this.copyButton = document.getElementById('copy-button');
        this.copyExcelButton = document.getElementById('copy-excel-button');
        this.apiKeyInput = document.getElementById('api-key');
        this.updateApiKeyButton = document.getElementById('update-api-key');
        this.uploadButton = document.getElementById('upload-button');
        this.imagesGrid = document.getElementById('images-grid');

        // 選択された画像の管理用Map（キー: ファイル名, 値: {file: File, dataUrl: string}）
        this.selectedImageMap = new Map();
        // 最新の解析結果
        this.lastResult = null;

        this.initializeEventListeners();
        console.log('UI: 初期化完了');
    }

    /**
     * イベントリスナーを初期化する
     */
    initializeEventListeners() {
        // ドラッグ&ドロップイベント
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('drag-over');
            console.log('UI: ドラッグオーバー');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('drag-over');
            console.log('UI: ドラッグリーブ');
        });

        this.uploadArea.addEventListener('drop', async (e) => {
            console.log('UI: ファイルドロップ');
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files);
            await this.handleFileSelection(files);
        });

        // ファイル選択イベント
        this.fileInput.addEventListener('change', async (e) => {
            console.log('UI: ファイル選択');
            const files = Array.from(e.target.files);
            await this.handleFileSelection(files);
        });

        // コピーボタンイベント
        this.copyButton.addEventListener('click', () => {
            console.log('UI: コピーボタンクリック');
            if (!this.lastResult) {
                console.warn('UI: コピーする解析結果がありません');
                showNotification('コピーする解析結果がありません', 'error');
                return;
            }
            try {
                copyToClipboard(this.lastResult);
                console.log('UI: JSONコピー成功');
                showNotification('JSONをクリップボードにコピーしました', 'success');
            } catch (error) {
                console.error('UI: JSONコピーエラー:', error);
                showNotification('JSONのコピーに失敗しました', 'error');
            }
        });

        // Excel用コピーボタンイベント
        this.copyExcelButton.addEventListener('click', () => {
            console.log('UI: Excel用コピーボタンクリック');
            this.copyForExcel();
        });

        // API Key更新イベント
        this.updateApiKeyButton.addEventListener('click', () => {
            console.log('UI: API Key更新ボタンクリック');
            const apiKey = this.apiKeyInput.value;
            if (!apiKey) {
                console.warn('UI: API Keyが未入力');
                showNotification('API Keyを入力してください', 'error');
                return;
            }
            try {
                console.log('UI: API Key更新開始');
                geminiApi.setApiKey(apiKey);
                localStorage.setItem('geminiApiKey', apiKey);
                console.log('UI: API Key更新成功');
                showNotification('API Keyを更新しました', 'success');
            } catch (error) {
                console.error('UI: API Key更新エラー:', error);
                showNotification('API Keyの更新に失敗しました', 'error');
            }
        });

        // アップロードボタンイベント
        this.uploadButton.addEventListener('click', () => {
            console.log('UI: アップロードボタンクリック');
            this.processSelectedFiles();
        });

        console.log('UI: イベントリスナーの初期化完了');
    }

    /**
     * ファイル選択時の処理
     * @param {File[]} files - 選択されたファイルリスト
     */
    async handleFileSelection(files) {
        console.log('UI: ファイル選択処理開始');

        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                console.warn('UI: 非画像ファイル:', file.type);
                showNotification('画像ファイルのみアップロード可能です', 'error');
                continue;
            }

            try {
                const imageData = await fileToDataUrl(file);
                this.selectedImageMap.set(file.name, { file, dataUrl: imageData });
            } catch (error) {
                console.error('UI: 画像データ変換エラー:', error);
                showNotification(`${file.name}の読み込みに失敗しました`, 'error');
            }
        }

        this.updatePreview();
        showNotification(`${this.selectedImageMap.size}個のファイルが選択されました`, 'info');
    }

    /**
     * プレビューを更新する
     */
    updatePreview() {
        console.log('UI: プレビュー更新');
        this.imagesGrid.innerHTML = '';

        for (const [fileName, { dataUrl }] of this.selectedImageMap) {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';

            const img = document.createElement('img');
            img.src = dataUrl;
            img.alt = fileName;

            const info = document.createElement('div');
            info.className = 'image-info';
            info.textContent = fileName;

            const removeButton = document.createElement('button');
            removeButton.className = 'remove-button';
            removeButton.innerHTML = '×';
            removeButton.onclick = () => {
                this.selectedImageMap.delete(fileName);
                this.updatePreview();
                showNotification(`${fileName}を削除しました`, 'info');
            };

            imageItem.appendChild(img);
            imageItem.appendChild(info);
            imageItem.appendChild(removeButton);
            this.imagesGrid.appendChild(imageItem);
        }
    }

    /**
     * 選択されたファイルを処理する
     */
    async processSelectedFiles() {
        console.log('UI: 選択ファイル処理開始');

        if (!geminiApi.apiKey) {
            console.warn('UI: API Keyが未設定');
            showNotification('API Keyを入力してください', 'error');
            return;
        }

        if (this.selectedImageMap.size === 0) {
            console.warn('UI: ファイルが未選択');
            showNotification('ファイルを選択してください', 'error');
            return;
        }

        showNotification('画像の解析を開始します...', 'info');

        for (const [fileName, { dataUrl }] of this.selectedImageMap) {
            try {
                console.log('UI: 画像解析開始:', fileName);
                const result = await geminiApi.analyzeImage(dataUrl);
                console.log('UI: 画像解析完了:', result);

                this.displayResult(result);
                showNotification(`${fileName}の解析が完了しました`, 'success');
            } catch (error) {
                console.error('UI: 画像処理エラー:', error);
                showNotification(`${fileName}の解析に失敗しました: ${error.message}`, 'error');
            }
        }

        console.log('UI: 全ファイルの処理完了');
    }

    /**
     * Excel用のデータをクリップボードにコピーする
     */
    copyForExcel() {
        console.log('UI: Excel用コピー開始');
        if (!this.lastResult) {
            console.warn('UI: コピーする解析結果がありません');
            showNotification('コピーする解析結果がありません', 'error');
            return;
        }

        try {
            // カテゴリーの判定結果を「該当する」に変換
            const medicalCategories = {
                medical_exam: this.lastResult.category.medical_exam ? '該当する' : '',
                medicine: this.lastResult.category.medicine ? '該当する' : '',
                nursing_care: this.lastResult.category.nursing_care ? '該当する' : '',
                others: this.lastResult.category.others ? '該当する' : ''
            };

            // タブ区切りのテキストを作成
            const excelText = [
                this.lastResult.recipient,
                this.lastResult.facility,
                medicalCategories.medical_exam,
                medicalCategories.medicine,
                medicalCategories.nursing_care,
                medicalCategories.others,
                this.lastResult.amount,
                '',  // 補填される金額（空欄）
                this.lastResult.date || ''  // 日付（ない場合は空欄）
            ].join('\t');

            // クリップボードにコピー
            navigator.clipboard.writeText(excelText);
            console.log('UI: Excel用コピー成功:', excelText);
            showNotification('Excel用データをコピーしました', 'success');
        } catch (error) {
            console.error('UI: Excel用コピーエラー:', error);
            showNotification('Excel用データのコピーに失敗しました', 'error');
        }
    }

    /**
     * 結果を表示する
     * @param {Object} result - 解析結果
     */
    displayResult(result) {
        console.log('UI: 結果表示:', result);
        this.lastResult = result;  // 結果を保存

        // テーブル行を作成
        const tr = document.createElement('tr');

        // 受診者名
        const tdRecipient = document.createElement('td');
        tdRecipient.textContent = result.recipient;
        tr.appendChild(tdRecipient);

        // 医療機関名
        const tdFacility = document.createElement('td');
        tdFacility.textContent = result.facility;
        tr.appendChild(tdFacility);

        // 医療費区分
        const categories = ['medical_exam', 'medicine', 'nursing_care', 'others'];
        categories.forEach(category => {
            const td = document.createElement('td');
            if (result.category[category]) {
                td.textContent = '該当する';
                td.classList.add('check-mark');
            } else {
                td.textContent = '−';
                td.classList.add('empty-mark');
            }
            tr.appendChild(td);
        });

        // 支払金額
        const tdAmount = document.createElement('td');
        tdAmount.textContent = result.amount.toLocaleString();
        tr.appendChild(tdAmount);

        // 補填金額（空欄）
        const tdRefund = document.createElement('td');
        tdRefund.textContent = '−';
        tdRefund.classList.add('empty-mark');
        tr.appendChild(tdRefund);

        // 支払日
        const tdDate = document.createElement('td');
        tdDate.textContent = result.date || '−';
        if (!result.date) {
            tdDate.classList.add('empty-mark');
        }
        tr.appendChild(tdDate);

        // 既存の結果をクリアして新しい行を追加
        const tbody = document.getElementById('result-content');
        tbody.innerHTML = '';
        tbody.appendChild(tr);
    }

    displayResults(results) {
        console.log('UI: 結果の表示開始');
        const resultContent = document.getElementById('result-content');
        resultContent.innerHTML = '';

        results.forEach(data => {
            const row = document.createElement('tr');

            // 氏名
            row.appendChild(this.createCell(data.recipient));

            // 医療機関
            row.appendChild(this.createCell(data.facility));

            // 区分（チェックマーク）
            row.appendChild(this.createCell(data.category.medical_exam ? '✓' : '−', data.category.medical_exam ? 'check-mark' : 'empty-mark'));
            row.appendChild(this.createCell(data.category.medicine ? '✓' : '−', data.category.medicine ? 'check-mark' : 'empty-mark'));
            row.appendChild(this.createCell(data.category.nursing_care ? '✓' : '−', data.category.nursing_care ? 'check-mark' : 'empty-mark'));
            row.appendChild(this.createCell(data.category.others ? '✓' : '−', data.category.others ? 'check-mark' : 'empty-mark'));

            // 支払額
            row.appendChild(this.createCell(this.formatAmount(data.amount), 'amount'));

            // 補填額
            row.appendChild(this.createCell(data.refund ? this.formatAmount(data.refund) : '−', 'amount'));

            // 日付
            row.appendChild(this.createCell(data.date));

            resultContent.appendChild(row);
        });

        document.getElementById('result-section').style.display = 'block';
        console.log('UI: 結果の表示完了');
    }

    createCell(content, className = '') {
        const cell = document.createElement('td');
        cell.textContent = content;
        if (className) {
            cell.className = className;
        }
        return cell;
    }

    formatAmount(amount) {
        return amount.toLocaleString() + '円';
    }
}

// グローバルインスタンスを作成
export const ui = new UI(); 