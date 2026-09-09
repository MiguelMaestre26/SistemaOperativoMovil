import { eventBus } from './EventBus';

export interface SystemNotification {
  id: string;
  appId: string;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  icon?: string;
}

class NotificationService {
  private notifications: SystemNotification[] = [];
  private maxNotifications = 50;

  push(appId: string, title: string, body: string, icon?: string): SystemNotification {
    const notification: SystemNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      appId,
      title,
      body,
      timestamp: Date.now(),
      read: false,
      icon,
    };
    this.notifications.unshift(notification);
    if (this.notifications.length > this.maxNotifications) {
      this.notifications.pop();
    }
    eventBus.emit('notification:new', notification);
    return notification;
  }

  markAsRead(id: string): void {
    const n = this.notifications.find(n => n.id === id);
    if (n) {
      n.read = true;
      eventBus.emit('notification:read', n);
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => (n.read = true));
    eventBus.emit('notification:allRead');
  }

  dismiss(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    eventBus.emit('notification:dismissed', id);
  }

  clearAll(): void {
    this.notifications = [];
    eventBus.emit('notification:cleared');
  }

  getAll(): SystemNotification[] {
    return [...this.notifications];
  }

  getUnread(): SystemNotification[] {
    return this.notifications.filter(n => !n.read);
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }
}

export const notificationService = new NotificationService();
