class UI {
    constructor() {
        this.uploadArea = document.getElementById('upload-area');
        this.fileInput = document.getElementById('file-input');
        this.resultContent = document.getElementById('result-content');
        this.copyButton = document.getElementById('copy-button');
        this.apiKeyInput = document.getElementById('api-key');

        this.initializeEventListeners();
    }

    /**
     * イベントリスナーを初期化する
     */
    initializeEventListeners() {
        // ドラッグ&ドロップイベント
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('drag-over');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('drag-over');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            this.handleFiles(files);
        });

        // ファイル選択イベント
        this.fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // コピーボタンイベント
        this.copyButton.addEventListener('click', () => {
            const data = JSON.parse(this.resultContent.textContent);
            copyToClipboard(data);
            showError('JSONをクリップボードにコピーしました');
        });

        // API Keyイベント
        this.apiKeyInput.addEventListener('change', (e) => {
            geminiApi.setApiKey(e.target.value);
        });
    }

    /**
     * ファイルを処理する
     * @param {FileList} files - アップロードされたファイルリスト
     */
    async handleFiles(files) {
        if (!geminiApi.apiKey) {
            showError('API Keyを入力してください');
            return;
        }

        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                showError('画像ファイルのみアップロード可能です');
                continue;
            }

            try {
                const imageData = await fileToDataUrl(file);
                const result = await geminiApi.analyzeImage(imageData);
                this.displayResult(result);
            } catch (error) {
                showError(error.message);
            }
        }
    }

    /**
     * 結果を表示する
     * @param {Object} result - 解析結果
     */
    displayResult(result) {
        this.resultContent.textContent = JSON.stringify(result, null, 2);
    }
}

// グローバルインスタンスを作成
const ui = new UI(); 