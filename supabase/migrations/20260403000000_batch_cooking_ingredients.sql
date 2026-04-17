-- Migration : ingrédients et étapes pour les recettes batch-cooking curées (2, 4, 6-20)

-- Recette 2 — Poulet rôti au citron
INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000002', 'Poulet entier', 1, 'pièce', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000002', 'Citron', 2, 'pièce', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000002', 'Ail', 4, 'gousses', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000002', 'Thym frais', 4, 'brins', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000002', 'Romarin', 2, 'brins', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000002', 'Huile d''olive', 3, 'càs', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000002', 'Sel', 1, 'pincée', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000002', 'Poivre', 1, 'pincée', false, 7);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000002', 1, 'Préchauffer le four à 200°C. Zester et presser les citrons.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000002', 2, 'Mélanger le jus de citron, l''huile d''olive, l''ail écrasé, le thym, le romarin, le sel et le poivre.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000002', 3, 'Badigeonner généreusement le poulet de la marinade, y compris sous la peau. Laisser mariner 30 min si possible.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000002', 4, 'Placer dans un plat allant au four. Rôtir 60 min en arrosant toutes les 20 min.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000002', 5, 'Laisser reposer 10 min avant de découper. Conserver en portions au frigo.');

-- Recette 4 — Gratin de pâtes à la bolognese
INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000004', 'Pâtes penne', 500, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000004', 'Bœuf haché', 400, 'g', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000004', 'Tomates concassées', 800, 'g', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000004', 'Oignon', 2, 'pièce', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000004', 'Ail', 3, 'gousses', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000004', 'Gruyère râpé', 150, 'g', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000004', 'Concentré de tomate', 2, 'càs', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000004', 'Herbes de Provence', 1, 'càc', false, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000004', 'Sel', 1, 'pincée', false, 8),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000004', 'Poivre', 1, 'pincée', false, 9);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000004', 1, 'Cuire les pâtes al dente dans de l''eau bouillante salée. Égoutter et réserver.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000004', 2, 'Faire revenir l''oignon et l''ail dans l''huile. Ajouter le bœuf haché et cuire jusqu''à dorure.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000004', 3, 'Incorporer les tomates concassées, le concentré et les herbes. Mijoter 15 min. Saler et poivrer.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000004', 4, 'Préchauffer le four à 180°C. Mélanger les pâtes à la sauce bolognese.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000004', 5, 'Verser dans un grand plat, couvrir de gruyère râpé. Gratiner 20-25 min jusqu''à dorure.');

-- Recette 6 — Risotto poulet champignons
INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000006', 'Riz arborio', 400, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000006', 'Escalopes de poulet', 300, 'g', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000006', 'Champignons de Paris', 300, 'g', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000006', 'Bouillon de volaille', 1.2, 'L', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000006', 'Oignon', 1, 'pièce', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000006', 'Vin blanc sec', 100, 'mL', true, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000006', 'Parmesan râpé', 60, 'g', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000006', 'Beurre', 30, 'g', false, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000006', 'Sel', 1, 'pincée', false, 8),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000006', 'Poivre', 1, 'pincée', false, 9);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000006', 1, 'Couper le poulet en dés et les champignons en tranches. Faire chauffer le bouillon dans une casserole.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000006', 2, 'Dans une grande poêle, faire revenir l''oignon émincé dans le beurre. Ajouter le poulet et faire dorer.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000006', 3, 'Ajouter les champignons et cuire 5 min. Incorporer le riz et faire revenir 2 min.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000006', 4, 'Déglacer au vin blanc. Ajouter le bouillon chaud louche par louche en remuant régulièrement pendant 20 min.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000006', 5, 'Hors du feu, incorporer le parmesan. Assaisonner. Pour réchauffer, ajouter un peu d''eau ou de bouillon.');

