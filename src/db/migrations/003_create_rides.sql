CREATE TABLE IF NOT EXISTS rides (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  origin_city         VARCHAR(100) NOT NULL,
  origin_landmark     VARCHAR(200),
  destination_city    VARCHAR(100) NOT NULL,
  destination_landmark VARCHAR(200),
  departure_at        TIMESTAMPTZ NOT NULL,
  total_seats         INTEGER NOT NULL CHECK (total_seats BETWEEN 1 AND 4),
  seats_available     INTEGER NOT NULL CHECK (seats_available >= 0),
  price_per_seat      INTEGER NOT NULL CHECK (price_per_seat >= 50),
  notes               TEXT,
  status              VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT seats_not_exceed_total
    CHECK (seats_available <= total_seats)
);

CREATE INDEX IF NOT EXISTS idx_rides_driver_id       ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_departure_at    ON rides(departure_at);
CREATE INDEX IF NOT EXISTS idx_rides_status          ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_origin_dest     ON rides(origin_city, destination_city);
