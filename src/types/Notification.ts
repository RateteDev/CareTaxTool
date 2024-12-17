export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationMessage {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
} 