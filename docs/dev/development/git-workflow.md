# Workflow Git

## Branches

| Branche | Usage |
|---|---|
| `main` | Production — toujours déployable |
| `dev` | Intégration — base pour les features |
| `feature/[nom]` | Développement d'une feature |
| `fix/[nom]` | Correction de bug |

## Commits

Format : `type(scope): description courte`

```
feat(planning): add weekly meal grid
fix(shopping): correct item quantity aggregation
refactor(user): extract household size use case
chore(deps): update Capacitor to v8.1
```

Types : `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`

## Pull Requests

- Branche → `dev` pour les features
- `dev` → `main` pour les releases
- Review requise avant merge
