import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_CONFIG } from './config.js';

export class GeminiAPI {
    constructor() {
        console.log('GeminiAPI: 初期化開始');
        this.apiKey = null;
        this.genAI = null;
        this.model = null;
        this.jsonSchema = GEMINI_CONFIG.JSON_SCHEMA;
        console.log('GeminiAPI: 初期化完了');
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
                model: GEMINI_CONFIG.MODEL.NAME
            });
            console.log('GeminiAPI: API Key設定完了');
        } catch (error) {
            console.error('GeminiAPI: API Key設定エラー:', error);
            throw error;
        }
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
            const prompt = `${GEMINI_CONFIG.PROMPTS.ANALYZE_IMAGE}

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