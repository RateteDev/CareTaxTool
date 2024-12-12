import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_CONFIG } from '../config/gemini';
import { MedicalReceipt } from '../types/receipt';

class GeminiAPI {
  private api: GoogleGenerativeAI | null = null;
  private modelName: string = GEMINI_CONFIG.MODEL.NAME;

  setApiKey(apiKey: string) {
    console.log('GeminiAPI: API Keyを設定します');
    this.api = new GoogleGenerativeAI(apiKey);
  }

  setModelName(modelName: string) {
    console.log('GeminiAPI: モデル名を設定します:', modelName);
    this.modelName = modelName;
  }

  async analyzeReceipt(imageData: string): Promise<MedicalReceipt> {
    console.log('GeminiAPI: 領収書の解析を開始します');
    
    if (!this.api) {
      console.error('GeminiAPI: API Keyが設定されていません');
      throw new Error('API Keyが設定されていません');
    }

    try {
      console.log('GeminiAPI: モデルを初期化します:', this.modelName);
      const model = this.api.getGenerativeModel({ model: this.modelName });

      const image = {
        inlineData: {
          data: imageData.split(',')[1],
          mimeType: "image/png"
        }
      };

      console.log('GeminiAPI: 画像解析を実行します');
      const result = await model.generateContent([GEMINI_CONFIG.PROMPT_TEMPLATE, image]);
      const response = await result.response;
      const text = response.text();
      
      console.log('GeminiAPI: 受信したレスポンス:', text);

      try {
        // レスポンスからJSONの部分を抽出
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('レスポンスにJSONが含まれていません');
        }

        const jsonStr = jsonMatch[0];
        console.log('GeminiAPI: 抽出したJSON:', jsonStr);
        
        const parsed = JSON.parse(jsonStr);
        
        // 型の正規化
        const normalized: MedicalReceipt = {
          name: String(parsed.name || ''),
          institution: String(parsed.institution || ''),
          medical: Boolean(parsed.medical),
          pharmacy: Boolean(parsed.pharmacy),
          nursing: Boolean(parsed.nursing),
          other: Boolean(parsed.other),
          payment: Number(parsed.payment || 0),
          refund: Number(parsed.refund || 0),
          date: String(parsed.date || '')
        };

        return normalized;
      } catch (e) {
        console.error('GeminiAPI: JSONパースエラー:', e);
        console.error('GeminiAPI: パース失敗したテキスト:', text);
        throw new Error('APIからの応答を解析できませんでした');
      }
    } catch (error) {
      console.error('GeminiAPI: 解析エラー:', error);
      throw new Error('画像の解析に失敗しました: ' + (error as Error).message);
    }
  }
}

export const geminiApi = new GeminiAPI(); 