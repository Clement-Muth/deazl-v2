# Variables d'environnement

Bun charge automatiquement les fichiers `.env` — pas besoin de `dotenv`.

## Variables requises

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Variables optionnelles

```env
NEXT_PUBLIC_BUILD_TARGET=mobile
```

Active `output: export` dans `next.config.ts` pour le build Capacitor.

## Fichiers `.env`

| Fichier | Usage |
|---|---|
| `.env.local` | Dev local (ignoré par git) |
| `.env.production` | Production (à définir dans le CI/hébergeur) |
