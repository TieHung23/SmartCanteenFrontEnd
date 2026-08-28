export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  referenceType: string;
  referenceId: string;
  actionUrl?: string | null;
  isRead: boolean;
  readAtUtc: string | null;
  createdAtUtc: string;
}

export interface UnreadCount {
  count: number;
}
