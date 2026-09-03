# Sprint 3 — Détail des tickets

**Sprint :** Journal alimentaire (boucle cœur)
**Réfère à :** `SPRINTS.MD` (Sprint 3), `Kcalvi_Specifications_Produit_v1.0.md` (F10-F14, RM02, RM04,
RM14, RM16), `design_handoff_kcalvi/screens.md` (2a, 2b, 2h, 2i, 2s),
`design_handoff_kcalvi/components.md` et `interactions.md`
**Numérotation :** reprend après `SPRINT2-IMPROVEMENTS.md` (KCAL-152 → 165), donc **KCAL-166 →
KCAL-200**
**Capacité supposée :** ~55h sur 2 semaines (rythme freelance solo)

État de départ, vérifié dans le code :

- `TodayScreen` (29 lignes) et `JournalScreen` (15 lignes) sont des squelettes : le premier n'affiche
  que la salutation issue de `profileRepository.observe()`, le second qu'un titre. Aucun
  `AddEntryScreen` ni `QuantitySheet` n'existe.
- Aucun repository `DiaryEntry`. `src/data/repositories/index.ts` porte déjà le commentaire prévoyant
  les suivants (« DiaryEntry, ActivityEntry, WeightEntry, Badge »).
- La table `diary_entries` **existe déjà** au schéma (`version: 5`), avec `date` indexée, `meal_type`,
  `food_id`/`recipe_id` optionnels indexés, `quantity`, `unit`, les 4 valeurs nutritionnelles et
  `created_at`. Le modèle `DiaryEntry.ts` et le type domaine `DiaryEntry` existent aussi.
- `domain/calculations` fournit déjà `calculateProportionalNutrition` (RM02),
  `calculateConsumedCalories` (RM04), `calculateRecipeTotals` (RM03), `calculatePortionNutrition`
  (F09), `calculateRemainingCalories` (RM07) et `getWeekBoundaries` (RM12). **Aucune de ces fonctions
  n'est à réécrire.**
