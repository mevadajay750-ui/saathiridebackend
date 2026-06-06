CREATE TABLE IF NOT EXISTS vehicles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  make         VARCHAR(50) NOT NULL,
  model        VARCHAR(50) NOT NULL,
  color        VARCHAR(30) NOT NULL,
  plate_number VARCHAR(15) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
