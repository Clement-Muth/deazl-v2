# ADR-002 — Architecture DDD + Vertical Slice

**Statut** : Accepté

## Contexte

L'app a plusieurs domaines distincts (recettes, planning, courses, pantry, analytics) qui vont évoluer indépendamment. On veut éviter le "big ball of mud" où tout est entremêlé.

## Décision

**DDD pragmatique + Vertical Slice** : chaque Bounded Context est auto-contenu dans `src/applications/[bc-name]/` avec ses couches `api/`, `domain/`, `application/`, `infrastructure/`, `ui/`.

## Alternatives considérées

### Architecture en couches classique (layers)
- `components/`, `services/`, `repositories/`, `hooks/` au niveau global
- Rejeté : couplage fort entre features, refactoring difficile quand l'app grandit

### Feature folders sans DDD
- Organisation par feature mais sans séparation domaine/infra
- Rejeté : mélange logique métier et détails d'implémentation, tests plus compliqués

### Monorepo avec packages séparés
- Chaque BC comme un package npm
- Trop lourd pour une app de cette taille au démarrage

## Conséquences

- Plus de boilerplate initial (créer `domain/`, `infrastructure/` même vide)
- En contrepartie : swap facile d'un adapter (ex: changer Supabase pour une autre DB dans un seul BC sans toucher aux autres)
- Les Server Actions vivent dans `application/useCases/` — ils sont la frontière entre UI et domaine