- `domain/validation` fournit `assertNonNegative` (RM14).
- Côté UI, `BottomSheet` (avec `minHeightRatio`, KCAL-160), `QuickPortionButton`, `SearchField` (avec
  bouton d'effacement, KCAL-156), `NumberField`, `ArcGauge`, `HeroCard`, `MacroCard`, `StatTile`,
  `ListCard`/`ListRow`, `Chip`, `Toggle`, `Toast` + `ToastProvider` sont livrés. Il **manque**
  `EmptyState` (le Sprint 1 a fait un `LibraryEmptyState` local) et les composants de feature
  `TodayHeader`, `MealCard`, `DayStrip`, `MealSection`.

Ce sprint est donc : **une migration de schéma, un repository complet, deux écrans neufs, deux écrans
squelettes à remplir, et la première boucle d'écriture de l'application.** C'est le point de
convergence annoncé dans les notes de PM de `SPRINTS.MD` — voir la section « Risque de séquencement »
en fin de document, qui le chiffre.

---

## Frontière de scope (ce que le Sprint 3 ne fait PAS)

Trois éléments présents dans les maquettes appartiennent explicitement au **Sprint 4** et ne doivent
pas déborder ici :

| Élément de maquette | Feature | Traitement Sprint 3 |
|---|---|---|
| Chip « Récents » sur 2h | F07 | **Non affichée.** Voir décision ci-dessous. |
| Encadré pointillé « Copier le dîner d'hier » (bas de 2h) | F15 | Non rendu du tout. |
| Carte « Reprendre plus vite » de l'état vide 2s | F15 | Non rendue. |
| Navigation calendrier hier/demain/date précise sur 2b | F28-F29 | Hors périmètre — voir décision `DayStrip`. |

Trois autres éléments appartiennent à des sprints plus lointains :

| Élément de maquette | Feature | Traitement Sprint 3 |
|---|---|---|
| Badge de série « 5 jours » du `TodayHeader` | F23 (Sprint 7) | Non rendu. |
| `WeeklyBudgetCard` en bas de 2a | F18-F20 (Sprint 6) | Non rendue. |
| StatTile « Brûlé » cliquable → 2m, section Activité de 2b | F17 (Sprint 5) | Rendus à 0, non cliquables. |
| Réévaluation des badges à l'écriture (`TECHNICAL_SPECS.MD` §8.3) | F21-F24 (Sprint 7) | **Aucun point d'accroche spéculatif** n'est posé dans le repository. |

---

## Décisions prises (stand-up)

### 1. La chip « Récents » n'est pas affichée du tout (plutôt que grisée)

Le Sprint 1 (KCAL-108) et le Sprint 2 (KCAL-141) ont posé le précédent du « bouton affiché mais
désactivé ». Il ne s'applique pas ici : `interactions.md` fait de « Récents » **la liste par défaut**
de 2h. Une chip par défaut désactivée ouvrirait l'écran d'ajout — l'écran le plus critique de l'app —
sur une liste vide. Le Sprint 3 affiche donc trois chips (★ Favoris / Aliments / Recettes) avec
**Aliments** sélectionnée par défaut ; le Sprint 4 insère « Récents » en tête et en fait le défaut.

### 2. `DiaryEntry` fige aussi le **libellé** de ce qui a été consommé, pas seulement les valeurs

RM16 et `TECHNICAL_SPECS.MD` §8.4 ne parlent que des valeurs nutritionnelles, déjà copiées par le
modèle de données. Mais l'écran 2b affiche le **nom** de chaque entrée, et il n'existe aucune colonne
pour le porter : il faudrait le relire via `food_id`/`recipe_id`. Deux conséquences :

- Un aliment supprimé (la branche « Supprimer quand même » de RM15, bien réelle depuis KCAL-153)
  laisserait des lignes de journal sans nom, dans un historique censé être immuable.
- Afficher N lignes exigerait N lectures `Food`/`Recipe` par jour affiché — le N+1 que KCAL-158 a déjà
  dû traiter côté bibliothèque avec `getRecipesCalories`.

**Décision : ajouter une colonne `label` à `diary_entries`, remplie à l'écriture** avec le nom de
l'aliment ou de la recette. L'affichage du journal devient une lecture d'une seule table, sans
jointure ni helper de batching — donc **on ne construit pas d'équivalent `getRecipesCalories` pour le
journal**, il serait sans objet. C'est l'esprit de la dernière règle d'`interactions.md` (« Dériver
une valeur consommée depuis `Food` à l'affichage → les valeurs sont figées dans `DiaryEntry` »)
étendu au libellé.

### 3. La date d'une entrée est normalisée à minuit local à l'écriture

`diary_entries.date` est un timestamp (`number`, indexé). Sans convention, deux entrées du même jour
saisies à 8h et 20h portent deux timestamps différents et aucune requête d'égalité ne les regroupe.
**Décision : la couche repository normalise systématiquement à `startOfDay(date)` (heure locale de
l'appareil, `TECHNICAL_SPECS.MD` §8.1) avant écriture**, et la lecture utilise malgré tout une requête
**par intervalle** `Q.between(startOfDay, endOfDay)` plutôt qu'une égalité — pour qu'une ligne écrite
par un futur chemin de code non normalisé reste visible plutôt que de disparaître silencieusement du
journal. L'heure de saisie reste disponible via `created_at`.

### 4. Sur 2b, un tap sur une ligne ouvre une feuille d'actions, il ne supprime pas directement

`screens.md` (2b) dit « Tap sur une ligne = suppression (toast) » et `interactions.md` dit « tap sur
la ligne → confirmation native (Alert) puis retrait ». Mais F14 exige **trois** actions : modifier la
quantité, changer de repas, supprimer — et la maquette n'offre aucun autre point d'entrée pour les
deux premières. **Décision : le tap ouvre une feuille d'actions** (Modifier la quantité / Changer de
repas / Supprimer), sur le patron `DeleteFoodSheet` / `ArchiveRecipeSheet` déjà en place dans
`LibraryScreen` depuis le Sprint 2. La suppression garde sa confirmation et son toast. C'est un écart
assumé vis-à-vis du handoff, à reporter dans `screens.md` en clôture de sprint — même traitement que
KCAL-156 / 159 / 161 au Sprint 2.

### 5. `QuickPortionButton` sur 2i : les portions viennent de `food.portions`, pas d'un barème fixe

La maquette 2i prévoit « 3 QuickPortionButton (valeur médiane présélectionnée) ». Depuis KCAL-163, les
portions d'un aliment sont des lignes `food_portions` nommées par l'utilisateur, en nombre variable
(0 à N). **Décision :** afficher les 3 premières portions triées par `position`, présélectionner celle
du milieu quand il y en a 3, la première sinon ; **si l'aliment n'a aucune portion**, n'afficher aucun
bouton et présélectionner `food.referenceQuantity`. Pas de barème 50/100/150 inventé.

### 6. Une entrée « recette » se saisit en nombre de portions

RM02 (`calculateProportionalNutrition`) prend un `Food` et n'a aucune notion d'unité : elle ne sait
pas traiter une recette. Pour une recette, la valeur unitaire est celle d'une portion
(`calculateRecipeTotals` puis `calculatePortionNutrition`, déjà écrites au Sprint 2), qu'il faut
multiplier par le nombre de portions consommées. Aucune fonction du domaine ne fait cette
multiplication. **Décision :** ajouter une fonction pure `multiplyNutrition(values, factor)` dans
`domain/calculations` (KCAL-171) plutôt que de détourner `calculatePortionNutrition` avec un diviseur
calculé — ce serait le même genre de conversion implicite que le Sprint 2 a dû documenter longuement
pour ne pas le réintroduire. `DiaryEntry.unit` vaut alors `'portion'`.

### 7. `AddEntryScreen` est enregistré dans les deux stacks (Today et Journal)

`interactions.md` place `AddEntryScreen` en modale dans le stack Today **et** dans le stack Journal.
Deux options : hisser l'écran dans un stack modal racine (refonte de `RootNavigator`), ou déclarer la
route deux fois. **Décision : déclarer la route dans les deux `ParamList`**, sans toucher à
l'architecture de navigation existante. Coût : un type de route dupliqué. Bénéfice : aucun
refactoring du navigateur racine dans le sprint le plus chargé du projet. Le `QuantitySheet` est un
composant rendu **par** `AddEntryScreen`, pas une route — il est donc partagé sans effort.

### 8. Pas de `FoodSearchList` partagé bibliothèque/journal ce sprint

`components.md` annonce un `FoodSearchList` partagé entre `library` et `journal`. Dans les faits, le
`FoodListItem` du Sprint 1 porte un ★ basculable et une action destructive, là où l'item de 2h porte
un bouton « + » et rien de destructif : la mise en commun produirait un composant à props
conditionnelles plutôt qu'une abstraction. **Décision : l'écran d'ajout écrit son propre item.** À
réévaluer si un troisième consommateur apparaît — pas avant. Écart à reporter dans `components.md`.

---

## A. Couche de données `DiaryEntry`

| Ticket | Description | Fichiers | Estimation |
|---|---|---|---|
| KCAL-166 | Migration `v5 → v6` de `diary_entries` : `label` (string), `portion_id` (string, optionnel, indexé), `updated_at` (number) — voir cadrage ci-dessous | `src/data/database/schema.ts`, `src/data/database/migrations.ts`, `src/data/database/models/DiaryEntry.ts`, `src/domain/types/entities.ts` | 2h |
| KCAL-167 | Interface `DiaryEntryRepository` : `CreateDiaryEntryInput`, `UpdateDiaryEntryInput`, `findById`, `observeByDate(date)`, `create`, `update`, `delete` — même patron que `FoodRepository.ts` / `RecipeRepository.ts` | `src/data/repositories/DiaryEntryRepository.ts` | 2h |
| KCAL-168 | `LocalDiaryEntryRepository` + `toDomainDiaryEntry` dans `mapping.ts` (avec `optional()` sur `food_id`, `recipe_id`, `portion_id`) | `src/data/repositories/LocalDiaryEntryRepository.ts`, `src/data/repositories/mapping.ts` | 4h |
| KCAL-169 | Normalisation du jour à l'écriture (`startOfDay`, heure locale) + `observeByDate` en requête d'intervalle | idem KCAL-168 | 2h |
| KCAL-170 | Enregistrer `diaryEntryRepository` dans `index.ts` ; exporter `MEAL_TYPES: MealType[]` (ordre F10) depuis `domain/types` ; clés i18n `meals.*` | `src/data/repositories/index.ts`, `src/domain/types/entities.ts`, `src/i18n/fr.json` | 1h |
| KCAL-171 | Fonction pure `multiplyNutrition(values, factor)` dans `domain/calculations` (cf. décision 6) | `src/domain/calculations/index.ts` | 1h |

**Cadrage KCAL-166.** Les trois colonnes correspondent à trois besoins distincts :

- `label` — décision 2 ci-dessus.
- `portion_id` — même rôle que sur `recipe_ingredients` depuis KCAL-163d : savoir que l'utilisateur a
  saisi « 2 pots » et pas « 300 g », pour réafficher son unité de saisie dans le journal et en mode
  édition (KCAL-192). Optionnel, et **potentiellement pendant** si la portion est supprimée ensuite —
  à résoudre défensivement, exactement comme le commentaire de `RecipeIngredient.portionId` le
  documente déjà.
- `updated_at` — F14 permet de modifier une entrée ; le modèle n'a aujourd'hui qu'un `created_at` en
  `@readonly`. WatermelonDB gère automatiquement les deux dès que les deux décorateurs sont présents.

**Pas de backfill SQL, et c'est délibéré.** Les migrations v4 et v5 ont dû normaliser les lignes
existantes (`addColumns` remplit à `NULL`, la classe de bug de KCAL-152). Ici, `diary_entries` est
**vide sur tous les appareils** : aucun code n'a jamais écrit dans cette table, elle n'existe qu'au
schéma depuis le Sprint 0. Écrire l'absence de backfill explicitement dans le commentaire de la
migration, pour qu'une relecture ne la prenne pas pour un oubli.

**Cadrage KCAL-167 — la forme de `CreateDiaryEntryInput`.** Une entrée référence soit un aliment,
soit une recette, jamais les deux, jamais aucun. Plutôt qu'un contrôle à l'exécution renvoyant un
`Result` d'erreur, typer la source en union discriminée :

```ts
type DiaryEntrySource =
  | { kind: 'food'; foodId: string; portionId?: string }
  | { kind: 'recipe'; recipeId: string };
```

L'état invalide devient non représentable ; il n'y a pas de code d'erreur à traduire côté UI pour un
cas que le compilateur interdit. `create` reste néanmoins en `Result` pour RM14 (`assertNonNegative`
sur `quantity` et sur les 4 valeurs nutritionnelles, patron `assertIngredientsValid` de
`LocalRecipeRepository`).

**Pièges identifiés sur KCAL-168 :**

- `DiaryEntry.mealType` est un `string` côté modèle WatermelonDB et un `MealType` (union) côté
  domaine. Le mapper doit rétrécir explicitement (constante `MEAL_TYPES` + repli sur `'SNACK'` avec
  un commentaire), pas caster en aveugle.
- `food_id`, `recipe_id` et `portion_id` sont trois colonnes optionnelles : **les trois passent par
  `optional()`**. C'est la classe de bug de KCAL-152, et c'est la seule raison pour laquelle
  `mapping.ts` existe.
- `create` écrit **les valeurs déjà calculées**, il ne recalcule rien. Le repository ne doit importer
  aucune fonction de `domain/calculations` : le calcul appartient au `QuantitySheet` (RM02), le
  repository ne fait que persister le résultat (RM16). Le commenter dans le fichier.

---

## B. `AddEntryScreen` (2h)

| Ticket | Description | Fichiers | Estimation |
|---|---|---|---|
| KCAL-172 | Route `AddEntry` (`{ mealType, date }`) ajoutée à `TodayStackParamList` **et** `JournalStackParamList` (cf. décision 7), présentation modale, entrées dans les deux navigateurs | `src/navigation/types.ts`, `src/features/today/navigation.tsx`, `src/features/journal/navigation.tsx` | 2h |
| KCAL-173 | Layout + header « Annuler / Ajouter au \<repas\> / Créer » (→ `FoodForm`) | `src/features/journal/screens/AddEntryScreen/` | 2h |
| KCAL-174 | `SearchField` (avec `onClear`) + chips ★ Favoris / Aliments / Recettes, branchées sur `foodRepository.search()` et `recipeRepository.search()` observés | idem | 3h |
| KCAL-175 | Liste de résultats : nom + ★, ligne de référence via `foodKcalLabel`, bouton « + » ; kcal par portion des recettes via `getRecipesCalories` | idem | 3h |
| KCAL-176 | Recherche sans résultat : « Aucun résultat » + « Créer cet aliment » (navigue vers `FoodForm` en préremplissant le nom cherché) | idem | 2h |

**Cadrage.** L'écran est un quasi-jumeau fonctionnel de `LibraryScreen` : reprendre son
`useDebouncedValue` (250 ms, KCAL-103) et surtout son patron d'`Observable` mémoïsé sur la seule
requête débouncée — `foodRepository.search()` construit une nouvelle requête observée à chaque appel,
et sans `useMemo` l'écran se réabonne à chaque frappe. `foodKcalLabel` (KCAL-158) et `unitLabel`
(`@/utils/format`) sont réutilisés tels quels, pas réécrits.

**Piège KCAL-175.** `getRecipesCalories` est déjà en place et fait le travail en 2 requêtes pour tout
le lot ; ne pas se laisser tenter par un calcul par carte dans le rendu de la `FlatList`.

**Piège KCAL-176.** Le préremplissage du nom implique d'étendre les params de la route `FoodForm`
(aujourd'hui `{ foodId } | undefined`). Ajouter un champ optionnel `initialName` plutôt qu'un
troisième mode : le formulaire reste en création, avec un champ prérempli.

**Découpage (`TECHNICAL_SPECS.MD` §9.2).** L'écran dépassera largement les ~100 lignes : le prévoir
dès le départ en sous-dossiers (`AddEntryHeader/`, `EntryFilterBar/`, `EntryResultList/`,
`EntryResultItem/`, `AddEntryScreen.helpers.ts`), sur le modèle du `LibraryScreen/` du Sprint 2 — pas
un gros fichier à découper après coup.

---

## C. `QuantitySheet` (2i)

| Ticket | Description | Fichiers | Estimation |
|---|---|---|---|
| KCAL-177 | Feuille sur `BottomSheet` (avec `minHeightRatio`, précédent KCAL-160) : nom + ligne de référence, kcal calculées à droite | `src/features/journal/components/QuantitySheet/` | 3h |
| KCAL-178 | Champ quantité + unité, recalcul RM02 (`calculateProportionalNutrition`) **à chaque frappe**, ligne P / G / L à une décimale (`formatDecimal`, nowrap) | idem | 3h |
| KCAL-179 | `QuickPortionButton` depuis `food.portions`, présélection médiane, repli sans portion (cf. décision 5) — **charge les portions via `foodRepository.findById`** | idem | 3h |
| KCAL-180 | Mode recette : quantité = nombre de portions, valeur unitaire via `calculateRecipeTotals` + `calculatePortionNutrition`, total via `multiplyNutrition` (KCAL-171) | idem | 3h |
| KCAL-181 | Toggle « Ajouter aux favoris », validation RM14 au submit, écriture `diaryEntryRepository.create` (valeurs + `label` copiés, RM16), `Toast` « \<aliment\> · \<kcal\> kcal ajoutées », fermeture et retour | idem | 3h |

**Piège majeur — KCAL-179.** `foodRepository.search()` renvoie délibérément `portions: []`
(KCAL-163b : charger les portions dans la recherche empilerait un second N+1 sur celui que KCAL-158
venait de résoudre). Le `Food` que 2h passe à la feuille **n'a donc jamais ses portions**. Sans
`findById`, la feuille s'affiche sans aucun bouton de portion rapide pour tous les aliments — un bug
silencieux, cohérent en apparence avec le repli « aliment sans portion » de la décision 5. Charger
les portions à l'ouverture de la feuille, et le tester (KCAL-197).

**Piège KCAL-178.** La saisie passe par un clavier décimal : la touche décimale produit une virgule en
fr-BE. Utiliser `parseLocaleNumber` (`@/utils/format`), déjà écrit — `Number('82,5')` vaut `NaN`.

**Piège KCAL-179 / KCAL-180 — l'invariant du Sprint 2, toujours valable.** `QuickPortionButton` doit
écrire une quantité **déjà convertie en unité de référence** via `convertPortionToReferenceQuantity`,
jamais un nombre de portions brut : `calculateProportionalNutrition` ne connaît aucune unité et
mélangerait deux dimensions dans son ratio. Le commentaire de cette fonction dans
`domain/calculations` le dit déjà — le respecter, et poser `portionId` en base pour l'affichage.
Le mode recette (KCAL-180) est le seul cas où `quantity` n'est pas en unité de référence : c'est un
nombre de portions, avec `unit = 'portion'`, et il ne passe jamais par RM02.

**Cadrage KCAL-181.** Un seul `create` par validation, avec `label` = nom de l'aliment ou de la
recette au moment de la saisie. Ne poser **aucun** point d'accroche pour la réévaluation des badges
(§8.3) : c'est le Sprint 7, et un hameçon vide ajouté « au cas où » est exactement le genre de code
mort que le Sprint 2 a dû nettoyer (`library.sections.recipesComingSoon`).

---

## D. `TodayScreen` (2a) réel

| Ticket | Description | Fichiers | Estimation |
|---|---|---|---|
| KCAL-182 | `TodayHeader` : salutation (existante) + date en overline — **sans** le badge de série (F23, Sprint 7) | `src/features/today/components/TodayHeader/` | 2h |
| KCAL-183 | `HeroCard` : `ArcGauge` consommé / objectif + 3 `StatTile` (Consommé via `calculateConsumedCalories` RM04, Brûlé à 0, Restant via `calculateRemainingCalories` RM07) | `src/features/today/screens/TodayScreen/` | 3h |
| KCAL-184 | Trois `MacroCard` : agrégation P / G / L des entrées du jour face aux objectifs du profil | idem | 2h |
| KCAL-185 | Section « Repas » : 4 `MealCard` (titre, résumé des entrées, total kcal, état vide), tap → `AddEntry` préfiltré sur ce repas ; « Tout voir » → onglet Journal | `src/features/today/components/MealCard/`, idem | 3h |
| KCAL-186 | État vide journée (2s) : `ArcGauge` à 0, « Journée à démarrer », 4 `MealCard` en état vide — **sans** la carte « Reprendre plus vite » (F15, Sprint 4) | idem | 2h |

**Cadrage KCAL-183.** Le « Brûlé » vaut 0 tant que `ActivityRepository` n'existe pas (Sprint 5), donc
`calculateRemainingCalories(goal, net)` avec `net = consommé` donne le bon résultat sans cas
particulier — inutile de court-circuiter la fonction du domaine. La tuile « Brûlé » est rendue mais
non cliquable (2m n'existe pas). Règle d'`interactions.md` à respecter : dès que le consommé dépasse
l'objectif, la jauge et le total passent en `terracotta.600`.

**Cadrage KCAL-184.** L'agrégation des macros du jour est une somme sur les entrées — même nature que
RM04, mais aucune fonction du domaine ne la fait pour les 3 macros. Deux options : trois `reduce` dans
l'écran (interdit par `interactions.md`, « l'UI n'additionne jamais des kcal ou des macros elle-même »)
ou une fonction pure. **Faire la fonction pure** `calculateConsumedNutrition(entries): NutritionValues`
dans `domain/calculations`, dont `calculateConsumedCalories` devient un cas particulier — coût inclus
dans l'estimation du ticket.

**Cadrage KCAL-185.** Un seul `observeByDate(today)` en tête d'écran, mémoïsé sur la date ; les
`MealCard` reçoivent leur sous-liste par filtrage en mémoire (patron KCAL-104 du Sprint 1). Pas quatre
abonnements.

---

## E. `JournalScreen` (2b) réel

| Ticket | Description | Fichiers | Estimation |
|---|---|---|---|
| KCAL-187 | Layout titre « Journal » + mois, `DayStrip` de la semaine courante (`getWeekBoundaries`, RM12), sélection d'un jour **dans la semaine affichée** | `src/features/journal/components/DayStrip/`, `src/features/journal/screens/JournalScreen/` | 3h |
| KCAL-188 | `HeroCard` du jour sélectionné : date, kcal / objectif, pill de statut (« Dans la cible » / « Au-dessus ») | idem | 2h |
| KCAL-189 | `MealSection` × 4 : titre overline + total à droite, `ListCard` des entrées du repas, action « + Ajouter » → `AddEntry` | `src/features/journal/components/MealSection/`, idem | 3h |
| KCAL-190 | Section « Activité » : rendue à 0 kcal, non interactive (Sprint 5) + note de bas d'écran | idem | 1h |

**Décision de scope — KCAL-187.** La `DayStrip` est explicitement listée au Sprint 3 dans `SPRINTS.MD`,
alors que la navigation calendrier (F28-F29 : hier/demain/date précise, vue mensuelle, indicateur de
jour rempli) est listée au Sprint 4. La coupe retenue : **le `DayStrip` affiche la semaine courante et
permet d'en sélectionner un jour** ; il n'y a aucun moyen d'atteindre une autre semaine, ni de saisir
une date, ni d'indicateur ✓ par jour. Sélectionner un jour passé revient à changer l'argument de
`observeByDate` — le point d'extension F28 est donc déjà en place sans en écrire une ligne.

**Cadrage KCAL-188.** L'objectif vient de `profileRepository.observe()` (déjà utilisé par
`TodayScreen`). Bascule « Dans la cible » / « Au-dessus » sur le même seuil que la jauge de KCAL-183 —
extraire le prédicat dans un helper partagé plutôt que de dupliquer la comparaison sur deux écrans.

---

## F. F14 — Modifier, changer de repas, supprimer

| Ticket | Description | Fichiers | Estimation |
|---|---|---|---|
| KCAL-191 | Feuille d'actions sur une entrée du journal : Modifier la quantité / Changer de repas / Supprimer (cf. décision 4), patron `DeleteFoodSheet` du Sprint 2 | `src/features/journal/screens/JournalScreen/EntryActionsSheet/` | 3h |
| KCAL-192 | « Modifier la quantité » : réouverture du `QuantitySheet` en mode édition (quantité et unité de saisie initiales restituées depuis `quantity` + `portionId`), recalcul RM02, `diaryEntryRepository.update` | `src/features/journal/components/QuantitySheet/`, idem | 3h |
| KCAL-193 | « Changer de repas » : sélection parmi les 4 repas (`MEAL_TYPES`) puis `update({ mealType })` | idem | 2h |
| KCAL-194 | « Supprimer » : confirmation, `delete`, `Toast` « \<aliment\> retiré » | idem | 2h |

**Piège KCAL-192 — RM16 à l'envers.** Modifier une entrée **doit** recalculer ses valeurs
nutritionnelles à partir de la fiche `Food` **actuelle** : c'est une nouvelle saisie, pas une
réécriture de l'historique. RM16 interdit qu'une modification de la fiche aliment altère les journées
passées *toute seule* ; elle n'interdit pas à l'utilisateur de corriger sciemment une entrée. À
documenter en commentaire, sinon la règle sera relue à l'envers dans six mois.

**Piège KCAL-192 — restitution de l'unité de saisie.** Si l'entrée a été saisie via une portion,
`quantity` est stockée en unité de référence et `portion_id` porte la portion d'origine. Rouvrir la
feuille en affichant « 300 g » là où l'utilisateur avait tapé « 2 pots » est un écart visible. Diviser
par `portion.quantity` pour retrouver le compte, en gérant le cas de la portion supprimée entre-temps
(repli sur l'unité de référence) — le `portionId` peut être une référence pendante, comme le
documente déjà `RecipeIngredient`.

**Piège KCAL-193.** Changer de repas ne change pas la date : ne pas repasser par la normalisation de
KCAL-169 en réécrivant `date` au passage.

**Traitement des `Result` en erreur.** `update` et `delete` renvoient un `Result` : toute branche
d'erreur produit un message visible (leçon de KCAL-153, où une suppression échouait en silence en
laissant croire qu'elle avait eu lieu). Le texte affiché est construit depuis `error.code` via `t()`,
jamais depuis `error.message`.

---

## G. Internationalisation

**Continu, pas de ticket batché** — même politique qu'aux Sprints 1 et 2. Chaque ticket des sections
B à F ajoute ses clés `fr.json` au moment où il est fait, sous son propre namespace (`addEntry.*`,
`quantitySheet.*`, `today.*`, `journal.*`, `meals.*`). Rappel `AGENTS.md` : cela couvre aussi les
`accessibilityLabel`/`accessibilityHint` (les `MealCard`, les cellules de `DayStrip` et le bouton « + »
de chaque résultat en ont tous besoin), les titres d'écran et les erreurs de validation affichées.
`domain/` et `data/repositories/` restent locale-indépendants.

Réutiliser les clés existantes plutôt que d'en créer des jumelles : `common.kcal`, `common.close`,
`recipeForm.units.*` (via `unitLabel`), `library.food.kcalPer*` (via `foodKcalLabel`).

---

## H. Tests

| Ticket | Description | Fichiers | Estimation |
|---|---|---|---|
| KCAL-195 | Tests `LocalDiaryEntryRepository` : create aliment et recette, `observeByDate` (bornes de jour, entrée à 23h59 puis à 00h01), update, delete, RM14 sur quantité négative, et **colonnes optionnelles absentes lues en `undefined` jamais `null`** (KCAL-152) | `LocalDiaryEntryRepository.dbtest.ts` | 3h |
| KCAL-196 | Test de montée `v5 → v6` sur une base peuplée (aliments et recettes existants intacts) | `schema.dbtest.ts` | 1h |
| KCAL-197 | Tests `QuantitySheet` : recalcul RM02 à chaque frappe, **parité bouton de portion / saisie manuelle équivalente**, présence effective des portions rapides (piège KCAL-179), mode recette, et RM16 — modifier la fiche `Food` après écriture ne change pas l'entrée | `QuantitySheet.test.tsx` | 3h |
| KCAL-198 | Tests `TodayScreen` : total RM04 mis à jour après écriture sans invalidation manuelle, agrégation des macros, état vide | `TodayScreen.test.tsx` | 2h |
| KCAL-199 | Tests `JournalScreen` : répartition par repas, changement de jour via `DayStrip`, les 3 actions F14 | `JournalScreen.test.tsx` | 3h |

Le test de parité de KCAL-197 est le descendant direct de KCAL-149/164 : c'est celui qui attrape une
conversion de portion silencieusement oubliée.

---

## I. QA manuelle

| Ticket | Description | Estimation |
|---|---|---|
| KCAL-200 | Passe QA sur device réel : ajouter un aliment au petit-déjeuner et une recette au dîner, vérifier la mise à jour immédiate de la jauge et des macros, modifier une quantité, déplacer une entrée du déjeuner vers la collation, supprimer une entrée, naviguer entre les jours de la semaine, vérifier la persistance après relance, puis **modifier la fiche d'un aliment déjà consommé et vérifier que la journée passée est inchangée (RM16)** | 2h |

---

## Récapitulatif

| Catégorie | Tickets | Sous-total |
|---|---|---|
| A. Couche de données `DiaryEntry` | KCAL-166 → 171 | 12h |
| B. `AddEntryScreen` (2h) | KCAL-172 → 176 | 12h |
| C. `QuantitySheet` (2i) | KCAL-177 → 181 | 15h |
| D. `TodayScreen` (2a) | KCAL-182 → 186 | 12h |
| E. `JournalScreen` (2b) | KCAL-187 → 190 | 9h |
| F. F14 — modifier / déplacer / supprimer | KCAL-191 → 194 | 10h |
| G. i18n (continu, absorbé dans B → F) | — | — |
| H. Tests | KCAL-195 → 199 | 12h |
| I. QA manuelle | KCAL-200 | 2h |
| **Total** | **35 tickets** | **~84h** |

### Ordre recommandé et dépendances

| # | Bloc | Dépend de | Pourquoi cet ordre |
|---|---|---|---|
| 1 | KCAL-166 (migration v6) | — | **Bloquant absolu.** Elle change la forme d'écriture (`label`, `portionId`, `updatedAt`) ; la poser après un écran d'écriture obligerait à réécrire ce dernier. |
| 2 | KCAL-171 + fonction macros de KCAL-184 | — | Fonctions pures, sans dépendance, testables seules. Les sortir tôt évite qu'un écran les improvise en local. |
| 3 | KCAL-167 → 170 (repository) | 166 | Rien d'autre n'avance sans lui — même logique que le lot A du Sprint 2. |
| 4 | KCAL-172 (navigation) | — | Deux lignes de types, mais elles débloquent B et D simultanément. |
| 5 | KCAL-173 → 176 (`AddEntryScreen`) | 167-170, 172 | Produit les premiers chemins d'accès à la feuille. |
| 6 | KCAL-177 → 181 (`QuantitySheet`) | B | **Première écriture réelle de l'application** : à partir d'ici, il existe des données de journal à afficher. |
| 7 | KCAL-182 → 186 (`TodayScreen`) | C | A besoin d'entrées existantes pour être vérifiable autrement qu'à vide. |
| 8 | KCAL-187 → 190 (`JournalScreen`) | C | idem. |
| 9 | KCAL-191 → 194 (F14) | E | La feuille d'actions se greffe sur les lignes de `MealSection`. |
| 10 | KCAL-195 → 199 | en continu, ticket par ticket | Leçon de KCAL-165 : pas de lot de tests en fin de sprint. |
| 11 | KCAL-200 | tout | Clôture. |

### Risque de séquencement — à arbitrer avant d'ouvrir le sprint

**~84h pour une capacité de ~55h : le Sprint 3 tel que spécifié ne rentre pas dans deux semaines.**
Ce n'est pas une dérive d'estimation, c'est la confirmation chiffrée de la note de PM de `SPRINTS.MD`
(« Sprint 3 est le point de convergence de toute la boucle produit, à ne pas sous-estimer en temps »).
Il concentre la seule migration de schéma, le seul repository, les deux écrans neufs et les deux
écrans squelettes du plan. Deux options :

1. **Étaler le Sprint 3 sur trois semaines** (~28h/semaine, le rythme des sprints précédents). Option
   recommandée : la DoD est indivisible côté produit — un journal où l'on peut ajouter mais pas
   corriger n'est pas livrable.
2. **Si la limite de deux semaines est ferme :** basculer la section E (KCAL-187 → 190, 9h) et
   KCAL-199 (3h) au début du Sprint 4, qui possède déjà F28-F29 sur ce même `JournalScreen` — on
   éviterait ainsi d'ouvrir deux fois le même écran. Contrepartie : F14 doit alors se greffer sur les
   `MealCard` de 2a, ce qui déplace un écart de maquette de 2b vers 2a. Coupe résiduelle : ~72h.

**Deuxième risque, technique celui-là :** `foodRepository.search()` renvoie `portions: []`
(KCAL-163b). Le `QuantitySheet` qui oublierait le `findById` de KCAL-179 s'afficherait sans aucune
portion rapide, sans erreur, sans test rouge — et ferait passer la fonctionnalité vedette du Sprint 2
pour inexistante dans le parcours d'ajout du Sprint 3. C'est l'équivalent, pour ce sprint, de ce que
le lot D a été pour le Sprint 2 : une dépendance non évidente entre deux sprints. Elle est couverte
par un test explicite dans KCAL-197.

### Definition of Done Sprint 3

Reprise de `SPRINTS.MD` : **ajouter un aliment ou une recette à un repas, voir le total du jour se
mettre à jour immédiatement, modifier/supprimer une entrée.** Concrètement :

- Depuis `TodayScreen` ou `JournalScreen`, l'utilisateur ouvre l'écran d'ajout préfiltré sur un repas,
  cherche un aliment ou une recette de sa bibliothèque, saisit une quantité et valide.
- L'`ArcGauge`, les `StatTile`, les `MacroCard` et les totaux par repas se mettent à jour **sans
  invalidation manuelle** (requêtes observées, `TECHNICAL_SPECS.MD` §5.3).
- L'entrée est modifiable (quantité), déplaçable d'un repas à un autre et supprimable, avec
  confirmation et toast.
- Les valeurs nutritionnelles et le libellé sont figés à la saisie : modifier la fiche d'un aliment
  ne change aucune journée passée (RM16, vérifié en KCAL-200).
- La migration v6 est testée sur une base peuplée, sans perte de donnée.
- Aucune valeur `null` ne remonte de la couche data jusqu'à un écran.
- Aucune chaîne visible en dur ; les erreurs affichées sont construites depuis `error.code`.
- Suite de tests verte.
