-- Migration : 10 nouvelles recettes curées batch-cooking (IDs 21-30)

SET session_replication_role = replica;

DO $$
DECLARE
  system_user_id UUID := '1ff7d10a-a663-4dfd-922d-ed73f8626af2';
BEGIN

INSERT INTO recipes (id, user_id, name, description, servings, prep_time_minutes, cook_time_minutes, image_url, is_public, is_curated, fridge_days, freezer_months, batch_cooking_tags, dietary_tags, created_at, updated_at) VALUES
  ('bc000001-0000-0000-0000-000000000021', system_user_id, 'Poulet basquaise au riz', 'Poulet mijoté aux poivrons colorés et tomates, servi avec du riz. Un grand classique de la cuisine basque revisité pour le batch cooking.', 4, 15, 35, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600', true, true, 3, 3, ARRAY['rapide','proteinee'], ARRAY[]::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000022', system_user_id, 'One Pot Poulet, Citron & Brocolis', 'Poulet, riz et brocolis cuits ensemble dans une seule casserole. Léger, citronné et prêt en 35 min.', 4, 10, 35, 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600', true, true, 3, 3, ARRAY['proteinee'], ARRAY[]::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000023', system_user_id, 'Croque-Monsieur', 'Le grand classique du café français — jambon, cheddar et béchamel gratiné au four. Rapide et réconfortant.', 4, 10, 15, 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=600', true, true, 3, 3, ARRAY['rapide','proteinee','gourmande'], ARRAY[]::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000024', system_user_id, 'Parmentier de poisson', 'Version légère et savoureuse du parmentier : colin, épinards et carottes sous une purée crémeuse au citron.', 4, 20, 45, 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600', true, true, 3, 3, ARRAY['legere','proteinee'], ARRAY[]::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000025', system_user_id, 'Butter Chicken Express', 'Version express du poulet au beurre indien — crémeux, épicé doux, prêt en 25 min. Servi avec riz et haricots verts.', 4, 10, 25, 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600', true, true, 3, 3, ARRAY['rapide','proteinee','gourmande'], ARRAY[]::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000026', system_user_id, 'Pâtes au Roquefort & Magret de Canard', 'Pâtes crémeuses au roquefort fondant avec des tranches de magret rosé et des noix croquantes. Élégant et généreux.', 4, 15, 20, 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600', true, true, 3, 3, ARRAY['gourmande'], ARRAY[]::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000027', system_user_id, 'Tagliatelles crémeuses, dinde et tomates cerise', 'Tagliatelles en sauce crémeuse légère avec lamières de dinde et tomates cerise confites. Simple et savoureux.', 4, 10, 20, 'https://images.unsplash.com/photo-1611270629569-8b357cb88da9?w=600', true, true, 3, 3, ARRAY['proteinee','gourmande'], ARRAY[]::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000028', system_user_id, 'Lasagnes à la bolognaise maison', 'La vraie bolognaise avec carottes, céleri et béchamel maison — le plat réconfortant par excellence. Se congèle en portions.', 6, 30, 50, 'https://images.unsplash.com/photo-1560781290-7dc94c0f8f4f?w=600', true, true, 3, 3, ARRAY['proteinee','gourmande'], ARRAY[]::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000029', system_user_id, 'Brocolis sautés, tofu fumé et grenailles', 'Sauté de tofu fumé croustillant, brocoli croquant et grenailles dorées, laqué à la sauce soja. Végétarien et nourrissant.', 4, 15, 30, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600', true, true, 3, 3, ARRAY['proteinee','gourmande'], ARRAY['vegetarien']::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000030', system_user_id, 'Cannelloni Bolognaise', 'Tubes de pâtes généreusement farcis à la bolognaise, nappés de coulis de tomate et gratinés au fromage.', 4, 20, 45, 'https://images.unsplash.com/photo-1473093226555-0ece0e737e11?w=600', true, true, 3, 3, ARRAY['proteinee','gourmande'], ARRAY[]::text[], NOW(), NOW());

-- ─── Recette 21 — Poulet basquaise au riz ────────────────────────────────────

INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000021', 'Blanc de poulet', 700, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000021', 'Riz', 300, 'g', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000021', 'Poivrons (rouge + vert)', 3, 'pièces', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000021', 'Oignons', 2, 'pièces', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000021', 'Gousses d''ail', 3, 'pièces', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000021', 'Tomate concassée', 400, 'g', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000021', 'Vin blanc', 150, 'mL', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000021', 'Huile d''olive', 3, 'càs', false, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000021', 'Paprika en poudre', 2, 'càc', false, 8),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000021', 'Curcuma en poudre', 1, 'càc', false, 9),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000021', 'Bouquet garni', 1, 'pièce', false, 10),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000021', 'Sel', 1, 'càc', false, 11),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000021', 'Poivre', 1, 'càc', false, 12);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000021', 1, 'Émincer les oignons et l''ail. Couper les poivrons en lanières. Couper le blanc de poulet en morceaux.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000021', 2, 'Chauffer l''huile d''olive dans une cocotte. Faire dorer les morceaux de poulet sur toutes les faces, puis les réserver. Faire revenir les oignons et l''ail jusqu''à ce qu''ils soient translucides.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000021', 3, 'Ajouter les poivrons, déglacer avec le vin blanc. Ajouter la tomate concassée, le paprika, le curcuma, le bouquet garni, le sel et le poivre. Remettre le poulet. Couvrir et laisser mijoter à feu doux pendant 30 min.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000021', 4, 'Cuire le riz dans 2× son volume d''eau salée pendant 18 min.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000021', 5, 'Retirer le bouquet garni. Servir le poulet basquaise avec le riz.');

