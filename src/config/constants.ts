export const INDIA_PHONE_REGEX = /^[6-9]\d{9}$/;
export const INDIA_PHONE_PREFIX = '+91';

export const UserRole = {
  DRIVER: 'driver',
  PASSENGER: 'passenger',
  BOTH: 'both',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const RideStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;
export type RideStatus = (typeof RideStatus)[keyof typeof RideStatus];

export const BookingStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED_BY_PASSENGER: 'cancelled_by_passenger',
  CANCELLED_BY_DRIVER: 'cancelled_by_driver',
  COMPLETED: 'completed',
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const NotifType = {
  BOOKING_REQUEST: 'booking_request',
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_DECLINED: 'booking_declined',
  BOOKING_CANCELLED: 'booking_cancelled',
  RIDE_REMINDER: 'ride_reminder',
  RATING_PROMPT: 'rating_prompt',
  GENERAL: 'general',
} as const;
export type NotifType = (typeof NotifType)[keyof typeof NotifType];
