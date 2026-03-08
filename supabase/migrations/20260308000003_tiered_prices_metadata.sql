-- Add reported_at and reporter_count to tiered price functions
-- Must drop first because return type changes

DROP FUNCTION IF EXISTS get_tiered_prices_for_stores(uuid[], uuid[]);
DROP FUNCTION IF EXISTS get_tiered_ingredient_prices_for_stores(text[], uuid[]);

CREATE OR REPLACE FUNCTION get_tiered_prices_for_stores(
  p_product_ids uuid[],
  p_store_ids   uuid[]
)
RETURNS TABLE(
  product_id     uuid,
  store_id       uuid,
  price          numeric,
  quantity       numeric,
  unit           text,
  confidence     text,
  reported_at    timestamptz,
  reporter_count int
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH
    reporter_counts AS (
      SELECT product_id, store_id,
             COUNT(*)       AS cnt,
             MAX(reported_at) AS latest_at
      FROM   prices
      GROUP  BY product_id, store_id
    ),

    target_stores AS (
      SELECT id, COALESCE(brand, '') AS brand, city
      FROM   stores
      WHERE  id = ANY(p_store_ids)
    ),

    exact AS (
      SELECT lp.product_id,
             lp.store_id,
             lp.price,
             lp.quantity,
             lp.unit,
             'exact'::text AS confidence,
             lp.reported_at,
             COALESCE(rc.cnt, 1)::int AS reporter_count
      FROM   latest_prices lp
      LEFT JOIN reporter_counts rc
             ON rc.product_id = lp.product_id AND rc.store_id = lp.store_id
      WHERE  lp.product_id = ANY(p_product_ids)
        AND  lp.store_id   = ANY(p_store_ids)
    ),

    missing AS (
      SELECT p_ids.product_id AS p_id,
             ts.id            AS ts_id,
             ts.brand,
             ts.city
      FROM   UNNEST(p_product_ids) AS p_ids(product_id)
      CROSS JOIN target_stores ts
      WHERE  NOT EXISTS (
               SELECT 1 FROM exact e
               WHERE  e.product_id = p_ids.product_id
                 AND  e.store_id   = ts.id
             )
    ),

    brand_city_raw AS (
      SELECT m.p_id,
             m.ts_id,
             lp.unit,
             ROUND(AVG(lp.price)::numeric, 2) AS avg_price,
             AVG(lp.quantity)                  AS avg_qty,
             COUNT(*)                           AS cnt,
             MAX(lp.reported_at)               AS latest_at
      FROM   missing m
      JOIN   stores s  ON  s.brand = m.brand
                       AND s.city  = m.city
                       AND m.brand <> ''
      JOIN   latest_prices lp ON lp.store_id   = s.id
                              AND lp.product_id = m.p_id
      GROUP  BY m.p_id, m.ts_id, lp.unit
    ),

    brand_city AS (
      SELECT DISTINCT ON (p_id, ts_id)
             p_id      AS product_id,
             ts_id     AS store_id,
             avg_price AS price,
             avg_qty   AS quantity,
             unit,
             'brand_city'::text AS confidence,
             latest_at          AS reported_at,
             cnt::int           AS reporter_count
      FROM   brand_city_raw
      ORDER  BY p_id, ts_id, cnt DESC
    ),

    still_missing AS (
      SELECT m.p_id, m.ts_id, m.brand
      FROM   missing m
      WHERE  NOT EXISTS (
               SELECT 1 FROM brand_city bc
               WHERE  bc.product_id = m.p_id
                 AND  bc.store_id   = m.ts_id
             )
    ),

    national_raw AS (
      SELECT sm.p_id,
             sm.ts_id,
             lp.unit,
             ROUND(AVG(lp.price)::numeric, 2) AS avg_price,
             AVG(lp.quantity)                  AS avg_qty,
             COUNT(*)                           AS cnt,
             MAX(lp.reported_at)               AS latest_at
      FROM   still_missing sm
      JOIN   stores s  ON  s.brand = sm.brand AND sm.brand <> ''
      JOIN   latest_prices lp ON lp.store_id   = s.id
                              AND lp.product_id = sm.p_id
      GROUP  BY sm.p_id, sm.ts_id, lp.unit
    ),

    national AS (
      SELECT DISTINCT ON (p_id, ts_id)
             p_id      AS product_id,
             ts_id     AS store_id,
             avg_price AS price,
             avg_qty   AS quantity,
             unit,
             'national'::text AS confidence,
             latest_at        AS reported_at,
             cnt::int         AS reporter_count
      FROM   national_raw
      ORDER  BY p_id, ts_id, cnt DESC
    )

  SELECT product_id, store_id, price, quantity, unit, confidence, reported_at, reporter_count FROM exact
  UNION ALL
  SELECT product_id, store_id, price, quantity, unit, confidence, reported_at, reporter_count FROM brand_city
  UNION ALL
  SELECT product_id, store_id, price, quantity, unit, confidence, reported_at, reporter_count FROM national;
$$;


CREATE OR REPLACE FUNCTION get_tiered_ingredient_prices_for_stores(
  p_ingredient_names text[],
  p_store_ids        uuid[]
)
RETURNS TABLE(
  ingredient_name text,
  store_id        uuid,
  price           numeric,
  quantity        numeric,
  unit            text,
  confidence      text,
  reported_at     timestamptz,
  reporter_count  int
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH
    reporter_counts AS (
      SELECT ingredient_name, store_id,
             COUNT(*)         AS cnt,
             MAX(reported_at) AS latest_at
      FROM   ingredient_prices
      GROUP  BY ingredient_name, store_id
    ),

    target_stores AS (
      SELECT id, city
      FROM   stores
      WHERE  id = ANY(p_store_ids)
    ),

    exact AS (
      SELECT lip.ingredient_name,
             lip.store_id,
             lip.price,
             lip.quantity,
             lip.unit,
             'exact'::text AS confidence,
             lip.reported_at,
             COALESCE(rc.cnt, 1)::int AS reporter_count
      FROM   latest_ingredient_prices lip
      LEFT JOIN reporter_counts rc
             ON rc.ingredient_name = lip.ingredient_name AND rc.store_id = lip.store_id
      WHERE  lip.ingredient_name = ANY(p_ingredient_names)
        AND  lip.store_id        = ANY(p_store_ids)
    ),

    missing AS (
      SELECT n.ingredient_name AS i_name,
             ts.id             AS ts_id,
             ts.city
      FROM   UNNEST(p_ingredient_names) AS n(ingredient_name)
      CROSS JOIN target_stores ts
      WHERE  NOT EXISTS (
               SELECT 1 FROM exact e
               WHERE  e.ingredient_name = n.ingredient_name
                 AND  e.store_id        = ts.id
             )
    ),

    city_raw AS (
      SELECT m.i_name,
             m.ts_id,
             lip.unit,
             ROUND(AVG(lip.price)::numeric, 2) AS avg_price,
             AVG(lip.quantity)                  AS avg_qty,
             COUNT(*)                           AS cnt,
             MAX(lip.reported_at)               AS latest_at
      FROM   missing m
      JOIN   stores s  ON  s.city = m.city
      JOIN   latest_ingredient_prices lip ON lip.store_id        = s.id
                                         AND lip.ingredient_name = m.i_name
      GROUP  BY m.i_name, m.ts_id, lip.unit
    ),

    city_avg AS (
      SELECT DISTINCT ON (i_name, ts_id)
             i_name    AS ingredient_name,
             ts_id     AS store_id,
             avg_price AS price,
             avg_qty   AS quantity,
             unit,
             'brand_city'::text AS confidence,
             latest_at          AS reported_at,
             cnt::int           AS reporter_count
      FROM   city_raw
      ORDER  BY i_name, ts_id, cnt DESC
    ),

    still_missing AS (
      SELECT m.i_name, m.ts_id
      FROM   missing m
      WHERE  NOT EXISTS (
               SELECT 1 FROM city_avg ca
               WHERE  ca.ingredient_name = m.i_name
                 AND  ca.store_id        = m.ts_id
             )
    ),

    national_raw AS (
      SELECT sm.i_name,
             sm.ts_id,
             lip.unit,
             ROUND(AVG(lip.price)::numeric, 2) AS avg_price,
             AVG(lip.quantity)                  AS avg_qty,
             COUNT(*)                           AS cnt,
             MAX(lip.reported_at)               AS latest_at
      FROM   still_missing sm
      JOIN   latest_ingredient_prices lip ON lip.ingredient_name = sm.i_name
      GROUP  BY sm.i_name, sm.ts_id, lip.unit
    ),

    national AS (
      SELECT DISTINCT ON (i_name, ts_id)
             i_name    AS ingredient_name,
             ts_id     AS store_id,
             avg_price AS price,
             avg_qty   AS quantity,
             unit,
             'national'::text AS confidence,
             latest_at        AS reported_at,
             cnt::int         AS reporter_count
      FROM   national_raw
      ORDER  BY i_name, ts_id, cnt DESC
    )

  SELECT ingredient_name, store_id, price, quantity, unit, confidence, reported_at, reporter_count FROM exact
  UNION ALL
  SELECT ingredient_name, store_id, price, quantity, unit, confidence, reported_at, reporter_count FROM city_avg
  UNION ALL
  SELECT ingredient_name, store_id, price, quantity, unit, confidence, reported_at, reporter_count FROM national;
$$;