-- ─── Recette 22 — One Pot Poulet, Citron & Brocolis ─────────────────────────

INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000022', 'Blanc de poulet', 600, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000022', 'Riz', 250, 'g', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000022', 'Brocoli', 300, 'g', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000022', 'Citron jaune', 2, 'pièces', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000022', 'Gousses d''ail', 3, 'pièces', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000022', 'Bouillon de volaille', 500, 'mL', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000022', 'Crème fraîche épaisse', 100, 'g', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000022', 'Huile d''olive', 2, 'càs', false, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000022', 'Sel', 1, 'càc', false, 8),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000022', 'Poivre', 1, 'càc', false, 9);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000022', 1, 'Couper le poulet en dés. Émincer l''ail. Couper le brocoli en fleurettes. Zester et presser les citrons.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000022', 2, 'Faire dorer le poulet dans l''huile d''olive dans une grande casserole à feu vif. Ajouter l''ail et cuire 1 min.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000022', 3, 'Verser le riz, mouiller avec le bouillon et le jus de citron. Porter à ébullition, couvrir et cuire à feu doux 15 min.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000022', 4, 'Déposer les fleurettes de brocoli sur le dessus, couvrir et cuire encore 5 min.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000022', 5, 'Hors du feu, incorporer la crème fraîche et le zeste de citron. Assaisonner et servir.');

-- ─── Recette 23 — Croque-Monsieur ────────────────────────────────────────────

INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000023', 'Pain de mie', 8, 'tranches', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000023', 'Jambon blanc', 4, 'tranches', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000023', 'Cheddar', 100, 'g', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000023', 'Fromage râpé', 80, 'g', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000023', 'Béchamel', 200, 'mL', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000023', 'Salade verte', 1, 'poignée', true, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000023', 'Sel', 1, 'pincée', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000023', 'Poivre', 1, 'pincée', false, 7);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000023', 1, 'Préchauffer le four à 200°C en mode gril. Préparer ou réchauffer la béchamel.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000023', 2, 'Tartiner un côté de 4 tranches de pain de mie de béchamel. Déposer une tranche de jambon et des lamelles de cheddar sur chacune.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000023', 3, 'Recouvrir avec les 4 autres tranches. Tartiner le dessus de béchamel et parsemer généreusement de fromage râpé.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000023', 4, 'Disposer sur une plaque de cuisson. Enfourner 10-12 min jusqu''à ce que le dessus soit doré et gratiné.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000023', 5, 'Servir chaud accompagné d''une salade verte assaisonnée.');

