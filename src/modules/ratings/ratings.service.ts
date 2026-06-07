import { query } from '@/infrastructure/database';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';
import type { SubmitRatingInput } from './ratings.schema';

// ─── DB Row Types ─────────────────────────────────────────────────────────────

interface DbRating {
  id: string;
  ride_id: string;
  rater_id: string;
  ratee_id: string;
  score: number;
  comment: string | null;
  created_at: Date;
}

interface DbRide {
  id: string;
  driver_id: string;
  status: string;
  departure_time: Date;
}

// ─── Response Types ───────────────────────────────────────────────────────────

interface FormattedRating {
  id: string;
  rideId: string;
  raterId: string;
  rateeId: string;
  score: number;
  comment: string | null;
  createdAt: Date;
  rater?: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRating(
  r: DbRating,
  rater?: { id: string; name: string | null; avatar_url: string | null },
): FormattedRating {
  return {
    id: r.id,
    rideId: r.ride_id,
    raterId: r.rater_id,
    rateeId: r.ratee_id,
    score: r.score,
    comment: r.comment,
    createdAt: r.created_at,
    ...(rater && {
      rater: {
        id: rater.id,
        name: rater.name,
        avatarUrl: rater.avatar_url,
      },
    }),
  };
}

// ─── Service: submitRating ────────────────────────────────────────────────────

export async function submitRating(
  raterId: string,
  input: SubmitRatingInput,
): Promise<FormattedRating> {
  if (raterId === input.ratee_id) {
    throw ApiError.badRequest('You cannot rate yourself');
  }

  const rideResult = await query<DbRide>(
    `SELECT id, driver_id, status, departure_time FROM rides WHERE id = $1`,
    [input.ride_id],
  );

  if (rideResult.rowCount === 0) {
    throw ApiError.notFound('Ride not found');
  }

  const ride = rideResult.rows[0];

  if (new Date(ride.departure_time) > new Date()) {
    throw ApiError.badRequest('You can only rate after the ride has departed');
  }

  const isDriver = ride.driver_id === raterId;

  if (!isDriver) {
    const bookingResult = await query<{ id: string }>(
      `SELECT id FROM bookings
       WHERE ride_id = $1
         AND passenger_id = $2
         AND status IN ('confirmed', 'completed')`,
      [input.ride_id, raterId],
    );

    if (bookingResult.rowCount === 0) {
      throw ApiError.forbidden(
        'You can only rate rides you participated in as a confirmed passenger',
      );
    }
  }

  if (isDriver) {
    const rateeBooking = await query<{ id: string }>(
      `SELECT id FROM bookings
       WHERE ride_id = $1
         AND passenger_id = $2
         AND status IN ('confirmed', 'completed')`,
      [input.ride_id, input.ratee_id],
    );

    if (rateeBooking.rowCount === 0) {
      throw ApiError.badRequest(
        'The person you are rating was not a confirmed passenger on this ride',
      );
    }
  } else {
    if (input.ratee_id !== ride.driver_id) {
      throw ApiError.badRequest(
        'As a passenger, you can only rate the driver of this ride',
      );
    }
  }

  const existingResult = await query<{ id: string }>(
    `SELECT id FROM ratings WHERE ride_id = $1 AND rater_id = $2`,
    [input.ride_id, raterId],
  );

  if (existingResult.rowCount! > 0) {
    throw ApiError.conflict('You have already rated this ride');
  }

  const result = await query<DbRating>(
    `INSERT INTO ratings (ride_id, rater_id, ratee_id, score, comment)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.ride_id, raterId, input.ratee_id, input.score, input.comment ?? null],
  );

  logger.info('Rating submitted', {
    ratingId: result.rows[0].id,
    raterId,
    rateeId: input.ratee_id,
    rideId: input.ride_id,
    score: input.score,
  });

  return formatRating(result.rows[0]);
}

// ─── Service: getUserRatings ──────────────────────────────────────────────────

export async function getUserRatings(userId: string): Promise<{
  ratings: FormattedRating[];
  averageScore: number | null;
  totalCount: number;
}> {
  const userResult = await query<{ id: string }>(
    `SELECT id FROM users WHERE id = $1 AND is_active = true`,
    [userId],
  );

  if (userResult.rowCount === 0) {
    throw ApiError.notFound('User not found');
  }

  const result = await query<
    DbRating & { rater_name: string | null; rater_avatar_url: string | null }
  >(
    `SELECT
       r.*,
       u.name       AS rater_name,
       u.avatar_url AS rater_avatar_url
     FROM ratings r
     JOIN users u ON u.id = r.rater_id
     WHERE r.ratee_id = $1
     ORDER BY r.created_at DESC
     LIMIT 50`,
    [userId],
  );

  const ratings = result.rows.map((row) =>
    formatRating(row, {
      id: row.rater_id,
      name: row.rater_name,
      avatar_url: row.rater_avatar_url,
    }),
  );

  const avgResult = await query<{ avg: string | null; count: string }>(
    `SELECT
       ROUND(AVG(score)::numeric, 2)::text AS avg,
       COUNT(*)::text                      AS count
     FROM ratings
     WHERE ratee_id = $1`,
    [userId],
  );

  const averageScore = avgResult.rows[0].avg
    ? parseFloat(avgResult.rows[0].avg)
    : null;
  const totalCount = parseInt(avgResult.rows[0].count, 10);

  return { ratings, averageScore, totalCount };
}
