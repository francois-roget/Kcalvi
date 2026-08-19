# Sprint 2 — Détail des tickets

**Sprint :** Recettes
**Réfère à :** `SPRINTS.MD` (Sprint 2), `Kcalvi_Specifications_Produit_v1.0.md` (F08-F09, RM03),
`design_handoff_kcalvi/screens.md` (2c, 2k, 2l)
**Capacité supposée :** ~55h sur 2 semaines (rythme freelance solo, à ajuster selon disponibilité réelle)

État de départ : le schéma WatermelonDB (`recipes`, `recipe_ingredients`) et les models
(`Recipe.ts`, `RecipeIngredient.ts`) existent déjà depuis le Sprint 0 — aucune migration de schéma
ce sprint. `calculateRecipeTotals` (RM03) et `calculatePortionNutrition` (F09) sont déjà écrites et
testées dans `domain/calculations`. Ce sprint construit la couche `RecipeRepository` (pattern
`FoodRepository`) puis câble les deux écrans et l'intégration bibliothèque.

---

## Décisions prises (stand-up)

- **« Poids total » (2l)** n'est pas un champ persisté sur `Recipe` (absent du modèle de données et
  du spec produit) : c'est une valeur calculée (somme des quantités d'ingrédients), affichée mais
  jamais écrite en base.
- **Pas de toggle favori sur `RecipeFormScreen`** : l'écran 2l ne le prévoit pas dans le design (à la
  différence de 2j pour les aliments). Le favori se bascule uniquement depuis 2c (liste) et s'affiche
  en lecture seule sur 2k (« N portions · favori »).
- **Ajout d'un ingrédient (2l) : l'utilisateur peut saisir la quantité en unité de référence du food
  OU en nombre de portions** (quand `food.servingQuantity`/`servingUnit` est défini — ex. « 2 œufs »).
  `calculateProportionalNutrition` calcule le ratio `quantity / food.referenceQuantity` sans connaître
  d'unité : la conversion doit donc se faire **avant** l'écriture en base, pas au moment du calcul.
  Une nouvelle fonction pure `domain/calculations` (KCAL-130) convertit
  `nombre de portions × food.servingQuantity` → quantité équivalente en unité de référence, sur le
  même principe (implicite, déjà présent dans `FoodFormScreen`) que `servingUnit` partage la
  dimension de `referenceUnit`. C'est `RecipeIngredient.quantity` qui stocke toujours la valeur déjà
  convertie ; `RecipeIngredient.unit` ne sert qu'à l'affichage (« 2 unités » vs « 120 g »), jamais au
  calcul — à documenter clairement dans le code pour ne pas réintroduire le bug de conversion
  silencieuse qu'on a identifié en amont.
- **`RecipeRepository.search()` n'observe que la table `recipes`** (nom uniquement — `Recipe` n'a pas
  de champ `brand`), sans jointure ingrédients/aliments : l'écran 2c n'affiche pas de kcal sur la card
  recette, donc pas besoin de calculer un total pour la liste.
- **« Ajouter au repas » (2k) est affiché mais désactivé ce sprint** : `DiaryEntryRepository` et
  `AddEntryScreen` n'existent qu'au Sprint 3 (même pattern que le CTA secondaire désactivé de
  KCAL-108/Sprint 1).
- **« Dupliquer » (2k) ouvre directement la copie en édition** : après le clone (`recipeRepository.create`),
  navigation immédiate vers `RecipeFormScreen` en mode édition sur la nouvelle recette, pour que
  l'utilisateur renomme/ajuste tout de suite plutôt que de retrouver silencieusement la copie plus tard.
- **Dette héritée du Sprint 1 résolue ce sprint :** `LibraryScreen` appelle aujourd'hui
  `checkFoodDeletable(foodId, [])` avec un tableau vide codé en dur (cf. SPRINT1-DETAILS.MD section D,
  note QA) faute de `RecipeRepository`. C'est la seule dépendance dure de Sprint 1 vers Sprint 2 qui
  n'était pas explicitement listée dans `SPRINTS.MD` — voir KCAL-127 et KCAL-144.

---

## A. RecipeRepository (data layer)

