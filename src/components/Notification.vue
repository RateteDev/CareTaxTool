<template>
  <div class="notification-area" role="alert" aria-live="polite">
    <transition-group name="notification">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification', notification.type]"
        :aria-label="`${notification.type}通知: ${notification.message}`"
      >
        <div class="notification-content">
          <i :class="getNotificationIcon(notification.type)" aria-hidden="true"></i>
          <span>{{ notification.message }}</span>
        </div>
        <button 
          class="close-button" 
          @click="removeNotification(notification.id)"
          :aria-label="'通知を閉じる'"
        >
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { NotificationType } from '../types/MedicalReceipt';

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  timeoutId?: number;
}

const notifications = ref<Notification[]>([]);
let nextId = 0;

const getNotificationIcon = (type: NotificationType): string => {
  const icons = {
    info: 'fas fa-info-circle',
    success: 'fas fa-check-circle',
    warning: 'fas fa-exclamation-triangle',
    error: 'fas fa-times-circle'
  };
  return icons[type];
};

const removeNotification = (id: number) => {
  const notification = notifications.value.find(n => n.id === id);
  if (notification?.timeoutId) {
    window.clearTimeout(notification.timeoutId);
  }
  notifications.value = notifications.value.filter(n => n.id !== id);
};

const addNotification = (message: string, type: NotificationType) => {
  const id = nextId++;
  const timeoutId = window.setTimeout(() => {
    removeNotification(id);
  }, 5000);
  
  notifications.value.push({ id, message, type, timeoutId });
};

const handleNotification = (event: CustomEvent) => {
  const { message, type } = event.detail;
  addNotification(message, type);
};

// 通知イベントのリスナーを設定
onMounted(() => {
  window.addEventListener('notification', handleNotification as EventListener);
});

// クリーンアップ
onBeforeUnmount(() => {
  window.removeEventListener('notification', handleNotification as EventListener);
  // 残っている通知のタイマーをクリア
  notifications.value.forEach(notification => {
    if (notification.timeoutId) {
      window.clearTimeout(notification.timeoutId);
    }
  });
});
</script>

<style scoped>
.notification-area {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
}

.notification {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-radius: 1rem;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
  min-width: 300px;
  max-width: 400px;
  word-break: break-word;
}

.notification-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.notification-content span {
  line-height: 1.4;
  font-size: 0.9rem;
}

.notification i {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.close-button {
  background: none;
  border: none;
  color: inherit;
  padding: 0.25rem;
  cursor: pointer;
  opacity: 0.8;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  margin-left: 0.5rem;
}

.close-button:hover {
  opacity: 1;
  background-color: rgba(255, 255, 255, 0.1);
}

.notification.info {
  background-color: var(--info-color);
}

.notification.success {
  background-color: var(--success-color);
}

.notification.warning {
  background-color: #ff9800;
  color: white;
}

.notification.error {
  background-color: var(--error-color);
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style> 