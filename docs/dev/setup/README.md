# Démarrage rapide

## Prérequis

- [Bun](https://bun.sh) `>= 1.0`
- [Expo Go](https://expo.dev/go) sur ton téléphone, ou un simulateur iOS/Android

## Installation

```bash
git clone https://github.com/Clement-Muth/deazl-v2.git
cd deazl-v2
bun install
```

## Lancer l'app mobile

```bash
bun mobile
# Scanne le QR code avec Expo Go
```

## Lancer le web

```bash
bun dev
# → http://localhost:3002
```

{% hint style="info" %}
Bun charge automatiquement les fichiers `.env`. Pas besoin de `dotenv`.
{% endhint %}

{% content-ref url="env.md" %}
Variables d'environnement requises
{% endcontent-ref %}