-- Recette 7 — Chili con carne
INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000007', 'Bœuf haché', 600, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000007', 'Haricots rouges', 400, 'g', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000007', 'Tomates concassées', 800, 'g', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000007', 'Oignon', 2, 'pièce', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000007', 'Ail', 4, 'gousses', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000007', 'Poivron rouge', 1, 'pièce', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000007', 'Cumin en poudre', 2, 'càc', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000007', 'Paprika fumé', 2, 'càc', false, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000007', 'Piment de Cayenne', 0.5, 'càc', true, 8),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000007', 'Concentré de tomate', 2, 'càs', false, 9),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000007', 'Sel', 1, 'pincée', false, 10);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000007', 1, 'Faire revenir l''oignon, l''ail et le poivron émincés dans de l''huile pendant 5 min.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000007', 2, 'Ajouter le bœuf haché et faire dorer en remuant. Égoutter l''excès de gras si nécessaire.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000007', 3, 'Incorporer le cumin, le paprika, le piment et le concentré de tomate. Cuire 2 min.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000007', 4, 'Ajouter les tomates concassées et les haricots égouttés. Mélanger et porter à ébullition.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000007', 5, 'Laisser mijoter 30-40 min à feu doux. Le chili est encore meilleur le lendemain. Servir avec du riz ou des tortillas.');

-- Recette 8 — Poulet tikka masala
INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000008', 'Escalopes de poulet', 600, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000008', 'Yaourt nature', 150, 'g', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000008', 'Tomates concassées', 400, 'g', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000008', 'Crème fraîche', 100, 'mL', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000008', 'Oignon', 2, 'pièce', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000008', 'Ail', 4, 'gousses', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000008', 'Gingembre frais', 1, 'càs', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000008', 'Garam masala', 2, 'càc', false, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000008', 'Curcuma', 1, 'càc', false, 8),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000008', 'Paprika', 1, 'càc', false, 9),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000008', 'Coriandre fraîche', 1, 'bouquet', true, 10);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000008', 1, 'Couper le poulet en cubes. Mélanger avec le yaourt, la moitié des épices, l''ail et le gingembre. Mariner 30 min minimum.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000008', 2, 'Faire revenir le poulet mariné dans une poêle huilée jusqu''à légère coloration. Réserver.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000008', 3, 'Dans la même poêle, faire revenir l''oignon émincé. Ajouter le reste des épices et cuire 1 min.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000008', 4, 'Ajouter les tomates concassées. Mijoter 15 min à feu moyen.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000008', 5, 'Incorporer le poulet et la crème. Laisser mijoter encore 10 min. Servir avec du riz basmati et de la coriandre.');

-- Recette 9 — Bowl quinoa légumes rôtis
INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000009', 'Quinoa', 300, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000009', 'Courgette', 2, 'pièce', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000009', 'Poivron rouge', 2, 'pièce', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000009', 'Champignons de Paris', 200, 'g', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000009', 'Pois chiches cuits', 200, 'g', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000009', 'Tahini', 3, 'càs', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000009', 'Citron', 1, 'pièce', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000009', 'Ail', 1, 'gousse', false, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000009', 'Huile d''olive', 3, 'càs', false, 8),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000009', 'Paprika', 1, 'càc', false, 9),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000009', 'Sel', 1, 'pincée', false, 10);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000009', 1, 'Préchauffer le four à 200°C. Couper les légumes en morceaux. Mélanger avec l''huile, le paprika, le sel.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000009', 2, 'Rôtir les légumes + pois chiches au four 25-30 min en retournant à mi-cuisson.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000009', 3, 'Cuire le quinoa dans le double de son volume d''eau salée pendant 15 min. Laisser absorber.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000009', 4, 'Préparer la sauce tahini : mélanger le tahini, le jus de citron, l''ail pressé et un peu d''eau froide.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000009', 5, 'Assembler les bowls : quinoa, légumes rôtis, sauce tahini. Conserver la sauce séparément au frigo.');

-- Recette 10 — Saumon en papillote citron-aneth
INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000010', 'Pavés de saumon', 4, 'pièce', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000010', 'Citron', 2, 'pièce', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000010', 'Aneth frais', 1, 'bouquet', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000010', 'Beurre', 40, 'g', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000010', 'Ail', 2, 'gousses', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000010', 'Câpres', 2, 'càs', true, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000010', 'Sel', 1, 'pincée', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000010', 'Poivre', 1, 'pincée', false, 7);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000010', 1, 'Préchauffer le four à 200°C. Préparer 4 grandes feuilles de papier aluminium.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000010', 2, 'Déposer chaque pavé de saumon sur une feuille d''alu. Saler et poivrer.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000010', 3, 'Ajouter sur chaque pavé : une noisette de beurre, des rondelles de citron, de l''aneth, de l''ail émincé et des câpres.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000010', 4, 'Refermer hermétiquement les papillotes. Cuire au four 15-18 min.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000010', 5, 'Laisser refroidir avant de stocker. Réchauffer doucement à la poêle ou au micro-ondes.');

