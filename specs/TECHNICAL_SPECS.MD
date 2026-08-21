# Kcalvi — Spécifications techniques

**Version :** 1.0
**Statut :** Version consolidée
**Réfère à :** `Kcalvi_Specifications_Produit_v1.0.md`

Ce document décrit comment Kcalvi est construit techniquement : stack, architecture, structure de dossiers, conventions et outillage. Il ne redéfinit pas les fonctionnalités (voir le spec produit) mais explique comment elles sont implémentées.

---

# 1. Stack technique

| Domaine | Choix |
|---|---|
| Framework | React Native + Expo (workflow bare / dev client — requis par WatermelonDB) |
| Langage | TypeScript (strict) |
| Cible | iOS 18+ |
| Gestionnaire de paquets | npm |
| Navigation | React Navigation |
| Persistance locale | WatermelonDB (requêtes observées, voir §5.3) |
| Cache / état asynchrone (données externes futures) | TanStack Query (installé, non utilisé pour le MVP — voir §5.3) |
| Styling | styled-components |
| Formulaires | React Hook Form |
| Dates | date-fns |
| Animations | React Native Reanimated |
| Icônes | @expo/vector-icons |
| i18n | i18next |
| Tests unitaires/composants | Jest + React Native Testing Library |
| Tests E2E | Maestro |
| Lint / format | ESLint (config Expo) + Prettier + Husky/lint-staged |
| CI | GitHub Actions (lint, typecheck, tests) |
| Build iOS | EAS Build |

Aucun state manager global (Zustand, Redux...) n'est utilisé pour le MVP : WatermelonDB (données persistées, lues via des requêtes observées — §5.3), et l'état local des composants (`useState`) couvrent les besoins actuels. À réévaluer si un état UI global complexe apparaît (ex: filtres partagés entre écrans).

---

# 2. Principes d'architecture

## 2.1 Architecture hybride

Le code partagé (UI kit, logique métier, accès aux données) est organisé **par couche technique**. Le code spécifique à un écran ou un parcours utilisateur est organisé **par feature métier**.

```text
Feature (journal, bibliothèque, recettes...)
        │
        ▼
   domain/ (règles métier pures)
        │
        ▼
   data/ (repositories)
        │
        ▼
   WatermelonDB
```

## 2.2 Séparation stricte des couches

- Les composants et hooks ne parlent jamais directement à WatermelonDB : ils passent par un **repository**.
- Les repositories ne contiennent pas de règles de calcul : ils délèguent au **domain**.
- Le **domain** ne dépend ni de React, ni de WatermelonDB, ni de React Native : ce sont des fonctions et types purs, testables en isolation.

Cette séparation prépare les évolutions décrites dans le spec produit (section 40, 53, 54 — sources de données externes, IA) sans réécriture du journal alimentaire.

---

# 3. Structure de dossiers

