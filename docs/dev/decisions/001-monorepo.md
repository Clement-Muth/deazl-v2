# ADR-001 — Monorepo Bun workspaces

## Contexte

Le projet a deux surfaces : une application mobile (iOS/Android) et un site web (landing + partage de recettes). Ils partagent potentiellement de la logique et des types.

## Décision

Monorepo avec **Bun workspaces** — `apps/mobile` et `apps/web` dans le même repo, un seul `bun install` à la racine.

## Alternatives évaluées

- **Repos séparés** — pas de partage de types possible, synchronisation manuelle des versions, deux CI séparés.
- **Nx / Turborepo** — surcharge de configuration inutile à ce stade du projet.
- **npm/yarn workspaces** — Bun est plus rapide et gère déjà les workspaces nativement.

## Conséquences

- Un seul `bun install` installe tout.
- Les scripts sont lancés par `bun run --cwd apps/[app] [script]`.
- La CI type-check les deux apps dans le même job.
- Les `packages/` partagés ont été supprimés (trop de complexité pour peu de valeur à ce stade).