| Ticket | Description | Fichiers | Estimation |
|---|---|---|---|
| KCAL-125 | Interface `RecipeRepository` : `CreateRecipeInput`/`UpdateRecipeInput`, `findById`, `search(query)` (observable), `create`, `update`, `archive`, `delete`, `findUsagesByFoodId(foodId)` — même pattern que `FoodRepository.ts` | `src/data/repositories/RecipeRepository.ts` | 2h |
| KCAL-126 | `LocalRecipeRepository` : `create`/`update` écrivent Recipe + RecipeIngredient en un seul `database.batch()` ; l'update diffie la liste d'ingrédients (ajout/suppression/modification de quantité) plutôt que tout recréer | `src/data/repositories/LocalRecipeRepository.ts` | 5h |
| KCAL-127 | `findUsagesByFoodId` : query `recipe_ingredients` par `food_id` — ferme le point ouvert de SPRINT1-DETAILS.MD section D | idem | 1h |
| KCAL-128 | Helper `getRecipeWithIngredients(recipeId)` : renvoie Recipe + `{ ingredient, food }[]` joint (format attendu par `calculateRecipeTotals`), utilisé par le mode édition (KCAL-136) et 2k (KCAL-138/139) | idem | 2h |
| KCAL-129 | Enregistrer `recipeRepository` dans `src/data/repositories/index.ts` (pattern déjà utilisé pour `foodRepository`) | `src/data/repositories/index.ts` | 1h |
| KCAL-130 | Fonction pure `convertServingsToReferenceQuantity(food, servings)` dans `domain/calculations` : `servings × food.servingQuantity` → quantité équivalente en unité de référence, utilisée par le picker d'ingrédient (KCAL-133) quand l'utilisateur saisit en « portions » plutôt qu'en unité de référence | `src/domain/calculations/index.ts` | 2h |

---

## B. RecipeFormScreen (2l)

| Ticket | Description | Fichiers | Estimation |
|---|---|---|---|
| KCAL-131 | Layout + header Annuler / Nouvelle recette ou Modifier / Enregistrer ; champ Nom ; champs Portions et Poids total (calculé, lecture seule) | `features/recipes/screens/RecipeFormScreen.tsx` | 2h |
| KCAL-132 | `ListCard` des ingrédients ajoutés (nom, quantité + unité, kcal calculées, suppression par ligne) | idem | 3h |
| KCAL-133 | Encadré pointillé « + Ajouter un ingrédient » : réutilise la recherche bibliothèque (`foodRepository.search`) puis saisie de quantité, avec bascule unité de référence / portions (visible seulement si `food.servingQuantity` est défini) qui appelle `convertServingsToReferenceQuantity` (KCAL-130) avant d'enregistrer | idem | 5h |
| KCAL-134 | HeroCard « Par portion (calcul auto) » : recalcul live via `calculateRecipeTotals` puis `calculatePortionNutrition` à chaque ajout/suppression d'ingrédient ou changement de portions | idem | 2h |
| KCAL-135 | Validation au submit : nom obligatoire, ≥ 1 ingrédient, quantités non négatives (RM14 / `assertNonNegative`), erreurs par champ | idem | 2h |
| KCAL-136 | Wiring création (`recipeRepository.create`) + navigation retour vers `LibraryScreen` | idem | 2h |
| KCAL-137 | Mode édition : préremplissage via `getRecipeWithIngredients` (KCAL-128) + wiring `update` — inclut le cas d'entrée « copie » depuis KCAL-141 (Dupliquer) | idem | 3h |

---

## C. RecipeDetailScreen (2k)

| Ticket | Description | Fichiers | Estimation |
|---|---|---|---|
| KCAL-138 | Layout header ‹ Retour / Modifier (→ 2l en édition) ; titre + « N portions · favori » | `features/recipes/screens/RecipeDetailScreen.tsx` | 2h |
| KCAL-139 | HeroCard « Par portion » : kcal + macros via `calculatePortionNutrition` | idem | 2h |
| KCAL-140 | `ListCard` des ingrédients (nom + quantité, kcal à droite) + ligne « Total recette » via `calculateRecipeTotals` | idem | 2h |
| KCAL-141 | Boutons bas : « Dupliquer » (clone recette + ingrédients via `recipeRepository.create`, nom suffixé, puis navigue vers `RecipeFormScreen` en édition sur la copie — cf. décision) et « Ajouter au repas » (affiché mais désactivé, cf. décision) | idem | 4h |

---

## D. Intégration LibraryScreen + navigation

