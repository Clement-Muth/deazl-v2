# Conventions de code

## Règles générales

- **Zéro commentaire** dans le code. Si le code a besoin d'un commentaire pour être compris, c'est qu'il faut le réécrire.
- **TypeScript strict** partout — pas de `any`, pas de `as unknown as`.
- **Server Components par défaut** côté web — `"use client"` uniquement si nécessaire (événements, state, hooks).
- **SRP** — un composant = une responsabilité. Si un fichier dépasse ~150 lignes, c'est le signe qu'il faut découper.

## Nommage

| Contexte | Convention | Exemple |
|---|---|---|
| Fichiers dans `applications/` | camelCase | `useCases/`, `shoppingScreen.tsx` |
| Composants React | PascalCase | `ItemDetailSheet` |
| Hooks | camelCase avec `use` | `useShoppingItems` |
| Tables SQL | snake_case | `meal_plan_items` |
| Variables Tailwind | classes directes | `bg-primary` |

## HeroUI Native

Toujours utiliser HeroUI pour les composants UI mobiles. Ne jamais créer un composant custom quand HeroUI en a un équivalent.

```tsx
// ✅ Bien
import { Button } from "heroui-native"
<Button onPress={handlePress}>Valider</Button>

// ❌ Mal
<Pressable onPress={handlePress}>
  <Text>Valider</Text>
</Pressable>
```

**Exception unique** : le `BottomSheet` de HeroUI est remplacé par `BottomModal` (`src/shared/components/bottomModal.tsx`).

## Internationalisation

Lingui.js est obligatoire — tout texte UI doit être wrappé.

```tsx
// Server Components / fichiers .tsx serveur
import { Trans, t } from "@lingui/macro"
<Trans>Mes recettes</Trans>
placeholder={t`Rechercher…`}

// Client Components ("use client")
import { Trans } from "@lingui/react/macro"
<Trans>Mes recettes</Trans>
```
