import { query, transaction } from '@/infrastructure/database';
import {
  sendToMany,
  buildRideCancelledNotification,
} from '@/modules/notifications/notifications.service';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/utils/logger';
import type { PostRideInput, SearchRidesQuery } from './rides.schema';

interface DbRide {
  id: string;
  driver_id: string;
  origin_city: string;
  destination_city: string;
  departure_time: Date;
  price_per_seat: string;
  total_seats: number;
  available_seats: number;
  status: 'active' | 'cancelled' | 'completed';
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

interface DbDriver {
  id: string;
  name: string | null;
  avatar_url: string | null;
  role: string;
}

interface DbVehicle {
  make: string;
  model: string;
  year: number;
  color: string;
  plate_number: string;
  total_seats: number;
}

interface DbBookingRow {
  id: string;
  seats: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: Date;
  passenger_id: string;
  passenger_name: string | null;
  passenger_avatar_url: string | null;
}

interface FormattedRide {
  id: string;
  originCity: string;
  destinationCity: string;
  departureTime: Date;
  pricePerSeat: number;
  totalSeats: number;
  availableSeats: number;
  status: 'active' | 'cancelled' | 'completed';
  notes: string | null;
  createdAt: Date;
}

interface RideWithDriver extends FormattedRide {
  driver: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    vehicle: {
      make: string;
      model: string;
      year: number;
      color: string;
      plateNumber: string;
    } | null;
  };
}

