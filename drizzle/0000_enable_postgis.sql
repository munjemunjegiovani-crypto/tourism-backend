-- PostGIS adds geographic types and functions (ST_DWithin, ST_Distance) used for "nearby" search.
-- Neon supports it; this runs once before the tables are created.
CREATE EXTENSION IF NOT EXISTS postgis;
