CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone        VARCHAR(15) NOT NULL UNIQUE,
  name         VARCHAR(100),
  photo_url    TEXT,
  role         VARCHAR(20) NOT NULL DEFAULT 'passenger'
                 CHECK (role IN ('driver', 'passenger')),
  avg_rating   NUMERIC(3,2) DEFAULT 0,
  total_rides  INTEGER DEFAULT 0,
  is_verified  BOOLEAN DEFAULT FALSE,
  firebase_uid VARCHAR(128) UNIQUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone        ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
