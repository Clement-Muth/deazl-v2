-- Seed : 20 recettes curées batch-cooking Deazl
-- À exécuter sur staging et prod via psql ou supabase db execute

DO $$
DECLARE
  system_user_id UUID := '1ff7d10a-a663-4dfd-922d-ed73f8626af2';
BEGIN

-- Recettes

INSERT INTO recipes (id, user_id, name, description, servings, prep_time_minutes, cook_time_minutes, image_url, is_public, is_curated, fridge_days, freezer_months, batch_cooking_tags, dietary_tags, created_at, updated_at) VALUES
  ('bc000001-0000-0000-0000-000000000001', system_user_id, 'Quiche Lorraine', 'La classique quiche lorraine, facile à préparer en grande quantité et parfaite pour la semaine.', 6, 20, 40, 'https://images.unsplash.com/photo-1607116667981-ff34483db0b4?w=600', true, true, 4, 2, ARRAY['gourmande','proteinee'], ARRAY[]::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000002', system_user_id, 'Poulet rôti au citron', 'Poulet entier mariné citron-herbes, rôti en une fois pour la semaine.', 4, 15, 60, 'https://images.unsplash.com/photo-1598103442097-8b74394b95c3?w=600', true, true, 4, 3, ARRAY['proteinee','gourmande'], ARRAY[]::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000003', system_user_id, 'Curry de lentilles corail', 'Curry végétarien doux et crémeux, se conserve très bien et se réchauffe en 2 min.', 4, 10, 25, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600', true, true, 5, 3, ARRAY['legere','vegetarienne'], ARRAY['vegetarien']::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000004', system_user_id, 'Gratin de pâtes à la bolognese', 'Un gratin généreux préparé à l''avance, parfait pour régaler toute la famille.', 6, 20, 45, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600', true, true, 4, 2, ARRAY['gourmande','proteinee'], ARRAY[]::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000005', system_user_id, 'Soupe de légumes d''hiver', 'Velouté épais de carottes, patates douces et courgettes. Réchauffe en 3 minutes.', 4, 15, 30, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600', true, true, 5, 3, ARRAY['legere','vegetarienne','rapide'], ARRAY['vegetarien','vegan']::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000006', system_user_id, 'Risotto poulet champignons', 'Risotto crémeux facile à réchauffer avec un peu d''eau. Préparé une fois, mangé toute la semaine.', 4, 10, 35, 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600', true, true, 3, 2, ARRAY['gourmande','proteinee'], ARRAY[]::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000007', system_user_id, 'Chili con carne', 'Chili riche en protéines et saveurs. Meilleur le lendemain, idéal pour le batch cooking.', 6, 15, 45, 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600', true, true, 5, 3, ARRAY['proteinee','gourmande'], ARRAY[]::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000008', system_user_id, 'Poulet tikka masala', 'Poulet en sauce tomate épicée douce, le plat préféré des batch cookers.', 4, 15, 30, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600', true, true, 4, 3, ARRAY['proteinee','gourmande'], ARRAY[]::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000009', system_user_id, 'Bowl de quinoa aux légumes rôtis', 'Base quinoa + légumes de saison rôtis. Sauce tahini à part. Frais et équilibré.', 4, 15, 30, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600', true, true, 4, 0, ARRAY['legere','vegetarienne'], ARRAY['vegetarien','vegan']::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000010', system_user_id, 'Saumon en papillote citron-aneth', 'Pavés de saumon en papillote, rapides à préparer en fournée. Léger et savoureux.', 4, 10, 20, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600', true, true, 3, 2, ARRAY['legere','proteinee','rapide'], ARRAY[]::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000011', system_user_id, 'Hachis parmentier', 'La recette comfort food par excellence, se congèle parfaitement en portions.', 6, 20, 40, 'https://images.unsplash.com/photo-1639667870196-0b3bd0a1ae92?w=600', true, true, 4, 3, ARRAY['gourmande','proteinee'], ARRAY[]::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000012', system_user_id, 'Wok de boeuf aux nouilles', 'Sauté de boeuf haché, nouilles et légumes croquants. Rapide à préparer en grande quantité.', 4, 10, 20, 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600', true, true, 3, 2, ARRAY['rapide','proteinee'], ARRAY[]::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000013', system_user_id, 'Minestrone de légumes', 'Soupe italienne épaisse aux légumes et haricots. Nourrissante et saine.', 6, 20, 35, 'https://images.unsplash.com/photo-1588566565463-180a5b3b4661?w=600', true, true, 5, 3, ARRAY['legere','vegetarienne'], ARRAY['vegetarien','vegan']::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000014', system_user_id, 'Curry de pois chiches épinards', 'Curry vegan riche en protéines végétales et fer. Facile et économique.', 4, 10, 25, 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=600', true, true, 5, 3, ARRAY['legere','vegetarienne','proteinee'], ARRAY['vegetarien','vegan']::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000015', system_user_id, 'Lasagnes à la bolognese', 'Les lasagnes maison classiques. Se congèlent en portions individuelles.', 8, 30, 50, 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600', true, true, 4, 3, ARRAY['gourmande','proteinee'], ARRAY[]::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000016', system_user_id, 'Filets de cabillaud citron câpres', 'Poisson blanc en sauce légère, préparé en 20 min. Léger et protéiné.', 4, 10, 15, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600', true, true, 2, 2, ARRAY['legere','proteinee','rapide'], ARRAY[]::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000017', system_user_id, 'Boulettes de viande sauce tomate', 'Boulettes maison cuites dans la sauce. Se réchauffent parfaitement avec des pâtes.', 4, 20, 30, 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600', true, true, 4, 3, ARRAY['gourmande','proteinee'], ARRAY[]::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000018', system_user_id, 'Taboulé libanais', 'Taboulé frais et parfumé. Préparé la veille, il est encore meilleur le lendemain.', 4, 20, 0, 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600', true, true, 3, 0, ARRAY['legere','vegetarienne','rapide'], ARRAY['vegetarien','vegan']::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000019', system_user_id, 'Poulet basquaise', 'Poulet mijoté aux poivrons et tomates. Plus savoureux le lendemain, parfait pour le batch.', 4, 15, 45, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600', true, true, 5, 3, ARRAY['gourmande','proteinee'], ARRAY[]::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000020', system_user_id, 'Salade de pâtes méditerranéenne', 'Pâtes froides, tomates séchées, olives, feta. Fraîche et rapide à préparer.', 4, 15, 10, 'https://images.unsplash.com/photo-1447279506476-3faec8071eee?w=600', true, true, 3, 0, ARRAY['rapide','vegetarienne'], ARRAY['vegetarien']::text[], NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Ingrédients recette 1 — Quiche Lorraine
INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000001', 'Pâte brisée', 1, 'pièce', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000001', 'Lardons', 200, 'g', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000001', 'Crème fraîche', 200, 'mL', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000001', 'Œufs', 3, 'pièce', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000001', 'Gruyère râpé', 80, 'g', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000001', 'Sel', 1, 'pincée', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000001', 'Poivre', 1, 'pincée', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000001', 'Noix de muscade', 1, 'pincée', true, 7);

