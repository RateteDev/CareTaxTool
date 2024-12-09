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

        // 送信ボタンクリックイベント
        uploadButton.addEventListener('click', () => {
            console.log('UI: 送信ボタンクリック');
            if (this.selectedFiles.size > 0) {
                console.log('UI: 選択済みファイルの処理開始');
                this.processSelectedFiles();
            } else {
                console.log('UI: 選択済みファイルなし');
                showNotification('処理する画像を選択してください', 'warning');
            }
        });

        // 画像削除イベントの委譲
        imagesGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-image')) {
                const imageContainer = e.target.closest('.image-container');
                if (imageContainer) {
                    const fileId = imageContainer.dataset.fileId;
                    console.log('UI: 画像削除 - FileID:', fileId);
                    this.removeSelectedFile(fileId, imageContainer);
                }
            }
        });

        // モデル名の更新処理
        const modelNameInput = document.getElementById('model-name');
        const updateModelButton = document.getElementById('update-model');

        updateModelButton.addEventListener('click', () => {
            const modelName = modelNameInput.value.trim();
            if (modelName) {
                try {
                    geminiApi.setModelName(modelName);
                    localStorage.setItem('modelName', modelName);
                    showNotification('モデル名を更新しました', 'success');
                } catch (error) {
                    console.error('UI: モデル名更新エラー:', error);
                    showNotification('モデル名の更新に失敗しました', 'error');
                }
            } else {
                showNotification('モデル名を入力してください', 'warning');
            }
        });

        // モデル名のEnterキー対応
        modelNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                updateModelButton.click();
            }
        });

        // 開発者モードの切り替え処理
        document.getElementById('developer-mode-toggle').addEventListener('change', function () {
            const developerModeSection = document.querySelector('.developer-mode');

            if (this.checked) {
                const confirmed = confirm('開発者モードを有効にしますか？\n\n注意：このモードは開発とデバッグ目的のみに使用してください。一般ユーザーは無効のままにすることを推奨します。');
                if (confirmed) {
                    developerModeSection.classList.add('active');
                    document.getElementById('json-copy-button').style.display = 'inline-block';
                    showNotification('開発者モードが有効になりました', 'success');
                } else {
                    this.checked = false;
                }
            } else {
                developerModeSection.classList.remove('active');
                document.getElementById('json-copy-button').style.display = 'none';
                showNotification('開発者モードが無効になりました', 'info');
            }
        });

        // JSONコピーボタンのイベントリスナー
        document.getElementById('json-copy-button').addEventListener('click', function () {
            const resultContent = document.getElementById('result-content');
            if (!resultContent.dataset.jsonData) {
                showNotification('コピーするデータがありません', 'error');
                return;
            }

            navigator.clipboard.writeText(resultContent.dataset.jsonData)
                .then(() => {
                    showNotification('JSONデータをクリップボードにコピーしました', 'success');
                })
                .catch(err => {
                    console.error('クリップボードへのコピーに失敗しました:', err);
                    showNotification('コピーに失敗しました', 'error');
                });
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
        try {
            showNotification('画像の解析を開始します...', 'info');

            // 選択済みファイルを配列に変換
            const files = Array.from(this.selectedFiles.values());
            console.log('UI: 処理対象ファイル数:', files.length);

            // 全ファイルの処理を並列実行
            const processPromises = files.map(async file => {
                const fileId = this.generateFileId(file);
                console.log('UI: ファイル処理開始 - Name:', file.name);

                let dataUrl;
                try {
                    // Base64エンコード
                    dataUrl = await fileToDataUrl(file);

                    // API呼び出し
                    const result = await geminiApi.analyzeImage(dataUrl);
                    console.log('UI: 解析結果:', result);

                    // 処理済みファイルに移動
                    this.processedFiles.set(fileId, {
                        name: file.name,
                        size: file.size,
                        lastModified: file.lastModified,
                        result: result,
                        dataUrl: dataUrl
                    });

                    // プレビュー表示を処理済みに更新
                    this.updatePreviewStatus(fileId, 'processed');

                    showNotification(`「${file.name}」の解析が完了しました`, 'success');
                    return { fileId, result, success: true };
                } catch (error) {
                    console.error('UI: ファイル処理エラー:', error);

                    // エラー情報を保存
                    this.processedFiles.set(fileId, {
                        name: file.name,
                        size: file.size,
                        lastModified: file.lastModified,
                        error: error.message,
                        dataUrl: dataUrl
                    });

                    // プレビュー表示をエラーに更新
                    this.updatePreviewStatus(fileId, 'error');
                    showNotification(`「${file.name}」の処理中にエラーが発生しました: ${error.message}`, 'error');
                    return { fileId, error, success: false };
                }
            });

            // 全ての処理完了を待機
            const results = await Promise.all(processPromises);

            // 成功した結果のみを抽出
            const successfulResults = results
                .filter(r => r.success)
                .map(r => r.result);

            // 選択済みファイルをクリア（プレビューは維持）
            this.selectedFiles.clear();

            // 結果を表示（エラーがなかったもののみ）
            if (successfulResults.length > 0) {
                this.displayResults(successfulResults);
                document.getElementById('result-section').style.display = 'block';
            }

            const totalFiles = files.length;
            const successCount = successfulResults.length;
            const errorCount = totalFiles - successCount;

            console.log('UI: 全ファイルの処理完了', {
                total: totalFiles,
                success: successCount,
                error: errorCount
            });

            // 処理完了の通知
            if (errorCount > 0) {
                showNotification(
                    `処理が完了しました（成功: ${successCount}件, エラー: ${errorCount}件）`,
                    errorCount === totalFiles ? 'error' : 'warning'
                );
            } else {
                showNotification('すべての画像の処理が完了しました', 'success');
            }

        } catch (error) {
            console.error('UI: 処理エラー:', error);
            showNotification('処理中にエラーが発生しました', 'error');
        }
    }

    updatePreviewStatus(fileId, status) {
        console.log('UI: プレビュー状態更新 - FileID:', fileId, 'Status:', status);
        const previewContainer = document.querySelector(`.image-container[data-file-id="${fileId}"]`);
        if (previewContainer) {
            // 既存のステータスクラスを削除
            previewContainer.classList.remove('preview', 'processed', 'error');
            // 新しいステータスクラスを追加
            previewContainer.classList.add(status);

            // 削除ボタンのタイトルを更新
            const deleteButton = previewContainer.querySelector('.delete-image');
            if (deleteButton) {
                const buttonTitle = status === 'processed' ? '処理済み画像を削除' : 'エラー画像を削除';
                deleteButton.title = buttonTitle;
                // クリックイベントを更新
                deleteButton.onclick = () => this.removeFile(fileId, previewContainer);
            }
        } else {
            console.warn('UI: プレビューコンテナが見つかりせん - FileID:', fileId);
        }
    }

    displayResults(results) {
        console.log('UI: 結果表示開始');
        const resultContent = document.getElementById('result-content');
        resultContent.innerHTML = '';  // 既存の結果をクリア

        results.forEach(result => {
            const row = document.createElement('tr');

            // 氏名
            row.appendChild(this.createCell(result.recipient));

            // 医療機関
            row.appendChild(this.createCell(result.facility));

            // 区分（チェックマーク）
            row.appendChild(this.createCell(result.category.medical_exam ? '✓' : '−', result.category.medical_exam ? 'check-mark' : 'empty-mark'));
            row.appendChild(this.createCell(result.category.medicine ? '✓' : '−', result.category.medicine ? 'check-mark' : 'empty-mark'));
            row.appendChild(this.createCell(result.category.nursing_care ? '✓' : '−', result.category.nursing_care ? 'check-mark' : 'empty-mark'));
            row.appendChild(this.createCell(result.category.others ? '✓' : '−', result.category.others ? 'check-mark' : 'empty-mark'));

            // 支払額
            row.appendChild(this.createCell(this.formatAmount(result.amount), 'amount'));

            // 補填額
            row.appendChild(this.createCell(result.refund ? this.formatAmount(result.refund) : '−', 'amount'));

            // 日付
            row.appendChild(this.createCell(result.date));

            resultContent.appendChild(row);
        });

        console.log('UI: 結果表示完了');
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