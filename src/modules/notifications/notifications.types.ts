import { NotifType } from '@/config/constants';

export interface PushNotificationPayload {
  userId: string;
  type: NotifType;
  title: string;
  body: string;
  data?: Record<string, string>;
}