-- ─── Recette 24 — Parmentier de poisson ──────────────────────────────────────

INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000024', 'Colin', 600, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000024', 'Pommes de terre', 800, 'g', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000024', 'Épinards frais', 200, 'g', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000024', 'Carottes', 2, 'pièces', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000024', 'Oignon', 1, 'pièce', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000024', 'Gousses d''ail', 2, 'pièces', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000024', 'Lait', 150, 'mL', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000024', 'Beurre', 30, 'g', false, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000024', 'Crème fraîche épaisse', 80, 'g', false, 8),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000024', 'Jus de citron', 1, 'càs', false, 9),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000024', 'Persil', 1, 'bouquet', false, 10),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000024', 'Sel', 1, 'càc', false, 11),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000024', 'Poivre', 1, 'càc', false, 12);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000024', 1, 'Cuire les pommes de terre épluchées dans l''eau salée jusqu''à tendreté. Écraser en purée avec le beurre, le lait chaud et la crème. Assaisonner.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000024', 2, 'Faire revenir l''oignon et l''ail émincés dans un peu de beurre. Ajouter les carottes en petits dés et cuire 5 min à feu moyen.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000024', 3, 'Ajouter le colin en morceaux et les épinards. Cuire 5-7 min. Arroser de jus de citron. Émietter grossièrement le poisson à la fourchette.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000024', 4, 'Préchauffer le four à 180°C. Verser le poisson et légumes dans un plat, recouvrir de purée. Lisser la surface à la fourchette.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000024', 5, 'Gratiner au four 20-25 min jusqu''à légère dorure. Parsemer de persil haché avant de servir.');

-- ─── Recette 25 — Butter Chicken Express ─────────────────────────────────────

INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000025', 'Blanc de poulet', 700, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000025', 'Riz', 280, 'g', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000025', 'Haricots verts surgelés', 200, 'g', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000025', 'Coulis de tomate', 400, 'g', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000025', 'Crème fraîche liquide', 100, 'mL', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000025', 'Fromage blanc 0%', 100, 'g', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000025', 'Beurre', 30, 'g', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000025', 'Gousses d''ail', 3, 'pièces', false, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000025', 'Miel', 1, 'càs', false, 8),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000025', 'Curcuma en poudre', 1, 'càc', false, 9),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000025', 'Coriandre moulue', 1, 'càc', false, 10),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000025', 'Gingembre en poudre', 1, 'càc', false, 11),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000025', 'Garam masala', 1, 'càc', false, 12),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000025', 'Flocons de piment', 0.5, 'càc', true, 13),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000025', 'Coriandre fraîche', 1, 'bouquet', true, 14),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000025', 'Sel', 1, 'càc', false, 15);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000025', 1, 'Couper le poulet en dés. Mélanger les épices sèches (curcuma, coriandre, gingembre, garam masala, piment). Émincer l''ail.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000025', 2, 'Faire fondre le beurre dans une grande poêle. Faire revenir l''ail 1 min, ajouter le poulet et les épices. Cuire à feu vif 5-7 min jusqu''à légère coloration.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000025', 3, 'Incorporer le coulis de tomate et le miel. Laisser mijoter 15 min à feu doux en remuant régulièrement.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000025', 4, 'En parallèle, cuire le riz dans 2× son volume d''eau salée. Cuire les haricots verts selon les instructions.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000025', 5, 'Hors du feu, incorporer la crème fraîche et le fromage blanc. Servir avec le riz, les haricots et la coriandre fraîche ciselée.');

-- ─── Recette 26 — Pâtes au Roquefort & Magret de Canard ──────────────────────

INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000026', 'Pâtes', 320, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000026', 'Magrets de canard', 500, 'g', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000026', 'Roquefort', 120, 'g', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000026', 'Échalote', 2, 'pièces', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000026', 'Lait', 100, 'mL', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000026', 'Noix', 50, 'g', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000026', 'Roquette', 60, 'g', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000026', 'Poivre', 1, 'càc', false, 7);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000026', 1, 'Inciser le magret en croisillons côté peau. Cuire à la poêle froide, côté peau en premier, 8 min à feu moyen. Retourner, cuire 4 min. Envelopper dans du papier alu et laisser reposer 5 min.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000026', 2, 'Émincer les échalotes et les faire revenir dans la graisse de canard rendue dans la poêle. Déglacer avec le lait.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000026', 3, 'Émietter le roquefort dans la sauce. Faire fondre à feu doux en remuant. Poivrer généreusement — ne pas saler, le roquefort l''est déjà.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000026', 4, 'Cuire les pâtes al dente. Égoutter en réservant un verre d''eau de cuisson. Mélanger avec la sauce, ajouter un peu d''eau de cuisson si nécessaire.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000026', 5, 'Trancher finement le magret. Dresser les pâtes, déposer les tranches de magret, les noix concassées et la roquette.');

-- ─── Recette 27 — Tagliatelles crémeuses, dinde et tomates cerise ─────────────

INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000027', 'Tagliatelles', 320, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000027', 'Dinde', 500, 'g', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000027', 'Tomates cerise', 250, 'g', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000027', 'Oignon', 1, 'pièce', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000027', 'Gousses d''ail', 2, 'pièces', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000027', 'Crème fraîche épaisse', 150, 'g', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000027', 'Huile d''olive', 2, 'càs', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000027', 'Sel', 1, 'càc', false, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000027', 'Poivre', 1, 'càc', false, 8);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000027', 1, 'Couper la dinde en lanières. Émincer l''oignon et l''ail. Couper les tomates cerise en deux.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000027', 2, 'Faire chauffer l''huile d''olive dans une grande poêle. Faire revenir l''oignon et l''ail 3 min. Ajouter la dinde et faire dorer 5-6 min.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000027', 3, 'Ajouter les tomates cerise, cuire 3-4 min jusqu''à ce qu''elles ramollissent et libèrent leur jus.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000027', 4, 'Incorporer la crème fraîche. Assaisonner. Laisser mijoter 5 min à feu doux.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000027', 5, 'Cuire les tagliatelles al dente. Égoutter et mélanger immédiatement à la sauce. Servir aussitôt.');

-- ─── Recette 28 — Lasagnes à la bolognaise maison ────────────────────────────

INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000028', 'Plaques de lasagnes', 12, 'pièces', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000028', 'Viande hachée', 600, 'g', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000028', 'Tomate concassée', 400, 'g', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000028', 'Concentré de tomate', 2, 'càs', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000028', 'Oignons', 2, 'pièces', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000028', 'Gousses d''ail', 3, 'pièces', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000028', 'Carottes', 2, 'pièces', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000028', 'Branches de céleri', 2, 'pièces', false, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000028', 'Lait', 500, 'mL', false, 8),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000028', 'Farine de blé', 40, 'g', false, 9),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000028', 'Beurre', 40, 'g', false, 10),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000028', 'Fromage râpé', 100, 'g', false, 11),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000028', 'Noix de muscade', 1, 'pincée', true, 12),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000028', 'Huile d''olive', 2, 'càs', false, 13),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000028', 'Sel', 1, 'càc', false, 14),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000028', 'Poivre', 1, 'càc', false, 15);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000028', 1, 'Faire revenir oignon, ail, carottes et céleri en brunoise dans l''huile. Ajouter la viande hachée, faire dorer. Incorporer tomates et concentré. Assaisonner et mijoter 20 min.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000028', 2, 'Préparer la béchamel : faire fondre le beurre, ajouter la farine d''un coup, mélanger 1 min. Incorporer le lait progressivement en fouettant. Assaisonner avec sel, poivre et muscade.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000028', 3, 'Préchauffer le four à 180°C. Tapisser le fond d''un grand plat d''une couche de béchamel. Disposer une couche de plaques de lasagnes.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000028', 4, 'Alterner : bolognaise, lasagnes, béchamel, jusqu''à épuisement. Terminer par une couche généreuse de béchamel et parsemer de fromage râpé.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000028', 5, 'Couvrir de papier alu et cuire 30 min. Retirer l''alu, gratiner 15 min jusqu''à dorure. Laisser reposer 10 min. Se congèle très bien en portions.');