interface FormattedBooking {
  id: string;
  seats: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: Date;
  passenger: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

interface RideDetail extends RideWithDriver {
  bookings: FormattedBooking[];
}

function formatRide(r: DbRide): FormattedRide {
  return {
    id: r.id,
    originCity: r.origin_city,
    destinationCity: r.destination_city,
    departureTime: r.departure_time,
    pricePerSeat: parseFloat(r.price_per_seat),
    totalSeats: r.total_seats,
    availableSeats: r.available_seats,
    status: r.status,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

function formatRideWithDriver(
  r: DbRide,
  driver: DbDriver,
  vehicle: DbVehicle | null,
): RideWithDriver {
  return {
    ...formatRide(r),
    driver: {
      id: driver.id,
      name: driver.name,
      avatarUrl: driver.avatar_url,
      vehicle: vehicle
        ? {
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            color: vehicle.color,
            plateNumber: vehicle.plate_number,
          }
        : null,
    },
  };
}

function formatBooking(row: DbBookingRow): FormattedBooking {
  return {
    id: row.id,
    seats: row.seats,
    status: row.status,
    createdAt: row.created_at,
    passenger: {
      id: row.passenger_id,
      name: row.passenger_name,
      avatarUrl: row.passenger_avatar_url,
    },
  };
}

function buildVehicleFromRow(
  row: Partial<DbVehicle>,
): DbVehicle | null {
  if (!row.make) return null;
  return {
    make: row.make,
    model: row.model!,
    year: row.year!,
    color: row.color!,
    plate_number: row.plate_number!,
    total_seats: 0,
  };
}

export async function postRide(
  driverId: string,
  input: PostRideInput,
): Promise<FormattedRide> {
  const userResult = await query<{ role: string }>(
    `SELECT role FROM users WHERE id = $1 AND is_active = true`,
    [driverId],
  );

  if (userResult.rowCount === 0) {
    throw ApiError.notFound('User not found');
  }

  const { role } = userResult.rows[0];
  if (role === 'passenger') {
    throw ApiError.forbidden(
      'Only drivers can post rides. Update your role to driver or both.',
    );
  }

  const vehicleResult = await query<{ id: string }>(
    `SELECT id FROM vehicles WHERE user_id = $1`,
    [driverId],
  );

  if (vehicleResult.rowCount === 0) {
    throw ApiError.badRequest(
      'Please register your vehicle before posting a ride.',
    );
  }

  const departureTime = new Date(input.departure_time);
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);

  if (departureTime < oneHourFromNow) {
    throw ApiError.badRequest(
      'Departure time must be at least 1 hour from now.',
    );
  }

  const sql = `
    INSERT INTO rides (
      driver_id, origin_city, destination_city,
      departure_time, price_per_seat, total_seats, available_seats, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $6, $7)
    RETURNING *
  `;

  const result = await query<DbRide>(sql, [
    driverId,
    input.origin_city,
    input.destination_city,
    departureTime.toISOString(),
    input.price_per_seat,
    input.total_seats,
    input.notes ?? null,
  ]);

  logger.info('Ride posted', {
    rideId: result.rows[0].id,
    driverId,
    route: `${input.origin_city} → ${input.destination_city}`,
    departs: departureTime.toISOString(),
  });

  return formatRide(result.rows[0]);
}

export async function searchRides(
  filters: SearchRidesQuery,
): Promise<RideWithDriver[]> {
  const istDate = new Date(`${filters.date}T00:00:00+05:30`);
  const dayStart = istDate;
  const dayEnd = new Date(istDate.getTime() + 24 * 60 * 60 * 1000);

  const sql = `
    SELECT
      r.*,
      u.id         AS driver_id,
      u.name       AS driver_name,
      u.avatar_url AS driver_avatar_url,
      v.make, v.model, v.year, v.color, v.plate_number
    FROM rides r
    JOIN users    u ON u.id = r.driver_id
    LEFT JOIN vehicles v ON v.user_id = r.driver_id
    WHERE
      r.status           = 'active'
      AND r.departure_time >= NOW()
      AND r.available_seats >= $1
      AND LOWER(r.origin_city)        = LOWER($2)
      AND LOWER(r.destination_city)   = LOWER($3)
      AND r.departure_time >= $4
      AND r.departure_time <  $5
    ORDER BY r.departure_time ASC
    LIMIT 50
  `;

  const result = await query<
    DbRide &
    { driver_name: string | null; driver_avatar_url: string | null } &
    Partial<DbVehicle>
  >(sql, [
    filters.seats,
    filters.origin,
    filters.destination,
    dayStart.toISOString(),
    dayEnd.toISOString(),
  ]);

  return result.rows.map((row) => {
    const driver: DbDriver = {
      id: row.driver_id,
      name: row.driver_name,
      avatar_url: row.driver_avatar_url,
      role: 'driver',
    };
    return formatRideWithDriver(row, driver, buildVehicleFromRow(row));
  });
}

export async function getMyRides(driverId: string): Promise<FormattedRide[]> {
  const result = await query<DbRide>(
    `SELECT * FROM rides
     WHERE driver_id = $1
     ORDER BY departure_time DESC
     LIMIT 50`,
    [driverId],
  );

  return result.rows.map(formatRide);
}

export async function getRideById(rideId: string): Promise<RideDetail> {
  const sql = `
    SELECT
      r.*,
      u.id         AS driver_id,
      u.name       AS driver_name,
      u.avatar_url AS driver_avatar_url,
      v.make, v.model, v.year, v.color, v.plate_number
    FROM rides r
    JOIN users    u ON u.id = r.driver_id
    LEFT JOIN vehicles v ON v.user_id = r.driver_id
    WHERE r.id = $1
  `;

  const result = await query<
    DbRide &
    { driver_name: string | null; driver_avatar_url: string | null } &
    Partial<DbVehicle>
  >(sql, [rideId]);

  if (result.rowCount === 0) {
    throw ApiError.notFound('Ride not found');
  }

  const row = result.rows[0];

  const driver: DbDriver = {
    id: row.driver_id,
    name: row.driver_name,
    avatar_url: row.driver_avatar_url,
    role: 'driver',
  };

  const ride = formatRideWithDriver(row, driver, buildVehicleFromRow(row));

  const bookingsResult = await query<DbBookingRow>(
    `SELECT
       b.id, b.seats, b.status, b.created_at,
       u.id AS passenger_id, u.name AS passenger_name, u.avatar_url AS passenger_avatar_url
     FROM bookings b
     JOIN users u ON u.id = b.passenger_id
     WHERE b.ride_id = $1
     ORDER BY b.created_at ASC`,
    [rideId],
  );

  return {
    ...ride,
    bookings: bookingsResult.rows.map(formatBooking),
  };
}

export async function cancelRide(
  rideId: string,
  driverId: string,
): Promise<void> {
  let passengerIds: string[] = [];
  let originCity = '';
  let destinationCity = '';

  await transaction(async (client) => {
    const rideResult = await client.query<DbRide>(
      `SELECT * FROM rides WHERE id = $1`,
      [rideId],
    );

    if (rideResult.rowCount === 0) {
      throw ApiError.notFound('Ride not found');
    }

    const ride = rideResult.rows[0];

    if (ride.driver_id !== driverId) {
      throw ApiError.forbidden('You can only cancel your own rides');
    }

    if (ride.status !== 'active') {
      throw ApiError.badRequest(
        `Cannot cancel a ride with status '${ride.status}'`,
      );
    }

    const confirmedResult = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count
       FROM bookings
       WHERE ride_id = $1 AND status = 'confirmed'`,
      [rideId],
    );

    const confirmedCount = parseInt(confirmedResult.rows[0].count, 10);
    if (confirmedCount > 0) {
      throw ApiError.badRequest(
        `This ride has ${confirmedCount} confirmed booking(s). ` +
        `Please contact passengers before cancelling.`,
      );
    }

    await client.query(
      `UPDATE rides SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [rideId],
    );

    const cancelledBookings = await client.query<{ passenger_id: string }>(
      `UPDATE bookings
       SET status = 'cancelled', updated_at = NOW()
       WHERE ride_id = $1 AND status = 'pending'
       RETURNING passenger_id`,
      [rideId],
    );

    passengerIds = cancelledBookings.rows.map((b) => b.passenger_id);
    originCity = ride.origin_city;
    destinationCity = ride.destination_city;

    logger.info('Ride cancelled', {
      rideId,
      driverId,
      pendingBookingsCancelled: cancelledBookings.rowCount,
    });
  });

  if (passengerIds.length > 0) {
    sendToMany(
      passengerIds,
      buildRideCancelledNotification(originCity, destinationCity, rideId),
    ).catch(() => {});
  }
}
