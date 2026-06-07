import { query } from '@/infrastructure/database';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';
import type { UpdateProfileInput, UpsertVehicleInput } from './users.schema';

interface DbUser {
  id: string;
  phone: string;
  name: string | null;
  avatar_url: string | null;
  role: 'driver' | 'passenger' | 'both';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface DbVehicle {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  plate_number: string;
  total_seats: number;
  created_at: Date;
  updated_at: Date;
}

interface FormattedVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  totalSeats: number;
}

interface FormattedUser {
  id: string;
  phone: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'driver' | 'passenger' | 'both';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  vehicle: FormattedVehicle | null;
}

interface PublicProfile {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'driver' | 'passenger' | 'both';
  vehicle: FormattedVehicle | null;
}

function formatVehicle(v: DbVehicle | null): FormattedVehicle | null {
  if (!v) return null;
  return {
    id: v.id,
    make: v.make,
    model: v.model,
    year: v.year,
    color: v.color,
    plateNumber: v.plate_number,
    totalSeats: v.total_seats,
  };
}

function formatUser(u: DbUser, v: DbVehicle | null = null): FormattedUser {
  return {
    id: u.id,
    phone: u.phone,
    name: u.name,
    avatarUrl: u.avatar_url,
    role: u.role,
    isActive: u.is_active,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
    vehicle: formatVehicle(v),
  };
}

export async function getMe(userId: string): Promise<FormattedUser> {
  const userResult = await query<DbUser>(
    `SELECT * FROM users WHERE id = $1 AND is_active = true`,
    [userId],
  );

  if (userResult.rowCount === 0) {
    throw ApiError.notFound('User not found');
  }

  const vehicleResult = await query<DbVehicle>(
    `SELECT * FROM vehicles WHERE user_id = $1`,
    [userId],
  );

  return formatUser(userResult.rows[0], vehicleResult.rows[0] ?? null);
}

export async function updateMe(
  userId: string,
  input: UpdateProfileInput,
): Promise<FormattedUser> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(input.name);
  }
  if (input.avatar_url !== undefined) {
    fields.push(`avatar_url = $${paramIndex++}`);
    values.push(input.avatar_url);
  }
  if (input.role !== undefined) {
    fields.push(`role = $${paramIndex++}`);
    values.push(input.role);
  }

  fields.push(`updated_at = NOW()`);
  values.push(userId);

  const sql = `
    UPDATE users
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex} AND is_active = true
    RETURNING *
  `;

  const result = await query<DbUser>(sql, values);

  if (result.rowCount === 0) {
    throw ApiError.notFound('User not found');
  }

  logger.info('Profile updated', { userId, fields: Object.keys(input) });

  const vehicleResult = await query<DbVehicle>(
    `SELECT * FROM vehicles WHERE user_id = $1`,
    [userId],
  );

  return formatUser(result.rows[0], vehicleResult.rows[0] ?? null);
}

export async function upsertVehicle(
  userId: string,
  input: UpsertVehicleInput,
): Promise<FormattedVehicle> {
  const userResult = await query<Pick<DbUser, 'id' | 'role'>>(
    `SELECT id, role FROM users WHERE id = $1 AND is_active = true`,
    [userId],
  );

  if (userResult.rowCount === 0) {
    throw ApiError.notFound('User not found');
  }

  if (userResult.rows[0].role === 'passenger') {
    throw ApiError.badRequest(
      'Only drivers can register a vehicle. Update your role to driver or both first.',
    );
  }

  const sql = `
    INSERT INTO vehicles (user_id, make, model, year, color, plate_number, total_seats)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (user_id)
    DO UPDATE SET
      make         = EXCLUDED.make,
      model        = EXCLUDED.model,
      year         = EXCLUDED.year,
      color        = EXCLUDED.color,
      plate_number = EXCLUDED.plate_number,
      total_seats  = EXCLUDED.total_seats,
      updated_at   = NOW()
    RETURNING *
  `;

  const result = await query<DbVehicle>(sql, [
    userId,
    input.make,
    input.model,
    input.year,
    input.color,
    input.plate_number,
    input.total_seats,
  ]);

  logger.info('Vehicle upserted', { userId, plateNumber: input.plate_number });

  return formatVehicle(result.rows[0])!;
}

export async function getUserById(userId: string): Promise<PublicProfile> {
  const userResult = await query<DbUser>(
    `SELECT * FROM users WHERE id = $1 AND is_active = true`,
    [userId],
  );

  if (userResult.rowCount === 0) {
    throw ApiError.notFound('User not found');
  }

  const vehicleResult = await query<DbVehicle>(
    `SELECT * FROM vehicles WHERE user_id = $1`,
    [userId],
  );

  const u = userResult.rows[0];
  const v = vehicleResult.rows[0] ?? null;

  return {
    id: u.id,
    name: u.name,
    avatarUrl: u.avatar_url,
    role: u.role,
    vehicle: formatVehicle(v),
  };
}
