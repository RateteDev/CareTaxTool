class GeminiAPI {
    constructor() {
        this.apiKey = null;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent';
    }

    /**
     * API Keyを設定する
     * @param {string} key - Gemini API Key
     */
    setApiKey(key) {
        this.apiKey = key;
    }

    /**
     * 画像を解析する
     * @param {string} imageData - Base64エンコードされた画像データ
     * @returns {Promise<Object>} - 解析結果
     */
    async analyzeImage(imageData) {
        if (!this.apiKey) {
            throw new Error('API Keyが設定されていません');
        }

        const requestData = {
            contents: [{
                parts: [
                    {
                        text: "この医療費の領収書から以下の情報を抽出してJSONフォーマットで返してください：受診者名、医療機関名、カテゴリ（診察・医療/医薬品購入/介護保険サービス/その他）、支払金額、日付"
                    },
                    {
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: imageData.split(',')[1]
                        }
                    }
                ]
            }]
        };

        try {
            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error('API通信エラー');
            }

            const data = await response.json();
            return this.parseResponse(data);
        } catch (error) {
            throw new Error(`API通信エラー: ${error.message}`);
        }
    }

    /**
     * APIレスポンスをパースする
     * @param {Object} response - APIレスポンス
     * @returns {Object} - パースされたデータ
     */
    parseResponse(response) {
        try {
            const text = response.candidates[0].content.parts[0].text;
            return JSON.parse(text);
        } catch (error) {
            throw new Error('レスポンスの解析に失敗しました');
        }
    }
}

// グローバルインスタンスを作成
const geminiApi = new GeminiAPI(); 