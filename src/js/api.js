import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiAPI {
    constructor() {
        console.log('GeminiAPI: 初期化開始');
        this.apiKey = null;
        this.genAI = null;
        this.model = null;
        this.systemPrompt = null;
        this.jsonSchema = `
医療費領収書データは以下のJSONスキーマに従って出力してください：

{
    "recipient": string,      // 受診者の名前
    "facility": string,      // 医療機関または薬局の名称
    "category": {
        "medical_exam": boolean,  // 診察・医療
        "medicine": boolean,      // 医薬品購入
        "nursing_care": boolean,  // 介護保険サービス
        "others": boolean         // その他の医療費
    },
    "amount": number,        // 支払金額
    "date": string,         // 領収書の日付（YYYY-MM-DD形式）
    "notes": string         // 特記事項や補足情報
}

必須項目: recipient, facility, category, amount
`;
        console.log('GeminiAPI: 初期化完了');
    }

    /**
     * システムプロンプトを読み込む
     * @returns {Promise<void>}
     */
    async loadSystemPrompt() {
        console.log('GeminiAPI: システムプロンプト読み込み開始');
        try {
            const response = await fetch('src/prompts/system_prompt.md');
            if (!response.ok) {
                throw new Error('システムプロンプトの読み込みに失敗しました');
            }
            this.systemPrompt = await response.text();
            console.log('GeminiAPI: システムプロンプト読み込み完了');
        } catch (error) {
            console.error('GeminiAPI: システムプロンプト読み込みエラー:', error);
            throw new Error(`システムプロンプトの読み込みエラー: ${error.message}`);
        }
    }

    /**
     * API Keyを設定する
     * @param {string} key - Gemini API Key
     */
    setApiKey(key) {
        console.log('GeminiAPI: API Key設定開始');
        try {
            this.apiKey = key;
            this.genAI = new GoogleGenerativeAI(this.apiKey);
            this.model = this.genAI.getGenerativeModel({
                model: "gemini-1.5-pro"
            });
            console.log('GeminiAPI: API Key設定完了');
        } catch (error) {
            console.error('GeminiAPI: API Key設定エラー:', error);
            throw error;
        }
    }

    /**
     * Base64データをGenerativePartに変換する
     * @param {string} base64Data - Base64エンコードされた画像データ
     * @param {string} mimeType - MIMEタイプ
     * @returns {Object} - GenerativePart
     */
    base64ToGenerativePart(base64Data, mimeType) {
        console.log('GeminiAPI: GenerativePart変換開始');
        const part = {
            inlineData: {
                data: base64Data.split(',')[1],
                mimeType,
            },
        };
        console.log('GeminiAPI: GenerativePart変換完了');
        return part;
    }

    /**
     * 画像を解析する
     * @param {string} imageData - Base64エンコードされた画像データ
     * @returns {Promise<Object>} - 解析結果
     */
    async analyzeImage(imageData) {
        console.log('GeminiAPI: 画像解析開始');

        if (!this.apiKey) {
            console.error('GeminiAPI: API Keyが未設定');
            throw new Error('API Keyが設定されていません');
        }

        try {
            console.log('GeminiAPI: 画像データ変換');
            const imagePart = this.base64ToGenerativePart(imageData, "image/jpeg");

            console.log('GeminiAPI: API通信開始');
            const prompt = `以下の医療費の領収書画像から情報を抽出してください。
必ず有効なJSONとして解析可能な形式で出力してください。

${this.jsonSchema}`;

            const result = await this.model.generateContent([
                prompt,
                imagePart
            ]);

            console.log('GeminiAPI: API通信完了');
            const response = await result.response.text();
            console.log('GeminiAPI: レスポンス:', response);

            // レスポンスからJSONを抽出
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('有効なJSONが見つかりませんでした');
            }

            const jsonStr = jsonMatch[0];
            console.log('GeminiAPI: 抽出されたJSON:', jsonStr);

            const parsedResponse = JSON.parse(jsonStr);
            console.log('GeminiAPI: 解析完了:', parsedResponse);
            return parsedResponse;
        } catch (error) {
            console.error('GeminiAPI: 画像解析エラー:', error);
            throw new Error(`API通信エラー: ${error.message}`);
        }
    }
}

// グローバルインスタンスを作成してエクスポート
console.log('GeminiAPI: グローバルインスタンス作成');
export const geminiApi = new GeminiAPI(); 