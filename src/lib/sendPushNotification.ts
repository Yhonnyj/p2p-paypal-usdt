// src/lib/sendPushNotification.ts
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

export async function sendPushNotification(to: string, title: string, body: string) {
  if (!Expo.isExpoPushToken(to)) {
    console.warn(`❌ Token inválido: ${to}`);
    return;
  }

  const message = {
    to,
    sound: 'default',
    title,
    body,
    data: {},
  };

  try {
    const tickets = await expo.sendPushNotificationsAsync([message]);
    console.log('✅ Notificación enviada:', tickets);
  } catch (error) {
    console.error('❌ Error enviando notificación:', error);
  }
}
