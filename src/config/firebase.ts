import * as admin from 'firebase-admin';
import { env } from './env';
import { logger } from '@/utils/logger';

let app: admin.app.App;

export function initFirebase(): void {
  if (admin.apps.length > 0) return;

  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      // Replace escaped newlines from env var
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });

  logger.info('✅ Firebase Admin initialised');
}

/**
 * Verify a Firebase ID token from the mobile app.
 * Returns the decoded token (uid, phone_number, etc.)
 */
export async function verifyFirebaseToken(
  idToken: string,
): Promise<admin.auth.DecodedIdToken> {
  return admin.auth().verifyIdToken(idToken);
}

/**
 * Send a push notification via FCM.
 */
export async function sendPushNotification(params: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<string | null> {
  try {
    const messageId = await admin.messaging().send({
      token: params.token,
      notification: {
        title: params.title,
        body: params.body,
      },
      data: params.data,
      android: {
        priority: 'high',
        notification: {
          channelId: 'saathiride_bookings',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    });
    return messageId;
  } catch (error: any) {
    logger.warn('FCM push failed', {
      error: error.message,
      token: params.token.slice(0, 20),
    });
    return null;
  }
}
