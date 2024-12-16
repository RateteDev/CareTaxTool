export const GEMINI_CONFIG = {
  MODEL: {
    NAME: "gemini-1.5-flash",
    VERSION: "0.2.1"
  },

  PROMPT_TEMPLATE: `以下の医療費の領収書画像を解析し、指定されたTypeScript interfaceの形式でJSONを出力してください：

interface MedicalReceipt {
  name: string;           // 患者氏名
  institution: string;    // 医療機関名
  medical: boolean;       // 診察・医療費の有無
  pharmacy: boolean;      // 医薬品購入の有無
  nursing: boolean;       // 介護保険の有無
  other: boolean;        // その他の費用の有無
  payment: number;       // 合計支払額
  refund: number;        // 保険等による補填額
  date: string;          // 日付（YYYY-MM-DD形式）
}

Example Response:
{
  "name": "山田 太郎",
  "institution": "東京クリニック",
  "medical": true,
  "pharmacy": true,
  "nursing": false,
  "other": false,
  "payment": 3800,
  "refund": 0,
  "date": "2024-01-15"
}

注意事項：
1. 数値は計算式ではなく、最終的な数値を直接記載してください
2. カテゴリーの有無はブール値（true/false）で返してください
3. 数値は数値型で返してください（クォートで囲まない）
4. 日付はYYYY-MM-DD形式の文字列で返してください
5. 該当しない項目は、数値の場合は0、文字列の場合は空文字列、ブール値の場合はfalseを設定してください
6. 必ずJSONとして解析可能な形式で返してください
7. 余分な説明は不要です。JSONのみを返してください`
}; 