```text
kcalvi/
├── app.config.ts
├── src/
│   ├── app/                     # Point d'entrée, RootNavigator, providers globaux
│   │   ├── App.tsx
│   │   ├── RootNavigator.tsx
│   │   └── providers/           # QueryClientProvider, ThemeProvider, ErrorBoundary...
│   │
│   ├── features/                # Un dossier par domaine fonctionnel
│   │   ├── today/                # Écran "Aujourd'hui" (F16, RM04)
│   │   ├── journal/              # Journal alimentaire (F10-F15)
│   │   ├── library/               # Bibliothèque d'aliments (F04-F09)
│   │   ├── recipes/              # Recettes (F08-F09, RM03)
│   │   ├── activity/             # Activité physique (F17, RM05)
│   │   ├── weight/                # Suivi du poids (F25-F27)
│   │   ├── progress/              # Écran Progression, statistiques (F30, F21-F24)
│   │   └── profile/               # Profil et paramètres (F01, F31)
│   │       └── <feature>/
│   │           ├── screens/
│   │           ├── components/
│   │           ├── hooks/
│   │           └── types.ts
│   │
│   ├── domain/                   # Règles métier pures, aucune dépendance React/DB
│   │   ├── calculations/         # RM01-RM13 (conversions, calories nettes, budget hebdo...)
│   │   ├── validation/           # RM14-RM16 (valeurs non négatives, suppression, immutabilité)
│   │   ├── badges/                # F21-F24 (conditions d'attribution des badges/streaks)
│   │   └── types/                 # Types métier partagés (Food, Recipe, DiaryEntry...)
│   │
│   ├── data/
│   │   ├── database/
│   │   │   ├── schema.ts          # Schéma WatermelonDB
│   │   │   ├── migrations.ts
│   │   │   └── models/            # Model classes WatermelonDB (Food, Recipe, DiaryEntry...)
│   │   └── repositories/
│   │       ├── FoodRepository.ts       # Interface
│   │       ├── LocalFoodRepository.ts  # Implémentation WatermelonDB
│   │       ├── ...
│   │       └── index.ts           # Instances singleton exportées
│   │
│   ├── ui/                       # Design system partagé
│   │   ├── theme/                 # Tokens (couleurs, spacing, typography, radius) + ThemeProvider
│   │   ├── Button/
│   │   ├── Text/
│   │   ├── Card/
│   │   └── ...                    # Un dossier par composant (voir §11.1)
│   │
│   ├── navigation/                # Types de navigation, config des stacks/tabs
│   ├── i18n/                      # Config i18next, fichiers de traduction fr.json
│   ├── hooks/                     # Hooks partagés non liés à une feature (ex: useToday)
│   └── utils/                     # Utilitaires génériques (formatage nombres, etc.) — pas de règles métier ici
│
├── __tests__/                     # Tests transverses (ou co-localisés, voir §11.1)
├── .maestro/                      # Flows de tests E2E
├── specs/
└── ...
```

---

# 4. Navigation

React Navigation, structure conforme à la section 20 du spec produit :

```text
RootNavigator
└── BottomTabNavigator
    ├── Aujourd'hui   (Today stack)
    ├── Journal       (Journal stack)
    ├── Bibliothèque  (Library stack)
    └── Progression   (Progress stack)
```

Les réglages et le profil sont accessibles depuis un écran atteint via la tab Progression ou un header, pas via une 5ème tab (cohérent avec « Les réglages sont accessibles depuis le profil » du spec produit §20).

Chaque feature définit son propre stack navigator dans `features/<feature>/navigation.ts` (ou co-localisé si simple), typé avec les types de `src/navigation/`.

---

# 5. Couche de données

## 5.1 WatermelonDB

- Le schéma (`data/database/schema.ts`) reflète le modèle de données du spec produit (§27) : `UserProfile`, `Food`, `Recipe`, `RecipeIngredient`, `DiaryEntry`, `ActivityEntry`, `WeightEntry`, `Badge`.
- **Migrations strictes dès le début** : toute modification de schéma (ajout de champ, nouvelle table) passe par une migration explicite dans `migrations.ts`, y compris en développement. Pas de reset de DB comme raccourci — l'app est testée sur device réel dès le MVP et RM16 (historique immuable) impose une rigueur sur les changements de schéma des données déjà écrites.
- Les model classes (`data/database/models/`) portent uniquement des décorateurs WatermelonDB (`@field`, `@relation`, `@children`) et des accesseurs simples — pas de logique métier.

## 5.2 Repository pattern

Chaque entité expose une interface repository et une implémentation locale :

```ts
// data/repositories/FoodRepository.ts
interface FoodRepository {
  findById(id: string): Promise<Result<Food, DomainError>>;        // lecture ponctuelle
  search(query: string): Observable<Food[]>;                       // requête observée — voir §5.3
  create(input: CreateFoodInput): Promise<Result<Food, DomainError>>;
  update(id: string, input: UpdateFoodInput): Promise<Result<Food, DomainError>>;
  archive(id: string): Promise<Result<void, DomainError>>;
  delete(id: string): Promise<Result<void, DomainError>>;
}
```

```ts
// data/repositories/LocalFoodRepository.ts
class LocalFoodRepository implements FoodRepository { /* ... via WatermelonDB */ }
```

```ts
// data/repositories/index.ts
export const foodRepository: FoodRepository = new LocalFoodRepository(database);
export const recipeRepository: RecipeRepository = new LocalRecipeRepository(database);
// ...
```

