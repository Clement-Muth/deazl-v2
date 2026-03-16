-- Baseline French market prices for common cooking ingredients.
-- These are stored in ingredient_prices (by normalized name, not by product)
-- so they serve as a national fallback for all users via the tiered RPC.
-- Prices are averages from major French supermarkets (2025).
-- reported_by = null marks them as community/baseline prices.

do $$
declare
  v_store_id uuid;
  v_store_ids uuid[] := array[
    '59a87889-4dd0-47a9-8fc2-784bc00317c9'::uuid,  -- Lidl
    'cf3d1f2d-19fe-4b11-8a72-68c13e3a1d01'::uuid,  -- Auchan
    'b9aca078-8c87-4f33-b6b9-647e26f49b88'::uuid   -- Carrefour
  ];
begin
  insert into public.stores (id, name, brand, created_by)
  values
    ('59a87889-4dd0-47a9-8fc2-784bc00317c9'::uuid, 'Lidl',      'Lidl',      null),
    ('cf3d1f2d-19fe-4b11-8a72-68c13e3a1d01'::uuid, 'Auchan',    'Auchan',    null),
    ('b9aca078-8c87-4f33-b6b9-647e26f49b88'::uuid, 'Carrefour', 'Carrefour', null)
  on conflict (id) do nothing;

  foreach v_store_id in array v_store_ids loop
    insert into public.ingredient_prices
      (ingredient_name, store_id, price, quantity, unit, reported_by)
    values
      -- Produits laitiers
      ('lait',                  v_store_id, 1.15, 1,   'l',      null),
      ('lait demi-ecreme',      v_store_id, 1.15, 1,   'l',      null),
      ('lait entier',           v_store_id, 1.25, 1,   'l',      null),
      ('creme fraiche',         v_store_id, 0.95, 20,  'cl',     null),
      ('creme liquide',         v_store_id, 1.30, 20,  'cl',     null),
      ('beurre',                v_store_id, 2.50, 250, 'g',      null),
      ('gruyere rape',          v_store_id, 2.50, 200, 'g',      null),
      ('emmental rape',         v_store_id, 2.20, 200, 'g',      null),
      ('parmesan',              v_store_id, 3.50, 100, 'g',      null),
      ('mozzarella',            v_store_id, 2.00, 125, 'g',      null),
      ('yaourt nature',         v_store_id, 0.30, 1,   'piece',  null),

      -- Oeufs
      ('oeufs',                 v_store_id, 3.20, 12,  'piece',  null),
      ('oeuf',                  v_store_id, 3.20, 12,  'piece',  null),
      ('jaunes d oeuf',         v_store_id, 3.20, 12,  'piece',  null),
      ('jaune d oeuf',          v_store_id, 3.20, 12,  'piece',  null),
      ('blancs d oeuf',         v_store_id, 3.20, 12,  'piece',  null),

      -- Féculents & farines
      ('farine',                v_store_id, 1.20, 1,   'kg',     null),
      ('farine t55',            v_store_id, 1.20, 1,   'kg',     null),
      ('farine de ble',         v_store_id, 1.20, 1,   'kg',     null),
      ('pates',                 v_store_id, 1.50, 500, 'g',      null),
      ('spaghetti',             v_store_id, 1.50, 500, 'g',      null),
      ('penne',                 v_store_id, 1.50, 500, 'g',      null),
      ('riz',                   v_store_id, 2.00, 1,   'kg',     null),
      ('riz basmati',           v_store_id, 2.50, 1,   'kg',     null),
      ('maizena',               v_store_id, 1.50, 250, 'g',      null),
      ('fecule de mais',        v_store_id, 1.50, 250, 'g',      null),
      ('chapelure',             v_store_id, 1.20, 500, 'g',      null),
      ('lasagnes',              v_store_id, 1.80, 500, 'g',      null),
      ('lentilles',             v_store_id, 1.50, 500, 'g',      null),
      ('pois chiches',          v_store_id, 0.90, 1,   'piece',  null), -- boite 400g

      -- Sucres & condiments doux
      ('sucre',                 v_store_id, 0.90, 1,   'kg',     null),
      ('sucre roux',            v_store_id, 1.20, 1,   'kg',     null),
      ('sucre brun',            v_store_id, 1.20, 1,   'kg',     null),
      ('miel',                  v_store_id, 5.00, 250, 'g',      null),
      ('confiture',             v_store_id, 2.50, 370, 'g',      null),

      -- Huiles & corps gras
      ('huile d olive',         v_store_id, 8.00, 1,   'l',      null),
      ('huile de tournesol',    v_store_id, 2.50, 1,   'l',      null),
      ('huile de sesame',       v_store_id, 4.50, 250, 'ml',     null),

      -- Sel, épices & aromates secs
      ('sel',                   v_store_id, 0.60, 1,   'kg',     null),
      ('poivre',                v_store_id, 2.50, 50,  'g',      null),
      ('cumin',                 v_store_id, 1.80, 40,  'g',      null),
      ('paprika',               v_store_id, 1.80, 40,  'g',      null),
      ('curcuma',               v_store_id, 2.00, 40,  'g',      null),
      ('cannelle',              v_store_id, 1.80, 35,  'g',      null),
      ('gingembre en poudre',   v_store_id, 2.00, 35,  'g',      null),
      ('curry',                 v_store_id, 1.80, 40,  'g',      null),
      ('herbes de provence',    v_store_id, 1.60, 20,  'g',      null),
      ('thym',                  v_store_id, 1.20, 15,  'g',      null),
      ('laurier',               v_store_id, 1.20, 10,  'g',      null),
      ('coriandre moulue',      v_store_id, 1.80, 25,  'g',      null),
      ('levure',                v_store_id, 0.90, 11,  'g',      null),
      ('levure chimique',       v_store_id, 0.90, 11,  'g',      null),

      -- Légumes frais
      ('oignon',                v_store_id, 1.20, 1,   'kg',     null),
      ('oignons',               v_store_id, 1.20, 1,   'kg',     null),
      ('ail',                   v_store_id, 2.50, 1,   'piece',  null),
      ('echalote',              v_store_id, 2.00, 500, 'g',      null),
      ('echalotes',             v_store_id, 2.00, 500, 'g',      null),
      ('carotte',               v_store_id, 1.20, 1,   'kg',     null),
      ('carottes',              v_store_id, 1.20, 1,   'kg',     null),
      ('tomate',                v_store_id, 2.50, 1,   'kg',     null),
      ('tomates',               v_store_id, 2.50, 1,   'kg',     null),
      ('courgette',             v_store_id, 2.00, 1,   'kg',     null),
      ('poivron',               v_store_id, 1.50, 1,   'piece',  null),
      ('poireaux',              v_store_id, 2.20, 1,   'kg',     null),
      ('epinards',              v_store_id, 2.80, 500, 'g',      null),
      ('champignons',           v_store_id, 2.50, 500, 'g',      null),
      ('champignons de paris',  v_store_id, 2.50, 500, 'g',      null),
      ('pomme de terre',        v_store_id, 1.50, 1,   'kg',     null),
      ('pommes de terre',       v_store_id, 1.50, 1,   'kg',     null),
      ('patate douce',          v_store_id, 2.20, 1,   'kg',     null),
      ('brocoli',               v_store_id, 1.80, 1,   'piece',  null),
      ('chou-fleur',            v_store_id, 2.00, 1,   'piece',  null),
      ('laitue',                v_store_id, 1.20, 1,   'piece',  null),
      ('salade',                v_store_id, 1.20, 1,   'piece',  null),

      -- Fruits frais
      ('citron',                v_store_id, 0.60, 1,   'piece',  null),
      ('orange',                v_store_id, 0.70, 1,   'piece',  null),
      ('pomme',                 v_store_id, 0.40, 1,   'piece',  null),
      ('banane',                v_store_id, 0.30, 1,   'piece',  null),
      ('avocat',                v_store_id, 1.20, 1,   'piece',  null),

      -- Viandes & poissons
      ('poulet',                v_store_id, 6.00, 1,   'kg',     null),
      ('poulet entier',         v_store_id, 8.00, 1,   'piece',  null),
      ('blanc de poulet',       v_store_id, 10.00, 1,  'kg',     null),
      ('boeuf hache',           v_store_id, 9.00, 1,   'kg',     null),
      ('saumon frais',          v_store_id, 15.00, 1,  'kg',     null),
      ('saumon fume',           v_store_id, 5.00, 100, 'g',      null),
      ('thon en boite',         v_store_id, 1.50, 1,   'piece',  null),
      ('lardons',               v_store_id, 2.20, 200, 'g',      null),
      ('jambon',                v_store_id, 2.50, 200, 'g',      null),

      -- Conserves & sauces
      ('tomates concassees',    v_store_id, 0.90, 400, 'g',      null),
      ('tomates en boite',      v_store_id, 0.90, 400, 'g',      null),
      ('concentre de tomates',  v_store_id, 0.80, 140, 'g',      null),
      ('sauce tomate',          v_store_id, 1.20, 500, 'g',      null),
      ('sauce soja',            v_store_id, 2.50, 150, 'ml',     null),
      ('bouillon cube',         v_store_id, 0.30, 1,   'piece',  null),
      ('lait de coco',          v_store_id, 1.80, 400, 'ml',     null),

      -- Divers
      ('levure de boulanger',   v_store_id, 0.50, 1,   'piece',  null),
      ('bicarbonate',           v_store_id, 1.00, 200, 'g',      null),
      ('vanille',               v_store_id, 2.50, 1,   'piece',  null),
      ('chocolat noir',         v_store_id, 2.00, 100, 'g',      null),
      ('cacao',                 v_store_id, 3.00, 250, 'g',      null),
      ('tahini',                v_store_id, 4.50, 250, 'g',      null),
      ('vinaigre',              v_store_id, 0.80, 1,   'l',      null),
      ('vinaigre balsamique',   v_store_id, 2.50, 250, 'ml',     null),
      ('moutarde',              v_store_id, 1.80, 200, 'g',      null),
      ('persil',                v_store_id, 0.70, 1,   'piece',  null),
      ('coriandre',             v_store_id, 0.70, 1,   'piece',  null),
      ('basilic',               v_store_id, 0.90, 1,   'piece',  null),
      ('menthe',                v_store_id, 0.90, 1,   'piece',  null)
    on conflict do nothing;
  end loop;
end;
$$;
