import { query } from '@/infrastructure/database';
import { logger } from '@/utils/logger';
import { sendToUser, buildRideReminderNotification } from '@/modules/notifications/notifications.service';

/**
 * rideReminderJob
 *
 * Runs every 5 minutes.
 * Finds active rides departing in 55–70 minutes that haven't had a reminder sent yet.
 * Sends push to driver + all confirmed passengers.
 */
export async function rideReminderJob(): Promise<void> {
  try {
    const result = await query<{
      id: string;
      driver_id: string;
      origin_city: string;
      destination_city: string;
      departure_time: Date;
    }>(
      `SELECT id, driver_id, origin_city, destination_city, departure_time
       FROM rides
       WHERE status = 'active'
         AND departure_time BETWEEN NOW() + INTERVAL '55 minutes'
                                AND NOW() + INTERVAL '70 minutes'
         AND reminder_sent_at IS NULL`,
    );

    if (result.rowCount === 0) {
      logger.debug('rideReminderJob: no rides to remind');
      return;
    }

    for (const ride of result.rows) {
      const passengersResult = await query<{ passenger_id: string }>(
        `SELECT passenger_id FROM bookings
         WHERE ride_id = $1 AND status = 'confirmed'`,
        [ride.id],
      );

      const passengerIds = passengersResult.rows.map((b) => b.passenger_id);

      const payload = buildRideReminderNotification(
        ride.origin_city,
        ride.destination_city,
        ride.id,
      );

      await sendToUser(ride.driver_id, payload);

      for (const passengerId of passengerIds) {
        await sendToUser(passengerId, payload);
      }

      await query(
        `UPDATE rides SET reminder_sent_at = NOW() WHERE id = $1`,
        [ride.id],
      );

      logger.info('rideReminderJob: reminder sent', {
        rideId:         ride.id,
        passengerCount: passengerIds.length,
        departureTime:  ride.departure_time,
      });
    }
  } catch (err) {
    logger.error('rideReminderJob: failed', {
      error: (err as Error).message,
    });
  }
}