-- Recette 11 — Hachis parmentier
INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000011', 'Bœuf haché', 500, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000011', 'Pommes de terre', 1, 'kg', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000011', 'Oignon', 2, 'pièce', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000011', 'Ail', 3, 'gousses', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000011', 'Lait', 100, 'mL', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000011', 'Beurre', 50, 'g', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000011', 'Concentré de tomate', 2, 'càs', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000011', 'Gruyère râpé', 80, 'g', true, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000011', 'Noix de muscade', 1, 'pincée', true, 8),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000011', 'Sel', 1, 'pincée', false, 9),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000011', 'Poivre', 1, 'pincée', false, 10);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000011', 1, 'Cuire les pommes de terre épluchées dans de l''eau salée jusqu''à tendreté. Écraser avec le beurre, le lait et la muscade.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000011', 2, 'Faire revenir l''oignon et l''ail. Ajouter le bœuf haché, cuire jusqu''à dorure.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000011', 3, 'Incorporer le concentré de tomate. Assaisonner. Laisser mijoter 5 min.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000011', 4, 'Préchauffer le four à 180°C. Étaler la viande dans un plat, couvrir de purée. Parsemer de gruyère.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000011', 5, 'Gratiner au four 20-25 min. Se congèle parfaitement en portions individuelles.');

-- Recette 12 — Wok de bœuf aux nouilles
INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000012', 'Bœuf haché', 400, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000012', 'Nouilles de blé', 300, 'g', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000012', 'Brocoli', 1, 'pièce', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000012', 'Carotte', 2, 'pièce', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000012', 'Poivron rouge', 1, 'pièce', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000012', 'Sauce soja', 4, 'càs', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000012', 'Sauce huître', 2, 'càs', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000012', 'Gingembre frais', 1, 'càs', false, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000012', 'Ail', 3, 'gousses', false, 8),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000012', 'Huile de sésame', 1, 'càs', true, 9);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000012', 1, 'Cuire les nouilles selon les instructions. Égoutter et rincer à l''eau froide. Réserver.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000012', 2, 'Couper les légumes en julienne ou petits morceaux. Mélanger sauce soja, sauce huître dans un bol.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000012', 3, 'Faire chauffer un wok à feu vif. Faire revenir l''ail et le gingembre 30 sec.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000012', 4, 'Ajouter le bœuf et cuire 3-4 min. Incorporer les légumes et sauter 3 min à feu vif.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000012', 5, 'Ajouter les nouilles et la sauce. Mélanger vigoureusement 2 min. Finir avec l''huile de sésame.');

-- Recette 13 — Minestrone de légumes
INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000013', 'Haricots blancs cuits', 400, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000013', 'Tomates concassées', 400, 'g', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000013', 'Courgette', 2, 'pièce', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000013', 'Carotte', 3, 'pièce', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000013', 'Céleri', 2, 'tiges', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000013', 'Oignon', 1, 'pièce', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000013', 'Ail', 3, 'gousses', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000013', 'Pâtes petite taille', 150, 'g', false, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000013', 'Bouillon de légumes', 1.5, 'L', false, 8),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000013', 'Parmesan râpé', 40, 'g', true, 9),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000013', 'Basilic frais', 1, 'bouquet', true, 10),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000013', 'Sel', 1, 'pincée', false, 11);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000013', 1, 'Émincer l''oignon, l''ail. Couper carottes, céleri et courgettes en petits dés.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000013', 2, 'Faire revenir l''oignon et l''ail dans l''huile d''olive. Ajouter les légumes durs (carotte, céleri) et cuire 5 min.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000013', 3, 'Ajouter les tomates concassées, les courgettes et le bouillon. Porter à ébullition.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000013', 4, 'Incorporer les haricots blancs et les pâtes. Cuire encore 10 min. Saler.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000013', 5, 'Servir avec du parmesan et du basilic. La soupe épaissit en refroidissant : ajouter un peu d''eau au réchauffage.');

