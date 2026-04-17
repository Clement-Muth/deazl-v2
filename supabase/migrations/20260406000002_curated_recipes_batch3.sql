-- Migration : 2 nouvelles recettes curées (IDs 31-32)

SET session_replication_role = replica;

DO $$
DECLARE
  system_user_id UUID := '1ff7d10a-a663-4dfd-922d-ed73f8626af2';
BEGIN

INSERT INTO recipes (id, user_id, name, description, servings, prep_time_minutes, cook_time_minutes, image_url, is_public, is_curated, fridge_days, freezer_months, batch_cooking_tags, dietary_tags, created_at, updated_at) VALUES
  ('bc000001-0000-0000-0000-000000000031', system_user_id, 'Risotto chèvre et noix de pécan', 'Risotto crémeux au riz Arborio, fondant de chèvre frais et noix de pécan caramélisées. Raffiné et généreux.', 4, 15, 30, 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600', true, true, 3, 3, ARRAY['gourmande'], ARRAY[]::text[], NOW(), NOW()),
  ('bc000001-0000-0000-0000-000000000032', system_user_id, 'One Pot Orzo crémeux tomate, parmesan & épinards', 'Orzo cuit directement dans un bouillon crémeux tomate avec poulet, parmesan et épinards frais. Prêt en 30 min.', 4, 10, 25, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600', true, true, 3, 3, ARRAY['rapide','proteinee','gourmande'], ARRAY[]::text[], NOW(), NOW());

-- ─── Recette 31 — Risotto chèvre et noix de pécan ────────────────────────────

INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000031', 'Riz Arborio', 320, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000031', 'Chèvre frais', 150, 'g', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000031', 'Noix de pécan', 60, 'g', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000031', 'Oignons', 2, 'pièces', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000031', 'Bouillon de légumes', 1, 'L', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000031', 'Vin blanc', 150, 'mL', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000031', 'Huile d''olive', 3, 'càs', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000031', 'Sel', 1, 'càc', false, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000031', 'Poivre', 1, 'càc', false, 8);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000031', 1, 'Chauffer le bouillon dans une casserole à feu doux. Émincer finement les oignons. Concasser grossièrement les noix de pécan.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000031', 2, 'Faire revenir les oignons dans l''huile d''olive à feu moyen 5 min jusqu''à transparence. Ajouter le riz Arborio et nacrer 2 min en remuant.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000031', 3, 'Verser le vin blanc et laisser absorber en remuant. Ajouter le bouillon chaud louche par louche en remuant constamment. Poursuivre 18 min jusqu''à ce que le riz soit al dente et crémeux.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000031', 4, 'Hors du feu, incorporer le chèvre frais émietté. Mélanger jusqu''à fonte complète. Assaisonner.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000031', 5, 'Faire dorer les noix de pécan à sec dans une poêle 2-3 min. Servir le risotto dans des assiettes creuses, parsemer de noix de pécan et d''un trait d''huile d''olive.');

-- ─── Recette 32 — One Pot Orzo crémeux tomate, parmesan & épinards ─────────

INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000032', 'Blanc de poulet', 600, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000032', 'Pâtes Orzo', 300, 'g', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000032', 'Parmesan râpé', 80, 'g', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000032', 'Beurre', 20, 'g', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000032', 'Concentré de tomate', 2, 'càs', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000032', 'Crème fraîche liquide', 100, 'mL', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000032', 'Épinards frais', 100, 'g', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000032', 'Oignons', 1, 'pièce', false, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000032', 'Paprika en poudre', 1, 'càc', false, 8),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000032', 'Bouillon de légumes', 700, 'mL', false, 9),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000032', 'Sel', 1, 'càc', false, 10),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000032', 'Poivre', 1, 'càc', false, 11);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000032', 1, 'Couper le poulet en dés. Émincer l''oignon. Faire fondre le beurre dans une grande casserole à feu moyen-vif.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000032', 2, 'Faire revenir l''oignon 3 min. Ajouter le poulet, saupoudrer de paprika, faire dorer 4-5 min en remuant.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000032', 3, 'Incorporer le concentré de tomate et mélanger 1 min. Verser l''orzo et le bouillon. Porter à ébullition, puis cuire à feu moyen 12-14 min en remuant régulièrement jusqu''à absorption du bouillon.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000032', 4, 'Baisser à feu doux, ajouter la crème fraîche et le parmesan. Mélanger jusqu''à sauce crémeuse homogène.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000032', 5, 'Incorporer les épinards frais hors du feu, mélanger jusqu''à flétrissement. Assaisonner et servir immédiatement.');

END $$;

SET session_replication_role = DEFAULT;
