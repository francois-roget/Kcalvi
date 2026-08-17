# Handoff : Kcalvi — UI Kit et écrans du MVP

## Overview
Kcalvi est une app iOS de suivi calorique local-first (React Native + Expo, TypeScript strict, WatermelonDB).
Ce paquet contient le design system et l'ensemble des écrans du MVP : onboarding, Aujourd'hui, Journal,
Bibliothèque, Recettes, Ajout d'aliment, Activité, Pesée, Budget semaine, Badges, Progression, Réglages,
plus les états vides. Il se lit avec les deux specs déjà présentes dans le repo :
`Kcalvi_Specifications_Produit_v1.0.md` (fonctionnel) et `TECHNICAL_SPECS.MD` (stack et architecture).

## About the Design Files
Les fichiers HTML de ce paquet sont des **références de design**, pas du code de production.
Ils montrent l'apparence et le comportement attendus. Le travail consiste à **recréer ces écrans en
React Native** dans la structure décrite par `TECHNICAL_SPECS.MD` (`src/ui/` pour le design system,
`src/features/<feature>/screens|components` pour les écrans), avec styled-components + les tokens du §
« Design Tokens » ci-dessous. Ne pas porter le HTML/CSS tel quel, ne pas introduire de librairie UI tierce.

## Fidelity
**High-fidelity.** Couleurs, typographie, espacements, rayons et ombres sont définitifs et doivent être
repris au pixel. Les données affichées sont des exemples réalistes, pas des contenus figés.

## Design Tokens
Voir `theme.ts` (prêt à copier dans `src/ui/theme/`). Résumé :

### Couleurs
| Token | Hex | Usage |
|---|---|---|
| ink.900 | #0F2231 | Fond onboarding, tuiles internes des cartes sombres |
| ink.800 | #17303D | HeroCard, texte principal |
| ink.700 | #264A5C | Piste des jauges sur fond sombre, séparateurs sur ink |
| azure.600 | #1C86C4 | Accent primaire sur fond clair, liens, protéines |
| azure.400 | #4FB0E8 | Accent sur fond sombre (jauge, courbe, valeurs) |
| azure.300 | #8FC3E0 | Jour / semaine en cours |
| azure.100 | #DCEAF2 | Carte budget semaine, tuile statistique claire |
| azure.050 | #F1F7FB | Repas vide, encadré informatif (bordure #D3E5F0) |
| terracotta.600 | #C4643C | Action principale, dépassement d'objectif |
| terracotta.300 | #E8A88A | Calories brûlées, ligne de poids cible |
| terracotta.100 | #F6E5DC | Carte activité, badge de série |
| olive.500 | #7B8C6A | Lipides |
| sand.100 | #FDFBF7 | Fond d'écran |
| sand.200 | #F4EFE7 | Éléments désactivés / verrouillés |
| sand.300 | #F1EDE5 | Bouton secondaire, champ de recherche, séparateurs |
| sand.400 | #EDE8DF | Piste de barre de macro, bordure de tab bar |
| border.default | #E9E3D8 | Bordure de champ de saisie |
| border.subtle | #F1EDE5 | Séparateur de ligne dans une carte |
| border.dashed | #DCD5C8 | Encadré pointillé (raccourcis) |
| text.primary | #17303D | |
| text.secondary | #6E7C86 | |
| text.tertiary | #8A9AA5 | Libellés, légendes |
| text.quaternary | #A6B2BB | Onglets inactifs, unités |
| text.disabled | #C0C9CF | Jour futur, chevrons |
| onDark.primary | #FFFFFF | |
| onDark.muted | #8FB4C7 | Texte secondaire sur ink.800 |
| onDark.subtle | #6E8798 | Libellés sur ink.900 |

### Typographie — Manrope (400/500/600/700/800)
| Token | Taille / poids / interlettrage |
|---|---|
| display | 40 / 800 / −1.4 |
| stat | 32 / 800 / −1 |
| h1 | 24 / 800 / −0.4 |
| h2 | 18 / 800 / 0 |
| title | 16 / 800 / 0 |
| body | 14 / 600 / 0 |
| bodySm | 13.5 / 600 / 0 |
| caption | 12 / 600 / 0 |
| overline | 11 / 700 / +1.2 / majuscules |
| micro | 10.5 / 600 / 0 |

### Espacement
4, 8, 12, 14, 16, 18, 22, 26 (échelle 1→8). Padding horizontal d'écran : 22. Gap vertical entre blocs : 10–12.

### Rayons
sm 12 · md 14 · lg 16 · xl 18 · 2xl 20 · 3xl 24 · 4xl 28 · pill 999.

### Ombres (iOS)
- card : offset (0,1), radius 8, couleur #17303D, opacité .05
- raised : offset (0,2), radius 12, couleur #17303D, opacité .05
- sheet : offset (0,−6), radius 24, couleur #17303D, opacité .16

## Screens / Views
Voir `screens.md` — un bloc par écran : rôle, layout, composants, copie exacte, et la feature
(`src/features/…`) où l'implémenter.

## Components
Voir `components.md` — inventaire de `src/ui/` et des composants de feature, avec props et états.

## Interactions & Behavior
Voir `interactions.md` — navigation, animations (Reanimated), états vides, erreurs, validations.

## State Management
Aucun state manager global (conforme au §1 des specs techniques) :
- données persistées : WatermelonDB via repositories (`src/data/repositories`) ;
- lecture : requêtes observées (`repository.search(...): Observable<T>` + hook `useObservable`,
  voir TECHNICAL_SPECS.MD §5.3) — pas de TanStack Query ni de clés à invalider pour les données locales ;
- état local d'écran : `useState` (quantité en cours de saisie, filtre de recherche, plage 30/90 jours,
  brouillon de pesée, type et durée d'activité) ;
- calculs : `src/domain/calculations` — l'UI n'additionne jamais elle-même (voir `interactions.md`).

## Divergence à trancher
Le prototype affiche 5 onglets (Aujourd'hui, Journal, Bibliothèque, Progression, Réglages), alors que
`TECHNICAL_SPECS.MD` §4 prévoit 4 onglets avec les réglages atteints depuis Progression.
**Implémenter la version des specs techniques** : 4 onglets, et une icône d'accès aux réglages dans le
header de l'écran Progression. L'écran Réglages lui-même reste identique au design.

## Assets
Aucune image. Police Manrope (Google Fonts) à charger via `expo-font`. Icônes : `@expo/vector-icons`
(Feather ou Ionicons) pour chevron, étoile, plus, retour, réglages — le design n'utilise volontairement
aucune illustration ni emoji.

## Files
- `Kcalvi UI Kit.dc.html` — design system : tokens, composants, règles d'usage
- `Kcalvi ecrans.dc.html` — les 19 écrans statiques (référence visuelle définitive)
- `Kcalvi Prototype.dc.html` — prototype interactif (référence de comportement : navigation, calculs, toasts)
- `theme.ts` — tokens prêts à copier dans `src/ui/theme/`
- `components.md`, `screens.md`, `interactions.md`

Ouvrir les fichiers HTML dans un navigateur ; le prototype est cliquable.
