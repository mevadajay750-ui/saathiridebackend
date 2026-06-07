import { query, transaction } from '@/infrastructure/database';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';
import type { RequestBookingInput } from './bookings.schema';

interface DbBooking {
  id: string;
  ride_id: string;
  passenger_id: string;
  seats: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: Date;
  updated_at: Date;
}

interface DbRide {
  id: string;
  driver_id: string;
  origin_city: string;
  destination_city: string;
  departure_time: Date;
  price_per_seat: string;
  available_seats: number;
  status: 'active' | 'cancelled' | 'completed';
}

interface DbUser {
  id: string;
  name: string | null;
  avatar_url: string | null;
  phone: string;
}

interface FormattedBooking {
  id: string;
  rideId: string;
  seats: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  ride: {
    id: string;
    originCity: string;
    destinationCity: string;
    departureTime: Date;
    pricePerSeat: number;
  };
  passenger?: {
    id: string;
    name: string | null;
    phone: string;
    avatarUrl: string | null;
  };
}

function formatBooking(
  b: DbBooking,
  ride: DbRide,
  passenger?: DbUser,
): FormattedBooking {
  return {
    id:        b.id,
    rideId:    b.ride_id,
    seats:     b.seats,
    status:    b.status,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
    ride: {
      id:               ride.id,
      originCity:       ride.origin_city,
      destinationCity:  ride.destination_city,
      departureTime:    ride.departure_time,
      pricePerSeat:     parseFloat(ride.price_per_seat),
    },
    ...(passenger && {
      passenger: {
        id:        passenger.id,
        name:      passenger.name,
        phone:     passenger.phone,
        avatarUrl: passenger.avatar_url,
      },
    }),
  };
}

