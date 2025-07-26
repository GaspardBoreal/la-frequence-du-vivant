
-- Créer une fonction PostgreSQL pour créer des points PostGIS
CREATE OR REPLACE FUNCTION st_point(longitude double precision, latitude double precision)
RETURNS geometry
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ST_Point(longitude, latitude);
$$;