-- Recette 14 — Curry de pois chiches épinards
INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000014', 'Pois chiches cuits', 600, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000014', 'Épinards frais', 300, 'g', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000014', 'Tomates concassées', 400, 'g', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000014', 'Lait de coco', 200, 'mL', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000014', 'Oignon', 1, 'pièce', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000014', 'Ail', 3, 'gousses', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000014', 'Gingembre frais', 1, 'càs', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000014', 'Curcuma', 1, 'càc', false, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000014', 'Cumin', 1, 'càc', false, 8),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000014', 'Garam masala', 1, 'càc', false, 9),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000014', 'Sel', 1, 'pincée', false, 10);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000014', 1, 'Faire revenir l''oignon émincé dans l''huile pendant 4 min. Ajouter l''ail et le gingembre.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000014', 2, 'Incorporer les épices (curcuma, cumin, garam masala). Cuire 1 min en remuant.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000014', 3, 'Ajouter les tomates concassées et le lait de coco. Porter à ébullition.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000014', 4, 'Incorporer les pois chiches. Laisser mijoter 15 min à feu moyen.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000014', 5, 'Ajouter les épinards et cuire encore 3 min jusqu''à ce qu''ils soient fondus. Servir avec du riz basmati.');

-- Recette 15 — Lasagnes à la bolognese
INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000015', 'Feuilles de lasagne', 16, 'pièce', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000015', 'Bœuf haché', 600, 'g', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000015', 'Tomates concassées', 800, 'g', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000015', 'Oignon', 2, 'pièce', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000015', 'Ail', 4, 'gousses', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000015', 'Lait', 700, 'mL', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000015', 'Beurre', 60, 'g', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000015', 'Farine', 60, 'g', false, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000015', 'Gruyère râpé', 150, 'g', false, 8),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000015', 'Concentré de tomate', 2, 'càs', false, 9),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000015', 'Noix de muscade', 1, 'pincée', false, 10);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000015', 1, 'Bolognese : faire revenir oignon et ail, ajouter le bœuf. Une fois doré, incorporer tomates et concentré. Mijoter 20 min.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000015', 2, 'Béchamel : faire fondre le beurre, incorporer la farine. Ajouter le lait progressivement en fouettant jusqu''à épaississement. Muscader.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000015', 3, 'Préchauffer le four à 180°C. Dans un grand plat, alterner : béchamel, lasagnes, bolognese. Terminer par de la béchamel.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000015', 4, 'Couvrir de gruyère râpé. Cuire 40-50 min jusqu''à dorure.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000015', 5, 'Laisser reposer 10 min avant de couper. Se congèle en portions individuelles emballées.');

-- Recette 16 — Filets de cabillaud citron câpres
INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000016', 'Filets de cabillaud', 600, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000016', 'Citron', 2, 'pièce', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000016', 'Câpres', 3, 'càs', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000016', 'Beurre', 40, 'g', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000016', 'Ail', 2, 'gousses', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000016', 'Persil frais', 1, 'bouquet', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000016', 'Huile d''olive', 2, 'càs', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000016', 'Sel', 1, 'pincée', false, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000016', 'Poivre', 1, 'pincée', false, 8);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000016', 1, 'Sécher les filets avec du papier absorbant. Saler et poivrer des deux côtés.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000016', 2, 'Chauffer l''huile dans une grande poêle à feu moyen-vif. Cuire les filets 3-4 min par face. Réserver au chaud.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000016', 3, 'Dans la même poêle, faire fondre le beurre. Ajouter l''ail émincé et les câpres. Cuire 1 min.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000016', 4, 'Déglacer avec le jus de citron. Laisser réduire 1 min. Ajouter le persil haché.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000016', 5, 'Napper les filets de sauce. Servir avec des légumes vapeur ou du riz.');

-- Recette 17 — Boulettes de viande sauce tomate
INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000017', 'Bœuf haché', 500, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000017', 'Tomates concassées', 800, 'g', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000017', 'Œuf', 1, 'pièce', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000017', 'Chapelure', 60, 'g', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000017', 'Oignon', 1, 'pièce', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000017', 'Ail', 3, 'gousses', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000017', 'Persil frais', 1, 'bouquet', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000017', 'Parmesan râpé', 40, 'g', true, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000017', 'Basilic frais', 1, 'bouquet', true, 8),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000017', 'Sel', 1, 'pincée', false, 9),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000017', 'Poivre', 1, 'pincée', false, 10);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000017', 1, 'Mélanger le bœuf haché, l''œuf, la chapelure, l''ail pressé, le persil haché, le parmesan. Assaisonner. Former des boulettes de 3-4 cm.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000017', 2, 'Faire dorer les boulettes dans l''huile sur toutes les faces. Réserver.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000017', 3, 'Dans la même poêle, faire revenir l''oignon émincé. Ajouter les tomates concassées et le basilic.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000017', 4, 'Remettre les boulettes dans la sauce. Mijoter 20 min à feu doux en couvrant.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000017', 5, 'Servir avec des pâtes ou du riz. Se congèlent parfaitement en portions avec la sauce.');

