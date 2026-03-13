# Variables d'environnement

## Web (`apps/web/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

## Mobile (`apps/mobile/.env`)

```env
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
```

## Projets Supabase

| Environnement | Projet Supabase |
|---|---|
| Production (`main`) | `sqjfvkmgdyardcbpcwan` |
| Staging (`staging`) | `qccvwajldbzykeekypzc` |

{% hint style="warning" %}
Ne jamais committer de fichiers `.env`. Ils sont dans le `.gitignore`. Les variables de prod sont dans Vercel (côté web) et dans les secrets CI (côté mobile).
{% endhint %}
