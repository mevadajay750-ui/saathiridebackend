import { getFcmToken } from '@/modules/devices/devices.service';
import { sendPushNotification } from '@/config/firebase';
import { logger } from '@/utils/logger';

// ─── Notification Payloads ────────────────────────────────────────────────────

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

// ─── Core: sendToUser ─────────────────────────────────────────────────────────

/**
 * Send a push notification to a single user.
 * Silently skips if the user has no registered device.
 * Never throws — logs error and continues.
 */
export async function sendToUser(
  userId: string,
  payload: NotificationPayload,
): Promise<void> {
  try {
    const token = await getFcmToken(userId);

    if (!token) {
      logger.debug('No FCM token for user — skipping push', { userId });
      return;
    }

    await sendPushNotification({
      token,
      title: payload.title,
      body: payload.body,
      data: payload.data,
    });

    logger.info('Push notification sent', {
      userId,
      title: payload.title,
    });
  } catch (err) {
    logger.error('Failed to send push notification', {
      userId,
      error: (err as Error).message,
    });
  }
}

// ─── Core: sendToMany ─────────────────────────────────────────────────────────

/**
 * Send the same notification to multiple users concurrently.
 * Uses Promise.allSettled — all users are attempted even if some fail.
 */
export async function sendToMany(
  userIds: string[],
  payload: NotificationPayload,
): Promise<void> {
  if (userIds.length === 0) return;

  await Promise.allSettled(
    userIds.map((userId) => sendToUser(userId, payload)),
  );
}

// ─── Typed Notification Builders ──────────────────────────────────────────────

export function buildBookingRequestedNotification(
  originCity: string,
  destinationCity: string,
  rideId: string,
  bookingId: string,
): NotificationPayload {
  return {
    title: 'New Booking Request 🙋',
    body:  `Someone wants to join your ${originCity} → ${destinationCity} ride`,
    data:  { type: 'BOOKING_REQUESTED', rideId, bookingId },
  };
}

export function buildBookingAcceptedNotification(
  originCity: string,
  destinationCity: string,
  rideId: string,
  bookingId: string,
): NotificationPayload {
  return {
    title: 'Booking Confirmed ✅',
    body:  `Your seat on ${originCity} → ${destinationCity} is confirmed!`,
    data:  { type: 'BOOKING_ACCEPTED', rideId, bookingId },
  };
}

export function buildBookingDeclinedNotification(
  originCity: string,
  destinationCity: string,
  rideId: string,
): NotificationPayload {
  return {
    title: 'Booking Declined',
    body:  `Your request for ${originCity} → ${destinationCity} was not accepted`,
    data:  { type: 'BOOKING_DECLINED', rideId },
  };
}

export function buildBookingCancelledByPassengerNotification(
  passengerName: string | null,
  originCity: string,
  destinationCity: string,
  rideId: string,
): NotificationPayload {
  const name = passengerName ?? 'A passenger';
  return {
    title: 'Booking Cancelled',
    body:  `${name} cancelled their booking on your ${originCity} → ${destinationCity} ride`,
    data:  { type: 'BOOKING_CANCELLED', rideId },
  };
}

export function buildRideCancelledNotification(
  originCity: string,
  destinationCity: string,
  rideId: string,
): NotificationPayload {
  return {
    title: 'Ride Cancelled 😔',
    body:  `Your ${originCity} → ${destinationCity} ride has been cancelled by the driver`,
    data:  { type: 'RIDE_CANCELLED', rideId },
  };
}

export function buildRideReminderNotification(
  originCity: string,
  destinationCity: string,
  rideId: string,
): NotificationPayload {
  return {
    title: 'Ride in 1 Hour ⏰',
    body:  `Your ${originCity} → ${destinationCity} ride departs in about 1 hour`,
    data:  { type: 'RIDE_REMINDER', rideId },
  };
}

export function buildRatingPromptNotification(
  rideId: string,
  rateeId: string,
): NotificationPayload {
  return {
    title: 'How was your ride? ⭐',
    body:  'Take a moment to rate your travel companion',
    data:  { type: 'RATING_PROMPT', rideId, rateeId },
  };
}