-- Étapes recette 1 — Quiche Lorraine
INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000001', 1, 'Préchauffer le four à 180°C. Foncer un moule avec la pâte brisée et piquer le fond.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000001', 2, 'Faire revenir les lardons à sec dans une poêle jusqu''à ce qu''ils soient dorés. Laisser refroidir.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000001', 3, 'Dans un bol, fouetter les œufs avec la crème fraîche. Assaisonner avec sel, poivre et muscade.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000001', 4, 'Répartir les lardons sur le fond de tarte. Verser l''appareil œufs-crème par-dessus. Parsemer de gruyère.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000001', 5, 'Enfourner 35-40 min jusqu''à ce que la quiche soit dorée et prise. Laisser tiédir avant de couper en parts.');

-- Ingrédients recette 3 — Curry lentilles corail
INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000003', 'Lentilles corail', 300, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000003', 'Lait de coco', 400, 'mL', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000003', 'Tomates concassées', 400, 'g', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000003', 'Oignon', 1, 'pièce', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000003', 'Ail', 3, 'gousses', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000003', 'Pâte de curry rouge', 2, 'càs', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000003', 'Gingembre frais', 1, 'càs', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000003', 'Coriandre fraîche', 1, 'bouquet', true, 7);

-- Étapes recette 3 — Curry lentilles corail
INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000003', 1, 'Faire revenir l''oignon émincé et l''ail dans un filet d''huile pendant 3 min.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000003', 2, 'Ajouter la pâte de curry et le gingembre. Faire revenir 1 min en mélangeant bien.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000003', 3, 'Ajouter les lentilles rincées, les tomates concassées et le lait de coco. Mélanger.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000003', 4, 'Laisser mijoter 20-25 min à feu moyen jusqu''à ce que les lentilles soient fondantes. Ajuster la texture avec un peu d''eau si nécessaire.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000003', 5, 'Rectifier l''assaisonnement. Servir avec du riz et de la coriandre fraîche.');

-- Ingrédients recette 5 — Soupe légumes hiver
INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000005', 'Carottes', 4, 'pièce', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000005', 'Patate douce', 2, 'pièce', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000005', 'Courgette', 2, 'pièce', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000005', 'Oignon', 1, 'pièce', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000005', 'Bouillon de légumes', 1, 'L', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000005', 'Crème fraîche', 100, 'mL', true, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000005', 'Curry en poudre', 1, 'càc', true, 6);

-- Étapes recette 5 — Soupe légumes hiver
INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000005', 1, 'Éplucher et couper tous les légumes en cubes. Émincer l''oignon.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000005', 2, 'Faire revenir l''oignon 3 min dans une cocotte avec un filet d''huile.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000005', 3, 'Ajouter les légumes et couvrir avec le bouillon. Porter à ébullition puis cuire 20-25 min à feu moyen.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000005', 4, 'Mixer finement. Ajouter la crème et le curry si souhaité. Rectifier l''assaisonnement.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000005', 5, 'Répartir en portions dans des bocaux ou boîtes hermétiques. Se conserve 5 jours au frigo.');

END $$;