-- Recette 18 — Taboulé libanais
INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000018', 'Boulgour fin', 200, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000018', 'Persil plat frais', 2, 'bouquets', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000018', 'Tomates', 4, 'pièce', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000018', 'Menthe fraîche', 1, 'bouquet', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000018', 'Oignon nouveau', 4, 'pièce', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000018', 'Citron', 3, 'pièce', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000018', 'Huile d''olive', 4, 'càs', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000018', 'Concombre', 1, 'pièce', true, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000018', 'Sel', 1, 'pincée', false, 8);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000018', 1, 'Réhydrater le boulgour dans de l''eau froide salée pendant 20 min. Égoutter et presser pour enlever l''excès d''eau.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000018', 2, 'Ciseler finement le persil et la menthe. Émincer les oignons nouveaux.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000018', 3, 'Couper les tomates (et le concombre) en petits dés. Enlever les graines si souhaité.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000018', 4, 'Mélanger tous les ingrédients. Arroser de jus de citron et d''huile d''olive. Saler et mélanger.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000018', 5, 'Réfrigérer au moins 1h avant de servir. Le taboulé est encore meilleur le lendemain une fois bien imprégné.');

-- Recette 19 — Poulet basquaise
INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000019', 'Cuisses de poulet', 8, 'pièce', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000019', 'Poivron rouge', 3, 'pièce', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000019', 'Poivron vert', 2, 'pièce', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000019', 'Tomates concassées', 800, 'g', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000019', 'Oignon', 2, 'pièce', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000019', 'Ail', 4, 'gousses', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000019', 'Chorizo', 100, 'g', true, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000019', 'Piment d''Espelette', 1, 'càc', false, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000019', 'Thym', 3, 'brins', false, 8),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000019', 'Laurier', 2, 'feuilles', false, 9),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000019', 'Sel', 1, 'pincée', false, 10);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000019', 1, 'Assaisonner les cuisses de poulet. Les faire dorer de tous côtés dans une cocotte huilée. Réserver.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000019', 2, 'Dans la même cocotte, faire revenir les oignons et l''ail émincés. Ajouter les poivrons coupés en lanières.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000019', 3, 'Ajouter le chorizo en rondelles si utilisé. Faire revenir 3 min.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000019', 4, 'Incorporer les tomates, le piment d''Espelette, le thym et le laurier. Mélanger.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000019', 5, 'Remettre le poulet. Couvrir et mijoter 40 min à feu doux. Meilleur réchauffé le lendemain.');

-- Recette 20 — Salade de pâtes méditerranéenne
INSERT INTO recipe_ingredients (id, recipe_id, custom_name, quantity, unit, is_optional, sort_order) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000020', 'Pâtes fusilli', 400, 'g', false, 0),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000020', 'Tomates séchées', 100, 'g', false, 1),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000020', 'Olives noires', 100, 'g', false, 2),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000020', 'Feta', 150, 'g', false, 3),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000020', 'Concombre', 1, 'pièce', false, 4),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000020', 'Tomates cerises', 200, 'g', false, 5),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000020', 'Basilic frais', 1, 'bouquet', false, 6),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000020', 'Huile d''olive', 4, 'càs', false, 7),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000020', 'Vinaigre balsamique', 2, 'càs', false, 8),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000020', 'Ail', 1, 'gousse', true, 9),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000020', 'Sel', 1, 'pincée', false, 10);

INSERT INTO recipe_steps (id, recipe_id, step_number, description) VALUES
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000020', 1, 'Cuire les pâtes selon les instructions dans de l''eau bien salée. Égoutter et rincer à l''eau froide.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000020', 2, 'Couper les tomates cerises en deux, le concombre en dés, les tomates séchées en lanières.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000020', 3, 'Préparer la vinaigrette : mélanger huile d''olive, vinaigre balsamique, ail pressé, sel.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000020', 4, 'Mélanger les pâtes froides avec tous les légumes, les olives et la vinaigrette.'),
  (gen_random_uuid(), 'bc000001-0000-0000-0000-000000000020', 5, 'Émietter la feta par-dessus. Ajouter le basilic ciselé. Réfrigérer au moins 30 min. Encore meilleur le lendemain.');
