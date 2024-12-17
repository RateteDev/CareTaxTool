import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_CONFIG } from '../config/gemini_config';
import { MedicalReceipt } from '../types/MedicalReceipt';
import { RECEIPT_CONSTANTS } from '../constants/receipt';

class GeminiAPI {
  private api: GoogleGenerativeAI | null = null;
  private modelName: string = 'gemini-1.5-flash';
  private receiptCounter: number = 0;

  private generateReceiptId(): string {
    this.receiptCounter++;
    return String(this.receiptCounter).padStart(RECEIPT_CONSTANTS.ID.PAD_LENGTH, '0');
  }

  setApiKey(apiKey: string) {
    console.log('GeminiAPI: API Keyを設定します');
    this.api = new GoogleGenerativeAI(apiKey);
  }

  setModelName(modelName: string) {
    if (modelName && modelName.trim()) {
      console.log('GeminiAPI: モデル名を設定します:', modelName);
      this.modelName = modelName.trim();
    }
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
      const result = await model.generateContent([GEMINI_CONFIG.IMAGE_ANALYSIS_PROMPT, image]);
      const response = await result.response;
      const text = response.text();
      
      console.log('GeminiAPI: 受信したレスポンス:', text);

      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('レスポンスにJSONが含まれていません');
        }

        const jsonStr = jsonMatch[0];
        console.log('GeminiAPI: 抽出したJSON:', jsonStr);
        
        const parsed = JSON.parse(jsonStr);
        
        // 型の正規化とIDの付与
        const normalized: MedicalReceipt = {
          id: this.generateReceiptId(),
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

  async formatData(data: MedicalReceipt[]): Promise<{ results: MedicalReceipt[], explanation: string }> {
    console.log('GeminiAPI: データの整形を開始します');
    
    if (!this.api) {
      console.error('GeminiAPI: API Keyが設定されていません');
      throw new Error('API Keyが設定されていません');
    }

    try {
      const model = this.api.getGenerativeModel({ model: this.modelName });
      
      const prompt = GEMINI_CONFIG.DATA_FORMAT_PROMPT + '\n\n入力データ:\n' + JSON.stringify(data, null, 2);
      console.log('GeminiAPI: 送信するプロンプト:', prompt);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log('GeminiAPI: 受信したレスポンス:', text);

      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('レスポンスにJSONの配列が含まれていません');
        }

        const jsonStr = jsonMatch[0];
        console.log('GeminiAPI: 抽出したJSON:', jsonStr);
        
        const parsed = JSON.parse(jsonStr);
        
        if (!Array.isArray(parsed)) {
          throw new Error('パースされたJSONが配列ではありません');
        }
        
        // 型の正規化（IDは保持）
        const normalizedResults = parsed.map((item: any, index: number): MedicalReceipt => ({
          id: data[index]?.id || this.generateReceiptId(),
          name: String(item.name || ''),
          institution: String(item.institution || ''),
          medical: Boolean(item.medical),
          pharmacy: Boolean(item.pharmacy),
          nursing: Boolean(item.nursing),
          other: Boolean(item.other),
          payment: Number(item.payment || 0),
          refund: Number(item.refund || 0),
          date: String(item.date || '')
        }));

        // 説明文を抽出（JSONの後の部分）
        const explanation = text.slice(jsonMatch.index! + jsonMatch[0].length).trim();
        console.log('GeminiAPI: 抽出した説明文:', explanation);

        return {
          results: normalizedResults,
          explanation
        };
      } catch (e) {
        console.error('GeminiAPI: JSONパースエラー:', e);
        console.error('GeminiAPI: パース失敗したテキスト:', text);
        throw new Error('APIからの応答を解析できませんでした');
      }
    } catch (error) {
      console.error('GeminiAPI: 整形エラー:', error);
      throw new Error('データの整形に失敗しました: ' + (error as Error).message);
    }
  }
}

export const geminiApi = new GeminiAPI(); 