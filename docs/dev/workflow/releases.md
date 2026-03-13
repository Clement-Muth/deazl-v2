# Releases & versioning

## Source de vérité

La version est définie dans **`apps/mobile/app.json`** et synchronisée dans tous les `package.json`.

```json
{
  "expo": {
    "version": "1.2.0",
    "ios": { "buildNumber": "5" },
    "android": { "versionCode": 5 }
  }
}
```

## Semver

```
MAJOR.MINOR.PATCH

1.0.0 → 1.0.1  patch   Bugfix sans impact fonctionnel
1.0.0 → 1.1.0  minor   Nouvelle feature rétrocompatible
1.0.0 → 2.0.0  major   Breaking change ou refonte majeure
```

## Quand bumper

| Type de changement | Bump |
|---|---|
| Correction de bug | `patch` |
| Nouvelle feature | `minor` |
| Refonte, breaking change | `major` |
| Chore, docs, CI uniquement | Aucun bump |

## Process de release

1. Bumper la version dans `app.json` (et les `package.json` concernés)
2. Bumper `ios.buildNumber` et `android.versionCode` (entiers strictement croissants)
3. Merger sur `main` via PR depuis `staging`
4. Créer un tag Git :
   ```bash
   git tag v1.2.0
   git push origin v1.2.0
   ```
5. Le workflow GitHub Actions `.github/workflows/release.yml` crée automatiquement la GitHub Release

## Mise à jour de la documentation

À chaque release, vérifier et mettre à jour :

- `docs/user/` — si une feature a changé côté utilisateur
- `docs/dev/` — si l'architecture, le stack ou les ADRs ont évolué
- `CLAUDE.md` — si le workflow de développement a changé

{% hint style="warning" %}
La documentation doit être à jour **avant** de merger sur `main`. Les docs sont versionnées avec le code via git sync GitBook.
{% endhint %}
