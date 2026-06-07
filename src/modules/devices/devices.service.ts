import { query } from '@/infrastructure/database';
import { logger } from '@/utils/logger';
import type { RegisterDeviceInput } from './devices.schema';

export async function registerDevice(
  userId: string,
  input: RegisterDeviceInput,
): Promise<void> {
  await query(
    `INSERT INTO devices (user_id, fcm_token, platform)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id)
     DO UPDATE SET
       fcm_token  = EXCLUDED.fcm_token,
       platform   = EXCLUDED.platform,
       updated_at = NOW()`,
    [userId, input.fcm_token, input.platform],
  );

  logger.info('Device registered', { userId, platform: input.platform });
}

export async function removeDevice(userId: string): Promise<void> {
  await query(`DELETE FROM devices WHERE user_id = $1`, [userId]);

  logger.info('Device removed', { userId });
}

export async function getFcmToken(userId: string): Promise<string | null> {
  const result = await query<{ fcm_token: string }>(
    `SELECT fcm_token FROM devices WHERE user_id = $1`,
    [userId],
  );

  return result.rowCount! > 0 ? result.rows[0].fcm_token : null;
}