-- ─── Recette 29 — Brocolis sautés, tofu fumé et grenailles ──────────────────

INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000029', 'Tofu fumé', 400, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000029', 'Brocoli', 400, 'g', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000029', 'Pommes de terre grenailles', 500, 'g', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000029', 'Gousses d''ail', 3, 'pièces', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000029', 'Sauce soja', 3, 'càs', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000029', 'Huile de sésame', 2, 'càs', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000029', 'Huile d''olive', 2, 'càs', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000029', 'Graines de sésame', 1, 'càs', true, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000029', 'Herbes de Provence', 1, 'càc', false, 8),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000029', 'Flocons de piment', 0.5, 'càc', true, 9),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000029', 'Sel', 1, 'càc', false, 10),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000029', 'Poivre', 1, 'càc', false, 11);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000029', 1, 'Cuire les grenailles dans l''eau salée 15-18 min. Égoutter, laisser tiédir, puis écraser légèrement chaque grenaille avec la paume de la main.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000029', 2, 'Faire dorer les grenailles écrasées dans l''huile d''olive avec les herbes de Provence 8-10 min jusqu''à ce qu''elles soient croustillantes. Réserver.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000029', 3, 'Couper le tofu fumé en dés. Faire dorer dans l''huile de sésame à feu vif 5 min jusqu''à légère croûte. Ajouter l''ail émincé, cuire 1 min.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000029', 4, 'Ajouter le brocoli en fleurettes. Sauter à feu vif 4-5 min en remuant. Le brocoli doit rester légèrement croquant.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000029', 5, 'Remettre les grenailles dans la poêle. Déglacer avec la sauce soja. Mélanger, parsemer de graines de sésame et de flocons de piment.');

-- ─── Recette 30 — Cannelloni Bolognaise ──────────────────────────────────────

INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000030', 'Cannelloni', 250, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000030', 'Viande hachée', 500, 'g', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000030', 'Coulis de tomate', 400, 'g', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000030', 'Fromage râpé', 100, 'g', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000030', 'Oignon', 1, 'pièce', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000030', 'Gousses d''ail', 2, 'pièces', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000030', 'Huile d''olive', 2, 'càs', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000030', 'Herbes de Provence', 1, 'càc', false, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000030', 'Sel', 1, 'càc', false, 8),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000030', 'Poivre', 1, 'càc', false, 9);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000030', 1, 'Faire revenir l''oignon et l''ail émincés dans l''huile. Ajouter la viande hachée, faire dorer en émiettant. Assaisonner avec les herbes, sel et poivre. Laisser tiédir.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000030', 2, 'Farcir les cannelloni crus à l''aide d''une poche à douille ou d''une petite cuillère. Procéder délicatement pour ne pas les casser.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000030', 3, 'Préchauffer le four à 180°C. Verser la moitié du coulis de tomate dans le fond d''un grand plat allant au four.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000030', 4, 'Déposer les cannelloni farcis en une seule couche sur le coulis. Recouvrir avec le reste du coulis. Parsemer généreusement de fromage râpé.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000030', 5, 'Couvrir hermétiquement de papier aluminium et cuire 35 min. Retirer l''alu et gratiner 10-15 min jusqu''à dorure.');

END $$;

SET session_replication_role = DEFAULT;
