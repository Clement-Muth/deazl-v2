-- Seed test data for price comparator testing.
-- Adds 3 stores to user_stores for all existing profiles,
-- then inserts differentiated ingredient prices per store
-- so the comparator has meaningful data to display.

do $$
declare
  v_lidl      uuid := '59a87889-4dd0-47a9-8fc2-784bc00317c9';
  v_auchan    uuid := 'cf3d1f2d-19fe-4b11-8a72-68c13e3a1d01';
  v_carrefour uuid := 'b9aca078-8c87-4f33-b6b9-647e26f49b88';
  v_user      record;
begin

  -- Ensure the 3 baseline stores exist
  insert into public.stores (id, name, brand, city, created_by)
  values
    (v_lidl,      'Lidl',      'Lidl',      'Paris', null),
    (v_auchan,    'Auchan',    'Auchan',    'Paris', null),
    (v_carrefour, 'Carrefour', 'Carrefour', 'Paris', null)
  on conflict (id) do nothing;

  -- Add all 3 stores to every user's user_stores
  for v_user in select id from public.profiles loop
    insert into public.user_stores (id, user_id, store_id, is_favorite)
    values
      (gen_random_uuid(), v_user.id, v_lidl,      true),
      (gen_random_uuid(), v_user.id, v_auchan,    false),
      (gen_random_uuid(), v_user.id, v_carrefour, false)
    on conflict (user_id, store_id) do nothing;
  end loop;

  -- Insert differentiated prices per store so comparator shows real differences.
  -- We DELETE existing baseline prices (reported_by = null) and replace with
  -- per-store differentiated prices so each store has its own pricing.
  -- Strategy: Lidl cheapest overall, Auchan mid-range, Carrefour slightly pricier.

  -- Clear existing baseline prices for these ingredients to avoid duplicates
  delete from public.ingredient_prices
  where reported_by is null
    and store_id in (v_lidl, v_auchan, v_carrefour)
    and ingredient_name in (
      'lait', 'oeufs', 'beurre', 'farine', 'pates', 'riz',
      'tomate', 'oignon', 'carotte', 'pomme de terre',
      'poulet', 'blanc de poulet', 'steak hache', 'saumon',
      'huile d olive', 'sucre', 'sel', 'pain de mie',
      'fromage rape', 'emmental rape', 'gruyere rape',
      'yaourt nature', 'creme fraiche', 'chocolat noir',
      'cafe', 'the', 'jus d orange', 'eau minerale',
      'jambon', 'lardons', 'saucisses', 'thon',
      'champignon', 'courgette', 'poivron', 'aubergine',
      'banane', 'pomme', 'orange', 'citron',
      'pain', 'baguette'
    );

  -- LIDL — Discount, prix cassés sur les basiques
  insert into public.ingredient_prices (ingredient_name, store_id, price, quantity, unit, reported_by) values
    ('lait',           v_lidl, 0.89, 1,   'l',     null),
    ('oeufs',          v_lidl, 2.49, 12,  'piece', null),
    ('beurre',         v_lidl, 1.89, 250, 'g',     null),
    ('farine',         v_lidl, 0.85, 1,   'kg',    null),
    ('pates',          v_lidl, 0.79, 500, 'g',     null),
    ('riz',            v_lidl, 1.49, 1,   'kg',    null),
    ('tomate',         v_lidl, 1.89, 1,   'kg',    null),
    ('oignon',         v_lidl, 0.99, 1,   'kg',    null),
    ('carotte',        v_lidl, 0.89, 1,   'kg',    null),
    ('pomme de terre', v_lidl, 1.19, 1,   'kg',    null),
    ('poulet',         v_lidl, 4.99, 1,   'kg',    null),
    ('blanc de poulet',v_lidl, 7.99, 1,   'kg',    null),
    ('steak hache',    v_lidl, 5.99, 500, 'g',     null),
    ('saumon',         v_lidl,11.90, 1,   'kg',    null),
    ('huile d olive',  v_lidl, 5.99, 1,   'l',     null),
    ('sucre',          v_lidl, 0.79, 1,   'kg',    null),
    ('sel',            v_lidl, 0.39, 1,   'kg',    null),
    ('pain de mie',    v_lidl, 0.99, 500, 'g',     null),
    ('emmental rape',  v_lidl, 1.89, 200, 'g',     null),
    ('gruyere rape',   v_lidl, 1.89, 200, 'g',     null),
    ('yaourt nature',  v_lidl, 0.19, 1,   'piece', null),
    ('creme fraiche',  v_lidl, 0.79, 20,  'cl',    null),
    ('chocolat noir',  v_lidl, 0.89, 100, 'g',     null),
    ('jambon',         v_lidl, 1.99, 4,   'piece', null),
    ('lardons',        v_lidl, 0.99, 200, 'g',     null),
    ('champignon',     v_lidl, 1.49, 500, 'g',     null),
    ('courgette',      v_lidl, 1.29, 1,   'kg',    null),
    ('poivron',        v_lidl, 2.49, 1,   'kg',    null),
    ('banane',         v_lidl, 1.09, 1,   'kg',    null),
    ('pomme',          v_lidl, 1.79, 1,   'kg',    null),
    ('orange',         v_lidl, 1.49, 1,   'kg',    null),
    ('citron',         v_lidl, 0.49, 1,   'piece', null),
    ('pain',           v_lidl, 0.69, 1,   'piece', null),
    ('baguette',       v_lidl, 0.39, 1,   'piece', null),
    ('cafe',           v_lidl, 3.49, 250, 'g',     null),
    ('jus d orange',   v_lidl, 1.29, 1,   'l',     null),
    ('thon',           v_lidl, 0.89, 1,   'piece', null);

  -- AUCHAN — Milieu de gamme, bonne couverture
  insert into public.ingredient_prices (ingredient_name, store_id, price, quantity, unit, reported_by) values
    ('lait',           v_auchan, 1.05, 1,   'l',     null),
    ('oeufs',          v_auchan, 2.89, 12,  'piece', null),
    ('beurre',         v_auchan, 2.29, 250, 'g',     null),
    ('farine',         v_auchan, 1.09, 1,   'kg',    null),
    ('pates',          v_auchan, 1.09, 500, 'g',     null),
    ('riz',            v_auchan, 1.89, 1,   'kg',    null),
    ('tomate',         v_auchan, 2.29, 1,   'kg',    null),
    ('oignon',         v_auchan, 1.19, 1,   'kg',    null),
    ('carotte',        v_auchan, 1.09, 1,   'kg',    null),
    ('pomme de terre', v_auchan, 1.39, 1,   'kg',    null),
    ('poulet',         v_auchan, 5.99, 1,   'kg',    null),
    ('blanc de poulet',v_auchan, 9.49, 1,   'kg',    null),
    ('steak hache',    v_auchan, 6.99, 500, 'g',     null),
    ('saumon',         v_auchan,14.90, 1,   'kg',    null),
    ('huile d olive',  v_auchan, 7.49, 1,   'l',     null),
    ('sucre',          v_auchan, 0.89, 1,   'kg',    null),
    ('sel',            v_auchan, 0.55, 1,   'kg',    null),
    ('pain de mie',    v_auchan, 1.29, 500, 'g',     null),
    ('emmental rape',  v_auchan, 2.19, 200, 'g',     null),
    ('gruyere rape',   v_auchan, 2.19, 200, 'g',     null),
    ('yaourt nature',  v_auchan, 0.27, 1,   'piece', null),
    ('creme fraiche',  v_auchan, 0.95, 20,  'cl',    null),
    ('chocolat noir',  v_auchan, 1.19, 100, 'g',     null),
    ('jambon',         v_auchan, 2.49, 4,   'piece', null),
    ('lardons',        v_auchan, 1.29, 200, 'g',     null),
    ('champignon',     v_auchan, 1.79, 500, 'g',     null),
    ('courgette',      v_auchan, 1.59, 1,   'kg',    null),
    ('poivron',        v_auchan, 2.99, 1,   'kg',    null),
    ('banane',         v_auchan, 1.29, 1,   'kg',    null),
    ('pomme',          v_auchan, 2.09, 1,   'kg',    null),
    ('orange',         v_auchan, 1.79, 1,   'kg',    null),
    ('citron',         v_auchan, 0.59, 1,   'piece', null),
    ('pain',           v_auchan, 0.89, 1,   'piece', null),
    ('baguette',       v_auchan, 0.49, 1,   'piece', null),
    ('cafe',           v_auchan, 4.29, 250, 'g',     null),
    ('jus d orange',   v_auchan, 1.59, 1,   'l',     null),
    ('thon',           v_auchan, 1.09, 1,   'piece', null),
    ('aubergine',      v_auchan, 1.99, 1,   'kg',    null),
    ('saucisses',      v_auchan, 2.99, 1,   'piece', null),
    ('eau minerale',   v_auchan, 0.29, 1,   'l',     null);

  -- CARREFOUR — Légèrement plus cher, très large gamme
  insert into public.ingredient_prices (ingredient_name, store_id, price, quantity, unit, reported_by) values
    ('lait',           v_carrefour, 1.19, 1,   'l',     null),
    ('oeufs',          v_carrefour, 3.29, 12,  'piece', null),
    ('beurre',         v_carrefour, 2.59, 250, 'g',     null),
    ('farine',         v_carrefour, 1.25, 1,   'kg',    null),
    ('pates',          v_carrefour, 1.39, 500, 'g',     null),
    ('riz',            v_carrefour, 2.19, 1,   'kg',    null),
    ('tomate',         v_carrefour, 2.59, 1,   'kg',    null),
    ('oignon',         v_carrefour, 1.39, 1,   'kg',    null),
    ('carotte',        v_carrefour, 1.29, 1,   'kg',    null),
    ('pomme de terre', v_carrefour, 1.59, 1,   'kg',    null),
    ('poulet',         v_carrefour, 6.49, 1,   'kg',    null),
    ('blanc de poulet',v_carrefour,10.99, 1,   'kg',    null),
    ('steak hache',    v_carrefour, 7.99, 500, 'g',     null),
    ('saumon',         v_carrefour,17.90, 1,   'kg',    null),
    ('huile d olive',  v_carrefour, 8.99, 1,   'l',     null),
    ('sucre',          v_carrefour, 0.99, 1,   'kg',    null),
    ('sel',            v_carrefour, 0.65, 1,   'kg',    null),
    ('pain de mie',    v_carrefour, 1.49, 500, 'g',     null),
    ('emmental rape',  v_carrefour, 2.49, 200, 'g',     null),
    ('gruyere rape',   v_carrefour, 2.49, 200, 'g',     null),
    ('yaourt nature',  v_carrefour, 0.35, 1,   'piece', null),
    ('creme fraiche',  v_carrefour, 1.15, 20,  'cl',    null),
    ('chocolat noir',  v_carrefour, 1.49, 100, 'g',     null),
    ('jambon',         v_carrefour, 2.99, 4,   'piece', null),
    ('lardons',        v_carrefour, 1.59, 200, 'g',     null),
    ('champignon',     v_carrefour, 2.09, 500, 'g',     null),
    ('courgette',      v_carrefour, 1.89, 1,   'kg',    null),
    ('poivron',        v_carrefour, 3.49, 1,   'kg',    null),
    ('aubergine',      v_carrefour, 2.29, 1,   'kg',    null),
    ('banane',         v_carrefour, 1.49, 1,   'kg',    null),
    ('pomme',          v_carrefour, 2.39, 1,   'kg',    null),
    ('orange',         v_carrefour, 1.99, 1,   'kg',    null),
    ('citron',         v_carrefour, 0.69, 1,   'piece', null),
    ('pain',           v_carrefour, 1.09, 1,   'piece', null),
    ('baguette',       v_carrefour, 0.59, 1,   'piece', null),
    ('cafe',           v_carrefour, 4.99, 250, 'g',     null),
    ('jus d orange',   v_carrefour, 1.89, 1,   'l',     null),
    ('thon',           v_carrefour, 1.29, 1,   'piece', null),
    ('saucisses',      v_carrefour, 3.49, 1,   'piece', null),
    ('eau minerale',   v_carrefour, 0.39, 1,   'l',     null);

end $$;
