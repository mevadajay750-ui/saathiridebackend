CREATE TABLE IF NOT EXISTS ratings (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id    UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  rater_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ratee_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score      INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment    VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- One rating per rater per ride
  UNIQUE(ride_id, rater_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_ratee_id ON ratings(ratee_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater_id ON ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ride_id  ON ratings(ride_id);
