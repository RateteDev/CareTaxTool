import { geminiApi } from './api.js';
import { copyToClipboard, fileToDataUrl, showNotification } from './utils.js';

export class UI {
    constructor() {
        console.log('UI: 初期化開始');
        this.processedFiles = new Map(); // 処理済みファイルを管理
        this.selectedFiles = new Map(); // 選択済みファイルを管理（fileId -> file）
        this.initializeEventListeners();
        this.updateImagesDisplay(); // 初期表示を設定
        console.log('UI: 初期化完了');
    }

    /**
     * イベントリスナーを初期化する
     */
    initializeEventListeners() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        const uploadButton = document.getElementById('upload-button');
        const imagesGrid = document.getElementById('images-grid');

        // ドラッグ&ドロップイベント
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            this.handleFileSelection(files);
        });

        // ファイル選択イベント
        fileInput.addEventListener('change', (e) => {
            console.log('UI: ファイル選択イベント発生');
            const files = e.target.files;
            if (files && files.length > 0) {
                this.handleFileSelection(files);
            }
            // ファイル選択をリセット（同じファイルを再選択可能に）
            fileInput.value = '';
        });

        // アップロードボタンクリックイベント
        uploadButton.addEventListener('click', () => {
            console.log('UI: アップロードボタンクリック');
            if (this.selectedFiles.size > 0) {
                console.log('UI: 選択済みファイルのアップロード開始');
                this.handleFileUpload(Array.from(this.selectedFiles.values()));
                // アップロード後は選択済みファイルをクリア
                this.selectedFiles.clear();
                // プレビューをクリア
                this.clearPreview();
            } else {
                console.log('UI: 選択済みファイルなし');
                showNotification('ファイルを選択してください', 'warning');
            }
        });

        // 画像削除イベントの委譲
        imagesGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-image')) {
                const imageContainer = e.target.closest('.image-container');
                if (imageContainer) {
                    const fileId = imageContainer.dataset.fileId;
                    console.log('UI: 画像削除 - FileID:', fileId);
                    this.removeFile(fileId, imageContainer);
                }
            }
        });
    }

    /**
     * ファイル選択時の処理
     * @param {File[]} files - 選択されたファイルリスト
     */
    async handleFileSelection(files) {
        console.log('UI: ファイル選択処理開始 - ファイル数:', files.length);
        const duplicateFiles = [];
        const newFiles = [];

        for (const file of Array.from(files)) {
            const fileId = this.generateFileId(file);
            console.log('UI: ファイルチェック - Name:', file.name, 'ID:', fileId);

            // 処理済みまたは選択済みのファイルをチェック
            if (this.processedFiles.has(fileId) || this.selectedFiles.has(fileId)) {
                console.log('UI: 重複ファイル検出 - Name:', file.name);
                duplicateFiles.push(file.name);
            } else {
                console.log('UI: 新規ファイル追加 - Name:', file.name);
                this.selectedFiles.set(fileId, file);
                newFiles.push({ file, fileId });
            }
        }

        // 重複ファイルがある場合は警告を表示
        if (duplicateFiles.length > 0) {
            const message = duplicateFiles.length === 1
                ? `「${duplicateFiles[0]}」は既に選択されているか処理済みです`
                : `${duplicateFiles.length}個のファイルが重複しています`;
            showNotification(message, 'warning');
        }

        // 新規ファイルのプレビューを表示
        if (newFiles.length > 0) {
            await this.showPreview(newFiles);
            // 選択成功の通知
            const message = newFiles.length === 1
                ? `「${newFiles[0].file.name}」を選択しました`
                : `${newFiles.length}個のファイルを選択しました`;
            showNotification(message, 'success');
        }

        // 選択済みファイル数を更新
        console.log('UI: 選択済みファイル数:', this.selectedFiles.size);
    }

    async showPreview(files) {
        console.log('UI: プレビュー表示開始');
        const previewGrid = document.getElementById('images-grid');

        // 画像選択なしのメッセージをクリア
        if (previewGrid.classList.contains('empty')) {
            previewGrid.innerHTML = '';
            previewGrid.classList.remove('empty');
        }

        try {
            for (const { file, fileId } of files) {
                console.log('UI: 画像処理 - Name:', file.name);
                const dataUrl = await fileToDataUrl(file);
                const previewContainer = document.createElement('div');
                previewContainer.className = 'image-container preview';
                previewContainer.dataset.fileId = fileId;

                const img = document.createElement('img');
                img.src = dataUrl;
                img.alt = file.name;

                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-image';
                deleteButton.innerHTML = '×';
                deleteButton.title = '選択解除';
                deleteButton.onclick = () => this.removeSelectedFile(fileId, previewContainer);

                previewContainer.appendChild(img);
                previewContainer.appendChild(deleteButton);
                previewGrid.appendChild(previewContainer);
            }
        } catch (error) {
            console.error('UI: プレビュー表示エラー:', error);
            showNotification('プレビューの表示中にエラーが発生しました', 'error');
        }
    }

    clearPreview() {
        console.log('UI: プレビューをクリア');
        const previewGrid = document.getElementById('images-grid');
        const previews = previewGrid.querySelectorAll('.preview');
        previews.forEach(preview => preview.remove());
        this.updateImagesDisplay();
    }

    updateImagesDisplay() {
        const imagesGrid = document.getElementById('images-grid');
        const totalImages = this.selectedFiles.size + this.processedFiles.size;

        if (totalImages === 0) {
            // 既存の内容をクリア
            imagesGrid.innerHTML = '<div>画像選択なし</div>';
            imagesGrid.classList.add('empty');
        } else {
            imagesGrid.classList.remove('empty');
        }
    }

    removeSelectedFile(fileId, previewContainer) {
        console.log('UI: 選択済みファイルを削除 - FileID:', fileId);
        const file = this.selectedFiles.get(fileId);
        this.selectedFiles.delete(fileId);
        previewContainer.remove();

        this.updateImagesDisplay();

        const message = `「${file.name}」の選択を解除しました`;
        showNotification(message, 'info');
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

        if (this.selectedFiles.size === 0) {
            console.warn('UI: ファイルが未選択');
            showNotification('ファイルを選択してください', 'error');
            return;
        }

        showNotification('画像の解析を開始します...', 'info');

        for (const [fileName, { dataUrl }] of this.selectedFiles) {
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

    handleFileUpload(files) {
        console.log('UI: ファイルアップロード処理開始 - ファイル数:', files.length);
        const newFiles = [];

        // ファイルの処理
        files.forEach(file => {
            const fileId = this.generateFileId(file);
            console.log('UI: ファイル処理 - Name:', file.name);

            this.processedFiles.set(fileId, {
                name: file.name,
                size: file.size,
                lastModified: file.lastModified
            });
            newFiles.push({ file, fileId });
        });

        // ファイルを処理
        if (newFiles.length > 0) {
            this.processFiles(newFiles);
        }
    }

    generateFileId(file) {
        return `${file.name}-${file.size}-${file.lastModified}`;
    }

    async processFiles(files) {
        try {
            console.log('UI: ファイル処理開始 - 件数:', files.length);
            const imagesGrid = document.getElementById('images-grid');

            for (const { file, fileId } of files) {
                console.log('UI: 画像処理 - Name:', file.name);
                const dataUrl = await fileToDataUrl(file);

                const imageContainer = document.createElement('div');
                imageContainer.className = 'image-container';
                imageContainer.dataset.fileId = fileId;

                const img = document.createElement('img');
                img.src = dataUrl;
                img.alt = file.name;

                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-image';
                deleteButton.innerHTML = '×';
                deleteButton.title = '画像を削除';

                imageContainer.appendChild(img);
                imageContainer.appendChild(deleteButton);
                imagesGrid.appendChild(imageContainer);
            }

            document.getElementById('images-section').style.display = 'block';
            showNotification('画像のアップロードが完了しました', 'success');

        } catch (error) {
            console.error('UI: ファイル処理エラー:', error);
            showNotification('ファイルの処理中にエラーが発生しました', 'error');
        }
    }

    removeFile(fileId, imageContainer) {
        console.log('UI: 処理済みファイルを削除 - FileID:', fileId);
        const fileInfo = this.processedFiles.get(fileId);
        this.processedFiles.delete(fileId);
        imageContainer.remove();

        this.updateImagesDisplay();

        const message = `「${fileInfo.name}」を削除しました`;
        showNotification(message, 'info');
    }
}

// グローバルインスタンスを作成
export const ui = new UI(); 