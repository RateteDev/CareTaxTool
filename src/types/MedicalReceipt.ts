export interface MedicalReceipt {
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

export type NotificationType = 'info' | 'success' | 'warning' | 'error'; 