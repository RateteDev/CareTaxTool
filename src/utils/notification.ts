type NotificationType = 'info' | 'success' | 'warning' | 'error';

export const showNotification = (message: string, type: NotificationType = 'info') => {
  const event = new CustomEvent('notification', {
    detail: { message, type }
  });
  window.dispatchEvent(event);
}; 