Les hooks et composants importent directement ces instances singleton (pas de Context/DI). C'est suffisant tant qu'il n'y a qu'une seule implémentation par repository ; à reconsidérer si le besoin de mocker massivement en test ou de multi-source (V1.1, §40 du spec produit) l'exige.

Les repositories appellent le `domain/` pour :
- valider les données avant écriture (RM14, RM15) ;
- déclencher la réévaluation des badges après une écriture pertinente (§8.3) ;
- ne jamais recalculer rétroactivement une valeur déjà écrite (RM16 — les valeurs nutritionnelles consommées sont copiées dans `DiaryEntry` à la création, jamais dérivées de `Food` à la lecture).

## 5.3 Réactivité

Les méthodes de repository qui alimentent une liste ou un écran affiché retournent un `Observable<T>` (`Query.observe()` de WatermelonDB, réexporté par `@nozbe/watermelondb/utils/rx`) plutôt qu'un `Promise<T>` : toute écriture affectant le résultat déclenche automatiquement une nouvelle émission, donc un re-render, sans code d'invalidation à maintenir. Les lectures ponctuelles (`findById`, utilisé par exemple au chargement initial d'un formulaire d'édition) et les écritures (`create`, `update`, `archive`, `delete`) restent en `Promise`, car il n'y a rien à observer dans la durée pour une action one-shot.

Côté UI, un hook partagé fait le pont avec React :

```ts
// src/hooks/useObservable.ts
function useObservable<T>(observable: Observable<T>, initialValue: T): T { /* ... */ }
```

```ts
const foods = useObservable(foodRepository.search(query), []);
```

**TanStack Query n'est pas utilisé pour ces données locales** : sa proposition de valeur (cache réseau, retry, staleness) ne s'applique pas à une base SQLite locale à latence quasi nulle, et superposer une invalidation de clés manuelle (`['diary', date]`, `['week', weekStart]`...) par-dessus la réactivité déjà native de WatermelonDB duplique un même problème avec deux mécanismes — au prix d'oublis d'invalidation silencieux. La dépendance reste installée : elle redeviendra pertinente pour les sources de données externes prévues en V1.1/V2 (Open Food Facts, providers IA — spec produit §40), qui sont, elles, de vrais appels réseau asynchrones.

---

# 6. Domaine métier (`domain/`)

Fonctions pures, sans I/O, testées unitairement en priorité.

## 6.1 `domain/calculations/`

Une fonction par règle de calcul du spec produit, nommée d'après la règle :

```text
calculateProportionalNutrition(food, quantity)     // RM02
calculateRecipeTotals(recipe, ingredients)          // RM03
calculatePortionNutrition(recipeTotals, servings)   // F09
calculateConsumedCalories(diaryEntries)             // RM04
calculateBurnedCalories(activityEntries)            // RM05
calculateNetCalories(consumed, burned)              // RM06
calculateRemainingCalories(goal, net)                // RM07
calculateWeeklyBudget(dailyGoal)                     // RM09
calculateWeeklyNetConsumption(dailyNets)             // RM10
calculateRemainingWeeklyBudget(budget, consumed)     // RM11
getWeekBoundaries(date)                               // RM12 — lundi → dimanche
```

## 6.2 `domain/validation/`

```text
assertNonNegative(value, field)          // RM14
checkFoodDeletable(food, usages)         // RM15 — retourne les recettes impactées
```

Sans librairie de validation de schéma dédiée (Zod écarté) : ce sont des fonctions custom, appelées par les repositories avant écriture.

## 6.3 `domain/badges/`