export async function requestBooking(
  passengerId: string,
  input: RequestBookingInput,
): Promise<FormattedBooking> {
  return transaction(async (client) => {
    const rideResult = await client.query<DbRide>(
      `SELECT * FROM rides WHERE id = $1 FOR UPDATE`,
      [input.ride_id],
    );

    if (rideResult.rowCount === 0) {
      throw ApiError.notFound('Ride not found');
    }

    const ride = rideResult.rows[0];

    if (ride.driver_id === passengerId) {
      throw ApiError.badRequest('You cannot book your own ride');
    }

    if (ride.status !== 'active') {
      throw ApiError.badRequest(`This ride is ${ride.status} and cannot be booked`);
    }

    if (new Date(ride.departure_time) <= new Date()) {
      throw ApiError.badRequest('This ride has already departed');
    }

    if (ride.available_seats < input.seats) {
      throw ApiError.badRequest(
        `Only ${ride.available_seats} seat(s) available, you requested ${input.seats}`,
      );
    }

    const existingResult = await client.query<{ id: string; status: string }>(
      `SELECT id, status FROM bookings WHERE ride_id = $1 AND passenger_id = $2`,
      [input.ride_id, passengerId],
    );

    if (existingResult.rowCount! > 0) {
      const existing = existingResult.rows[0];
      if (existing.status !== 'cancelled') {
        throw ApiError.conflict('You already have a booking for this ride');
      }
      await client.query(`DELETE FROM bookings WHERE id = $1`, [existing.id]);
    }

    const bookingResult = await client.query<DbBooking>(
      `INSERT INTO bookings (ride_id, passenger_id, seats)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [input.ride_id, passengerId, input.seats],
    );

    const booking = bookingResult.rows[0];

    logger.info('Booking requested', {
      bookingId:   booking.id,
      rideId:      input.ride_id,
      passengerId,
      seats:       input.seats,
    });

    return formatBooking(booking, ride);
  });
}

export async function getMyBookings(passengerId: string): Promise<FormattedBooking[]> {
  const sql = `
    SELECT
      b.*,
      r.id               AS r_id,
      r.origin_city,
      r.destination_city,
      r.departure_time,
      r.price_per_seat,
      r.available_seats,
      r.status           AS r_status,
      r.driver_id
    FROM bookings b
    JOIN rides r ON r.id = b.ride_id
    WHERE b.passenger_id = $1
    ORDER BY b.created_at DESC
    LIMIT 50
  `;

  const result = await query<
    DbBooking & {
      r_id: string;
      origin_city: string;
      destination_city: string;
      departure_time: Date;
      price_per_seat: string;
      available_seats: number;
      r_status: string;
      driver_id: string;
    }
  >(sql, [passengerId]);

  return result.rows.map((row) => {
    const ride: DbRide = {
      id:               row.r_id,
      driver_id:        row.driver_id,
      origin_city:      row.origin_city,
      destination_city: row.destination_city,
      departure_time:   row.departure_time,
      price_per_seat:   row.price_per_seat,
      available_seats:  row.available_seats,
      status:           row.r_status as DbRide['status'],
    };
    return formatBooking(row, ride);
  });
}

export async function getRideBookings(
  rideId: string,
  driverId: string,
): Promise<FormattedBooking[]> {
  const rideResult = await query<DbRide>(
    `SELECT * FROM rides WHERE id = $1`,
    [rideId],
  );

  if (rideResult.rowCount === 0) {
    throw ApiError.notFound('Ride not found');
  }

  if (rideResult.rows[0].driver_id !== driverId) {
    throw ApiError.forbidden('You can only view bookings for your own rides');
  }

  const ride = rideResult.rows[0];

  const sql = `
    SELECT
      b.*,
      u.id         AS u_id,
      u.name       AS u_name,
      u.phone      AS u_phone,
      u.avatar_url AS u_avatar_url
    FROM bookings b
    JOIN users u ON u.id = b.passenger_id
    WHERE b.ride_id = $1
    ORDER BY b.created_at ASC
  `;

  const result = await query<
    DbBooking & {
      u_id: string;
      u_name: string | null;
      u_phone: string;
      u_avatar_url: string | null;
    }
  >(sql, [rideId]);

  return result.rows.map((row) => {
    const passenger: DbUser = {
      id:         row.u_id,
      name:       row.u_name,
      phone:      row.u_phone,
      avatar_url: row.u_avatar_url,
    };
    return formatBooking(row, ride, passenger);
  });
}

export async function acceptBooking(
  bookingId: string,
  driverId: string,
): Promise<FormattedBooking> {
  return transaction(async (client) => {
    const bookingResult = await client.query<DbBooking>(
      `SELECT * FROM bookings WHERE id = $1`,
      [bookingId],
    );

    if (bookingResult.rowCount === 0) {
      throw ApiError.notFound('Booking not found');
    }

    const booking = bookingResult.rows[0];

    if (booking.status !== 'pending') {
      throw ApiError.badRequest(
        `Cannot accept a booking with status '${booking.status}'`,
      );
    }

    const rideResult = await client.query<DbRide>(
      `SELECT * FROM rides WHERE id = $1 FOR UPDATE`,
      [booking.ride_id],
    );

    const ride = rideResult.rows[0];

    if (ride.driver_id !== driverId) {
      throw ApiError.forbidden('You can only accept bookings for your own rides');
    }

    if (ride.status !== 'active') {
      throw ApiError.badRequest('Cannot accept bookings on a non-active ride');
    }

    if (ride.available_seats < booking.seats) {
      throw ApiError.badRequest(
        `Not enough seats available. Only ${ride.available_seats} seat(s) left.`,
      );
    }

    const updatedBooking = await client.query<DbBooking>(
      `UPDATE bookings
       SET status = 'confirmed', updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [bookingId],
    );

    const updatedRide = await client.query<DbRide>(
      `UPDATE rides
       SET available_seats = available_seats - $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [booking.seats, booking.ride_id],
    );

    logger.info('Booking accepted', {
      bookingId,
      rideId:         booking.ride_id,
      driverId,
      seatsConfirmed: booking.seats,
      seatsRemaining: updatedRide.rows[0].available_seats,
    });

    return formatBooking(updatedBooking.rows[0], updatedRide.rows[0]);
  });
}

export async function declineBooking(
  bookingId: string,
  driverId: string,
): Promise<void> {
  await transaction(async (client) => {
    const bookingResult = await client.query<DbBooking>(
      `SELECT * FROM bookings WHERE id = $1`,
      [bookingId],
    );

    if (bookingResult.rowCount === 0) {
      throw ApiError.notFound('Booking not found');
    }

    const booking = bookingResult.rows[0];

    if (booking.status !== 'pending') {
      throw ApiError.badRequest(
        `Cannot decline a booking with status '${booking.status}'`,
      );
    }

    const rideResult = await client.query<{ driver_id: string }>(
      `SELECT driver_id FROM rides WHERE id = $1`,
      [booking.ride_id],
    );

    if (rideResult.rows[0].driver_id !== driverId) {
      throw ApiError.forbidden('You can only decline bookings for your own rides');
    }

    await client.query(
      `UPDATE bookings
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1`,
      [bookingId],
    );

    logger.info('Booking declined', { bookingId, driverId });
  });
}

export async function cancelBooking(
  bookingId: string,
  passengerId: string,
): Promise<void> {
  await transaction(async (client) => {
    const bookingResult = await client.query<DbBooking>(
      `SELECT * FROM bookings WHERE id = $1`,
      [bookingId],
    );

    if (bookingResult.rowCount === 0) {
      throw ApiError.notFound('Booking not found');
    }

    const booking = bookingResult.rows[0];

    if (booking.passenger_id !== passengerId) {
      throw ApiError.forbidden('You can only cancel your own bookings');
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw ApiError.badRequest(
        `Cannot cancel a booking with status '${booking.status}'`,
      );
    }

    await client.query(
      `UPDATE bookings
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1`,
      [bookingId],
    );

    if (booking.status === 'confirmed') {
      await client.query(
        `UPDATE rides
         SET available_seats = available_seats + $1, updated_at = NOW()
         WHERE id = $2`,
        [booking.seats, booking.ride_id],
      );

      logger.info('Confirmed booking cancelled — seats restored', {
        bookingId,
        passengerId,
        seatsRestored: booking.seats,
        rideId:        booking.ride_id,
      });
    } else {
      logger.info('Pending booking cancelled', { bookingId, passengerId });
    }
  });
}
