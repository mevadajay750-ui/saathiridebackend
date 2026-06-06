CREATE TABLE IF NOT EXISTS bookings (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id          UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  passenger_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seats_requested  INTEGER NOT NULL DEFAULT 1
                     CHECK (seats_requested BETWEEN 1 AND 4),
  status           VARCHAR(30) NOT NULL DEFAULT 'pending'
                     CHECK (status IN (
                       'pending',
                       'confirmed',
                       'cancelled_by_passenger',
                       'cancelled_by_driver',
                       'completed'
                     )),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  -- One active booking per passenger per ride
  UNIQUE(ride_id, passenger_id)
);

CREATE INDEX IF NOT EXISTS idx_bookings_ride_id      ON bookings(ride_id);
CREATE INDEX IF NOT EXISTS idx_bookings_passenger_id ON bookings(passenger_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status       ON bookings(status);
