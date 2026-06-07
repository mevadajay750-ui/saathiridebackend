import { query } from '@/infrastructure/database';
import { verifyFirebaseToken } from '@/config/firebase';
import { tokenStore } from '@/infrastructure/tokenStore';
import { signToken, signRefreshToken, verifyToken } from '@/utils/jwt';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';

interface DbUser {
  id: string;
  phone: string;
  name: string | null;
  photo_url: string | null;
  role: 'driver' | 'passenger';
  created_at: Date;
  updated_at: Date;
}

interface FormattedUser {
  id: string;
  phone: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'driver' | 'passenger';
  isActive: boolean;
  createdAt: Date;
}

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: FormattedUser;
  isNewUser: boolean;
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

function formatUser(user: DbUser): FormattedUser {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    avatarUrl: user.photo_url,
    role: user.role,
    isActive: true,
    createdAt: user.created_at,
  };
}

function issueTokens(
  userId: string,
  phone: string,
  role: string,
): { accessToken: string; refreshToken: string } {
  const accessToken = signToken({ userId, phone, role });
  const refreshToken = signRefreshToken({ userId, phone, role, type: 'refresh' });
  tokenStore.set(userId, refreshToken);
  return { accessToken, refreshToken };
}

export async function verifyFirebaseAndUpsertUser(
  firebaseToken: string,
): Promise<AuthResult> {
  let decodedToken: { phone_number?: string; uid: string };
  try {
    decodedToken = await verifyFirebaseToken(firebaseToken);
  } catch (err) {
    logger.warn('Firebase token verification failed', {
      error: (err as Error).message,
    });
    throw ApiError.unauthorized('Invalid or expired Firebase token');
  }

  if (!decodedToken.phone_number) {
    throw ApiError.badRequest('Firebase token does not contain a phone number');
  }

  const phone = normalizePhone(decodedToken.phone_number);
  if (phone.length !== 10) {
    throw ApiError.badRequest(`Invalid phone number format: ${phone}`);
  }

  const upsertSQL = `
    WITH upserted AS (
      INSERT INTO users (phone, firebase_uid, role)
      VALUES ($1, $2, 'passenger')
      ON CONFLICT (phone)
      DO UPDATE SET
        firebase_uid = EXCLUDED.firebase_uid,
        updated_at   = NOW()
      RETURNING
        *,
        (xmax = 0) AS is_new_row
    )
    SELECT * FROM upserted
  `;

  const result = await query<DbUser & { is_new_row: boolean }>(upsertSQL, [
    phone,
    decodedToken.uid,
  ]);

  if (result.rowCount === 0) {
    throw ApiError.internal('User upsert failed');
  }

  const dbUser = result.rows[0];
  const isNewUser = dbUser.is_new_row;

  logger.info('User auth success', {
    userId: dbUser.id,
    phone,
    isNewUser,
  });

  const { accessToken, refreshToken } = issueTokens(
    dbUser.id,
    dbUser.phone,
    dbUser.role,
  );

  return {
    accessToken,
    refreshToken,
    user: formatUser(dbUser),
    isNewUser,
  };
}

export async function refreshAccessToken(
  incomingRefreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  let payload: { userId: string; phone: string; role: string; type?: string };
  try {
    payload = verifyToken(incomingRefreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  if (payload.type !== 'refresh') {
    throw ApiError.unauthorized('Token is not a refresh token');
  }

  const stored = tokenStore.get(payload.userId);
  if (!stored || stored !== incomingRefreshToken) {
    throw ApiError.unauthorized('Refresh token has been revoked');
  }

  const { accessToken, refreshToken } = issueTokens(
    payload.userId,
    payload.phone,
    payload.role,
  );

  logger.info('Token refreshed', { userId: payload.userId });

  return { accessToken, refreshToken };
}

export async function logout(userId: string): Promise<void> {
  tokenStore.delete(userId);
  logger.info('User logged out', { userId });
}
