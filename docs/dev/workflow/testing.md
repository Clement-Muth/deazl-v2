# Tests

## Lancer les tests

```bash
bun test
```

## Ce qui est testé

- **Logique domaine** (`domain/`) — entités, value objects, règles métier. Tests unitaires purs, sans dépendance externe.
- **Use cases** (`application/`) — cas limites, comportements attendus.

## Ce qui n'est pas testé (intentionnellement)

- Les composants UI — trop fragiles, faible valeur ajoutée
- Les adapters infrastructure — couverts par les tests d'intégration Supabase si nécessaire

## Typecheck

```bash
# Mobile
bun run --cwd apps/mobile typecheck

# Web
bun run --cwd apps/web typecheck

# Les deux (lancé par la CI)
bun typecheck
```

{% hint style="info" %}
La CI GitHub Actions lance le typecheck sur chaque PR vers `main`. Un typecheck en échec bloque le merge.
{% endhint %}
