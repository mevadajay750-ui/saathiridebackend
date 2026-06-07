import { query } from '@/infrastructure/database';
import { logger } from '@/utils/logger';

/**
 * completeRidesJob
 *
 * Runs every 15 minutes.
 * Finds all 'active' rides whose departure_time has passed
 * and marks them as 'completed'.
 * Also marks all 'confirmed' bookings for those rides as 'completed'.
 */
export async function completeRidesJob(): Promise<void> {
  try {
    const ridesResult = await query<{ id: string }>(
      `UPDATE rides
       SET status = 'completed', updated_at = NOW()
       WHERE status = 'active'
         AND departure_time < NOW()
       RETURNING id`,
    );

    const completedRideIds = ridesResult.rows.map((r) => r.id);

    if (completedRideIds.length === 0) {
      logger.debug('completeRidesJob: no rides to complete');
      return;
    }

    await query(
      `UPDATE bookings
       SET status = 'completed', updated_at = NOW()
       WHERE ride_id = ANY($1::uuid[])
         AND status = 'confirmed'`,
      [completedRideIds],
    );

    logger.info('completeRidesJob: rides completed', {
      count: completedRideIds.length,
      rideIds: completedRideIds,
    });
  } catch (err) {
    logger.error('completeRidesJob: failed', {
      error: (err as Error).message,
    });
  }
}
