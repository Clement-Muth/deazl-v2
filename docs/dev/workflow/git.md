# Git & branches

## Branches

| Branche | Rôle | Déploiement |
|---|---|---|
| `main` | Production | Vercel prod + `docs.deazl.fr` |
| `staging` | Intégration quotidienne | Vercel preview + `staging.deazl.fr` |
| `feat/*`, `fix/*`, `chore/*` | Travail en cours | — |

## Flux de travail

```
feat/ma-feature  →  staging  →  main
```

1. Créer une branche depuis `staging`
2. Développer et pousser
3. Ouvrir une PR vers `staging`
4. PR merge → déploiement preview automatique
5. Quand `staging` est stable : PR `staging` → `main`
6. La CI (typecheck) doit passer pour merger sur `main`

{% hint style="warning" %}
`main` est protégé par ruleset GitHub. Merge direct interdit — PR obligatoire, CI requise.
{% endhint %}

## Conventions de commits

```
type(scope): description courte

feat(shopping): ajouter le scan de code-barres
fix(auth): corriger la redirection après confirmation email
chore(deps): mettre à jour expo vers 55.0.5
docs(dev): mettre à jour l'ADR Expo
```

**Types** : `feat`, `fix`, `refactor`, `chore`, `docs`, `test`\
**Scopes** : `mobile`, `web`, `shopping`, `recipe`, `planning`, `pantry`, `auth`, `ci`, `deps`, `docs`
