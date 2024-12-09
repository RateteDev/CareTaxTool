import { geminiApi } from './api.js';
import { copyToClipboard, showError, fileToDataUrl, showNotification } from './utils.js';
import { GEMINI_CONFIG } from './config.js';

class UI {
    constructor() {
        console.log('UI: 初期化開始');
        this.uploadArea = document.getElementById('upload-area');
        this.fileInput = document.getElementById('file-input');
        this.resultContent = document.getElementById('result-content');
        this.copyButton = document.getElementById('copy-button');
        this.apiKeyInput = document.getElementById('api-key');
        this.updateApiKeyButton = document.getElementById('update-api-key');
        this.uploadButton = document.getElementById('upload-button');
        this.selectedFiles = [];

        this.initializeEventListeners();
        console.log('UI: 初期化完了');
    }

    /**
     * イベントリスナーを初期化する
     */
    initializeEventListeners() {
        console.log('UI: イベントリスナーの初期化開始');

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

        this.uploadArea.addEventListener('drop', (e) => {
            console.log('UI: ファイルドロップ');
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            this.selectedFiles = Array.from(e.dataTransfer.files);
            console.log('UI: 選択されたファイル数:', this.selectedFiles.length);
            showNotification(`${this.selectedFiles.length}個のファイルが選択されました`, 'info');
        });

        // ファイル選択イベント
        this.fileInput.addEventListener('change', (e) => {
            console.log('UI: ファイル選択');
            this.selectedFiles = Array.from(e.target.files);
            console.log('UI: 選択されたファイル数:', this.selectedFiles.length);
            showNotification(`${this.selectedFiles.length}個のファイルが選択されました`, 'info');
        });

        // コピーボタンイベント
        this.copyButton.addEventListener('click', () => {
            console.log('UI: コピーボタンクリック');
            try {
                const data = JSON.parse(this.resultContent.textContent);
                copyToClipboard(data);
                console.log('UI: JSONコピー成功');
                showNotification('JSONをクリップボードにコピーしました', 'success');
            } catch (error) {
                console.error('UI: JSONコピーエラー:', error);
                showNotification('JSONのコピーに失敗しました', 'error');
            }
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
                // API Keyをローカルストレージに保存
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
            this.handleFiles(this.selectedFiles);
        });

        console.log('UI: イベントリスナーの初期化完了');
    }

    /**
     * ファイルを処理する
     * @param {FileList} files - アップロードされたファイルリスト
     */
    async handleFiles(files) {
        console.log('UI: ファイル処理開始');
        console.log('UI: 処理対象ファイル数:', files.length);

        if (!geminiApi.apiKey) {
            console.warn('UI: API Keyが未設定');
            showNotification('API Keyを入力してください', 'error');
            return;
        }

        if (!files.length) {
            console.warn('UI: ファイルが未選択');
            showNotification('ファイルを選択してください', 'error');
            return;
        }

        showNotification('画像の解析を開始します...', 'info');

        for (const file of files) {
            console.log('UI: ファイル処理:', file.name);

            if (!file.type.startsWith('image/')) {
                console.warn('UI: 非画像ファイル:', file.type);
                showNotification('画像ファイルのみアップロード可能です', 'error');
                continue;
            }

            try {
                console.log('UI: 画像データ変換開始');
                const imageData = await fileToDataUrl(file);
                console.log('UI: 画像データ変換完了');

                console.log('UI: 画像解析開始');
                const result = await geminiApi.analyzeImage(imageData);
                console.log('UI: 画像解析完了:', result);

                this.displayResult(result);
                showNotification('画像の解析が完了しました', 'success');
            } catch (error) {
                console.error('UI: 画像処理エラー:', error);
                showNotification(error.message, 'error');
            }
        }

        console.log('UI: 全ファイルの処理完了');
        this.selectedFiles = [];
    }

    /**
     * 結果を表示する
     * @param {Object} result - 解析結果
     */
    displayResult(result) {
        console.log('UI: 結果表示:', result);
        this.resultContent.textContent = JSON.stringify(result, null, 2);
    }
}

// グローバルインスタンスを作成
export const ui = new UI(); 