| Ticket | Description | Fichiers | Estimation |
|---|---|---|---|
| KCAL-142 | Remplacer le stub section Recettes (KCAL-107/Sprint 1) par la liste réelle observée via `recipeRepository.search()` ; Card light (nom + « N portions ») ; tap → `RecipeDetail` | `features/library/screens/LibraryScreen.tsx` | 3h |
| KCAL-143 | Chip « Recettes » réel (remplace le `return []` codé en dur) + comptage recettes réel dans le `HeroCard` (remplace `recipes: 0`) | idem | 2h |
| KCAL-144 | Tap ★ sur une card recette = bascule favori inline (`recipeRepository.update`) | idem | 2h |
| KCAL-145 | Câbler les usages réels dans `checkFoodDeletable` (remplace le `[]` codé en dur de KCAL-119/Sprint 1) via `findUsagesByFoodId` (KCAL-127) | idem | 1h |
| KCAL-146 | Ajouter `RecipeForm` / `RecipeDetail` à `LibraryStackParamList` (`{ recipeId }` optionnel pour l'édition, même pattern que `FoodForm`) + entrées navigator | `src/navigation/types.ts` + navigator | 2h |

---

## E. Internationalisation

**Continu, pas de ticket batché** (même politique que Sprint 1, section E de SPRINT1-DETAILS.MD).
Chaque ticket des sections B, C et D qui introduit du texte visible ajoute ses clés `fr.json` sous son
propre namespace (`recipes.*`, `recipeForm.*`, `recipeDetail.*`) au moment où il est fait. Conforme à
`AGENTS.md`.

---

## F. Tests

| Ticket | Description | Fichiers | Estimation |
|---|---|---|---|
| KCAL-147 | Tests unitaires `LocalRecipeRepository` : create/update (ajout, suppression et modification de quantité d'un ingrédient)/archive/delete, cas limites (recette à 0 ingrédient, quantité négative) | `LocalRecipeRepository.dbtest.ts` | 3h |
| KCAL-148 | Test `convertServingsToReferenceQuantity` (KCAL-130) : conversion portions → unité de référence, cas limite `servingQuantity` absent | `calculations.test.ts` | 1h |
| KCAL-149 | Tests `RecipeFormScreen` : recalcul du total à chaque ajout/suppression d'ingrédient, ajout via unité de référence ET via portions (vérifie que les deux chemins donnent le même total), validation submit succès/erreur | `RecipeFormScreen.test.tsx` | 3h |
| KCAL-150 | Extension `LibraryScreen.test.tsx` : section recettes, filtre « Recettes », favori recette, dialogue de suppression d'aliment avec usage réel (branche « Archiver » enfin testable) | `LibraryScreen.test.tsx` | 2h |

---

## G. QA manuelle

| Ticket | Description | Estimation |
|---|---|---|
| KCAL-151 | Passe QA : créer une recette à 3+ ingrédients (dont un ajouté en « portions », ex. « 2 œufs »), modifier les portions et vérifier le recalcul, dupliquer une recette et vérifier l'ouverture en édition, favoriser depuis la bibliothèque, tenter de supprimer un aliment utilisé dans une recette (vérifier le blocage RM15 réel cette fois, plus contournable via un tableau vide) | 2h |

---

## Récapitulatif

| Catégorie | Sous-total |
|---|---|
| A. RecipeRepository (data layer) | 13h |
| B. RecipeFormScreen | 19h |
| C. RecipeDetailScreen | 10h |
| D. Intégration LibraryScreen + navigation | 10h |
| E. i18n (continu, absorbé dans B/C/D) | — |
| F. Tests | 9h |
| G. QA manuelle | 2h |
| **Total** | **~63h** |

**Ordre suggéré :** A (rien d'autre n'avance sans le repository) → B (le formulaire produit les
premières recettes à tester) → C (a besoin de recettes existantes) → D → E en continu → F en fin de
sprint → G en clôture.

**Definition of Done Sprint 2 :** un utilisateur peut créer une recette avec plusieurs ingrédients
issus de la bibliothèque, configurer le nombre de portions et voir le calcul par portion se mettre à
jour automatiquement ; la recette est visible, favorisable et dupliquable depuis la bibliothèque et sa
fiche détail ; supprimer un aliment utilisé dans une recette déclenche réellement le blocage RM15 ;
tests unitaires et composants verts.