Une fonction de condition par badge (F21-F22), pure, prenant en entrée les données du jour/de la semaine et retournant si le badge est gagné. RM13 (gamification responsable) est encodée directement dans ces conditions (ex: un badge n'est jamais plus favorable pour une consommation très inférieure à l'objectif qu'une consommation dans la cible).

---

# 7. Gestion des erreurs

## 7.1 Résultats typés

La logique du domaine et des repositories ne `throw` pas pour les erreurs métier prévisibles — elle retourne un type `Result` :

```ts
type Result<T, E = DomainError> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Exemples d'usage : quantité négative (RM14), suppression d'un aliment utilisé dans une recette (RM15). L'UI consomme le `Result` et affiche le message/la confirmation appropriée (ex: le dialogue Annuler/Archiver/Supprimer quand même de RM15).

## 7.2 Error boundaries

Un `ErrorBoundary` React par tab principale (`app/providers/`) capture les crashes de rendu inattendus (bugs, pas erreurs métier) et affiche un fallback plutôt que de crasher toute l'app.

---

# 8. Règles transverses

## 8.1 Jour courant et fuseau horaire

Le jour du journal change à **minuit, heure locale de l'appareil**. Pas de gestion multi-fuseau — cohérent avec un MVP local-first mono-device.

## 8.2 Formatage des nombres

`Intl.NumberFormat('fr-BE', ...)` pour tout affichage de quantité (kcal, grammes, poids), garantissant les conventions belges/françaises (espace insécable comme séparateur de milliers, ex. « 1 600 kcal »). Pas de fonction de formatage maison.

## 8.3 Déclenchement du calcul des badges

Les badges (F21-F24) sont **réévalués à l'écriture** : chaque écriture pertinente dans le journal ou les activités (via un repository) déclenche une réévaluation des conditions du jour et de la semaine concernés (`domain/badges/`), et écrit en base si une nouvelle condition est remplie. Pas de calcul différé à la lecture de l'écran Progression.

## 8.4 Historique immuable (RM16)

Déjà structurel via le modèle de données (§5.1) : `DiaryEntry` stocke les valeurs nutritionnelles calculées au moment de la saisie, jamais une référence recalculée dynamiquement depuis `Food`.

---

# 9. UI et styling

## 9.1 Thème

`ui/theme/` définit des tokens (couleurs, spacing, typography, radius) injectés via un `ThemeProvider` styled-components. Le support **light/dark** est prévu dès la structure des tokens, même si l'UI n'exploite pas encore le dark mode activement.

## 9.2 Composants

Un dossier par composant, co-localisant styles, logique et tests :

```text
ui/Button/
├── index.tsx
├── Button.styles.ts
├── Button.helpers.ts
└── Button.test.tsx
```

Même convention dans les composants de feature (`features/<feature>/components/`) **et dans les écrans** (`features/<feature>/screens/`) : un écran volumineux se découpe selon les mêmes règles que n'importe quel composant, pas d'exception liée à sa taille.

Règles de lisibilité (humains, hors tests) :

- **Taille du composant.** Le fichier `<Composant>.tsx` (ou `index.tsx`) reste sous ~100 lignes. Au-delà, c'est un signal qu'il faut extraire un sous-composant, déplacer de la logique vers `.helpers.ts`, ou déplacer des styles vers `.styles.ts` — pas d'exception pour les écrans.
- **Styles dans `<Composant>.styles.ts`.** Les styled-components et objets de style du composant vivent dans ce fichier dédié, importés dans le composant. Le fichier du composant ne contient pas de définition de style.
- **Pas de style inline.** Interdit : `<MonComposant style={{ paddingTop: 6 }}>`. Toute valeur de style, même ponctuelle, est nommée et définie dans `<Composant>.styles.ts`.
- **Logique des handlers dans `<Composant>.helpers.ts`.** Un handler (`onPress`, `onSubmit`, callback d'effet...) de plus de 5 lignes est extrait en fonction pure ou en hook dans `<Composant>.helpers.ts`, et importé dans le composant. Le composant ne garde que l'appel du handler, pas son implémentation.
- **Hooks custom locaux au composant.** Un hook qui encapsule de la logique à état (n'existant que pour ce composant, pas réutilisé ailleurs) va aussi dans `<Composant>.helpers.ts` plutôt que dans `hooks/` — `hooks/` (dossier feature) et `src/hooks/` (partagé) restent réservés aux hooks effectivement partagés entre plusieurs composants.

## 9.3 Listes

`FlatList` (React Native natif) pour toutes les listes (bibliothèque, recherche, journal). Pas de dépendance supplémentaire pour le MVP ; à réévaluer si la bibliothèque personnelle devient très volumineuse.

## 9.4 Animations

React Native Reanimated pour les transitions, feedback de badges/streaks et interactions fluides.

## 9.5 Icônes

`@expo/vector-icons`.

## 9.6 Accessibilité

Pas de focus particulier pour le MVP (usage personnel), cohérent avec le hors-périmètre du spec produit. À traiter si l'app devient publique.

---

# 10. Formulaires

React Hook Form pour tous les formulaires (création d'aliment, de recette, profil...). Pas de librairie de validation de schéma dédiée : les règles de validation (champs obligatoires, RM14) sont exprimées via les règles natives de React Hook Form (`register(..., { required, min })`) et, pour les règles inter-champs ou métier, via `domain/validation/` appelé au submit.

---

# 11. Internationalisation

i18next dès le MVP, une seule locale active (`fr`) pour l'instant. Tous les textes UI passent par le système de traduction (`i18n/fr.json`) même si l'anglais n'est pas encore proposé — évite un refactor massif si une seconde langue est ajoutée plus tard.

---

# 12. Configuration d'environnement

`app.config.ts` (TypeScript) plutôt que `app.json` statique, pour permettre de lire des variables d'environnement au build time et préparer les profils EAS Build (dev/preview/prod) — utile dès que V1.1/V2 introduira des clés d'API externes (Open Food Facts, providers IA).

---

# 13. Imports

Alias `@/` configuré via `tsconfig.json` (`paths`) + babel module resolver :

```ts
import { foodRepository } from '@/data/repositories';
import { calculateNetCalories } from '@/domain/calculations';
```

---

# 14. TypeScript

- `strict: true` (déjà activé dans le shell).
- `any` explicite interdit — préférer `unknown` + narrowing.
- Types de retour explicites sur les fonctions publiques (domain, repositories, hooks exportés).
- Types métier partagés dans `domain/types/`, dérivés du modèle de données du spec produit (§27).

---

# 15. Nommage

| Élément | Convention | Exemple |
|---|---|---|
| Composants React | PascalCase | `FoodCard.tsx` |
| Fichiers non-composants | camelCase | `foodRepository.ts`, `useFoodSearch.ts` |
| Types / interfaces métier | PascalCase | `Food`, `DiaryEntry` |
| Fonctions domain | camelCase, verbe explicite | `calculateNetCalories` |

---

# 16. Tests

## 16.1 Unitaires et composants

Jest + React Native Testing Library.

- `domain/` : priorité maximale — chaque règle de calcul (RM01-RM13) et validation (RM14-RM16) est testée unitairement avec des cas limites (quantité 0, dépassement, aliment sans recette associée...).
- Composants UI : tests de rendu et d'interaction pour les composants partagés (`ui/`) et les composants de feature critiques.
- Tests co-localisés avec le code (`Component.test.tsx` dans le dossier du composant).

## 16.2 E2E

Maestro, flows dans `.maestro/`, couvrant les parcours critiques du spec produit (§38, critères d'acceptation du MVP) : créer un aliment, créer une recette, ajouter au journal, encoder une pesée.

---

# 17. Qualité de code

- **ESLint** : config Expo officielle (règles React / React Native / hooks).
- **Prettier** : formatage automatique, indépendant du lint.
- **Husky + lint-staged** : pre-commit hook bloquant si lint/format échouent.

---

# 18. CI/CD

GitHub Actions sur push/PR vers `master` :

```text
1. Install (npm ci)
2. Lint (eslint)
3. Typecheck (tsc --noEmit)
4. Tests (jest)
```

EAS Build pour les builds iOS (test sur device réel / TestFlight), déclenché manuellement ou via profils EAS dédiés (dev/preview/prod), en s'appuyant sur `app.config.ts` (§12).

---

# 19. Workflow Git

- **Branche de base** : `master`.
- Branches de travail : `feature/<nom-feature>`, mergées via Pull Request.
- **Conventional Commits** : `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`... — historique lisible, changelog générable automatiquement si besoin plus tard.

---

# 20. Points ouverts / à décider plus tard

- **Données de seed/fixtures pour le développement** : pas encore tranché — à revisiter quand la saisie manuelle répétée en dev devient pénible.
- **Interface `MealRecognitionProvider` (IA, V2)** : non scaffoldée maintenant, sera définie au moment d'attaquer la V2 (spec produit §54). Le repository pattern déjà en place (§5.2) garde la porte ouverte sans réécriture.
- **Dark mode actif dans l'UI** : les tokens le supportent (§9.1) mais l'implémentation effective dans les écrans n'est pas priorisée pour le MVP.
