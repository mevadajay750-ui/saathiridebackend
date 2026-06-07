import { query } from '@/infrastructure/database';
import { logger } from '@/utils/logger';
import { sendToUser, buildRatingPromptNotification } from '@/modules/notifications/notifications.service';

/**
 * ratingPromptJob
 *
 * Runs every 30 minutes.
 * Finds rides that departed 2–4 hours ago and haven't had a rating prompt sent yet.
 */
export async function ratingPromptJob(): Promise<void> {
  try {
    const ridesResult = await query<{
      id: string;
      driver_id: string;
      origin_city: string;
      destination_city: string;
    }>(
      `SELECT id, driver_id, origin_city, destination_city
       FROM rides
       WHERE departure_time BETWEEN NOW() - INTERVAL '4 hours'
                                AND NOW() - INTERVAL '2 hours'
         AND rating_prompt_sent_at IS NULL
         AND status IN ('active', 'completed')`,
    );

    if (ridesResult.rowCount === 0) {
      logger.debug('ratingPromptJob: no rides to prompt');
      return;
    }

    for (const ride of ridesResult.rows) {
      const passengersResult = await query<{ passenger_id: string }>(
        `SELECT passenger_id FROM bookings
         WHERE ride_id = $1
           AND status IN ('confirmed', 'completed')`,
        [ride.id],
      );

      const passengerIds = passengersResult.rows.map((b) => b.passenger_id);

      if (passengerIds.length === 0) {
        await query(
          `UPDATE rides SET rating_prompt_sent_at = NOW() WHERE id = $1`,
          [ride.id],
        );
        continue;
      }

      for (const passengerId of passengerIds) {
        await sendToUser(
          ride.driver_id,
          buildRatingPromptNotification(ride.id, passengerId),
        );
      }

      for (const passengerId of passengerIds) {
        await sendToUser(
          passengerId,
          buildRatingPromptNotification(ride.id, ride.driver_id),
        );
      }

      await query(
        `UPDATE rides SET rating_prompt_sent_at = NOW() WHERE id = $1`,
        [ride.id],
      );

      logger.info('ratingPromptJob: rating prompt sent', {
        rideId:         ride.id,
        passengerCount: passengerIds.length,
      });
    }
  } catch (err) {
    logger.error('ratingPromptJob: failed', {
      error: (err as Error).message,
    });
  }
}
