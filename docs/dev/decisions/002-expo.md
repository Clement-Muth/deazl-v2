# ADR-002 — Expo (React Native) pour le mobile

## Contexte

L'application Deazl doit tourner sur iOS et Android. L'équipe est composée de développeurs web (React).

## Décision

**Expo** (React Native) avec Expo Router pour le routing file-based. HeroUI Native comme bibliothèque de composants.

## Alternatives évaluées

- **React Native CLI** — plus de contrôle, mais overhead de configuration natif (Xcode, Android Studio) sans valeur ajoutée à ce stade.
- **Capacitor (ancienne approche)** — wrapper autour d'une app Next.js en mode static export. Abandonné : performances médiocres, limitations des API natives, expérience de développement pénible.
- **Flutter** — courbe d'apprentissage importante (Dart), incompatible avec les compétences React de l'équipe.
- **PWA** — pas d'accès App Store / Play Store, pas de notifications push, limites API native.

## Conséquences

- Les développeurs React s'y retrouvent rapidement.
- Expo Go permet de tester sans build natif.
- Expo Router apporte le routing file-based identique à Next.js App Router.
- Les builds de distribution passent par EAS (Expo Application Services).
