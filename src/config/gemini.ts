export const GEMINI_CONFIG = {
  MODEL: {
    NAME: "gemini-1.5-flash",
    VERSION: "0.2.1"
  },

  PROMPT_TEMPLATE: `以下の医療費の領収書画像を解析し、以下の情報を抽出してください：
- 患者氏名
- 医療機関名
- 診察・医療費の有無
- 医薬品購入の有無
- 介護保険の有無
- その他の費用の有無
- 合計支払額
- 保険等による補填額
- 日付

結果は以下のJSONスキーマに従って出力してください：

{
  "name": string,           // 患者氏名
  "institution": string,    // 医療機関名
  "medical": boolean,       // 診察・医療費の有無（true/false）
  "pharmacy": boolean,      // 医薬品購入の有無（true/false）
  "nursing": boolean,       // 介護保険の有無（true/false）
  "other": boolean,        // その他の費用の有無（true/false）
  "payment": number,       // 合計支払額
  "refund": number,        // 保険等による補填額
  "date": string          // 日付（YYYY-MM-DD形式）
}

注意事項：
- カテゴリーの有無はブール値（true/false）で返してください
- 数値は数値型で返してください（クォートで囲まない）
- 日付はYYYY-MM-DD形式の文字列で返してください
- 該当しない項目は、数値の場合は0、文字列の場合は空文字列、ブール値の場合はfalseを設定してください
- 必ずJSONとして解析可能な形式で返してください`
}; 