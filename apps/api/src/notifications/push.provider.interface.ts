export interface PushNotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushProvider {
  sendPushNotification(payload: PushNotificationPayload): Promise<void>;
  sendPushNotificationsBatch(
    payloads: PushNotificationPayload[],
  ): Promise<void>;
}
