/**
 * Gemini APIの設定
 */
export const GEMINI_CONFIG = {
    // モデル設定
    MODEL: {
        NAME: "gemini-1.5-pro",
        VERSION: "0.2.1"
    },

    // プロンプト設定
    PROMPTS: {
        ANALYZE_IMAGE: `以下の医療費の領収書画像から情報を抽出してください。
必ず有効なJSONとして解析可能な形式で出力してください。`,
    },

    // JSONスキーマ
    JSON_SCHEMA: `
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
`
}; 