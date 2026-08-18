# Kcalvi — Découpage en sprints

**Version :** 1.0
**Statut :** Plan de release MVP (V1 — Kcalvi Core)
**Réfère à :** `Kcalvi_Specifications_Produit_v1.0.md`, `TECHNICAL_SPECS.MD`, `design_handoff_kcalvi/screens.md`

Sprints de 2 semaines, dimensionnés pour un dev solo. L'ordre suit la priorisation du spec produit (§39) en tranches verticales (repository → écran → tests) plutôt que par couche technique, afin d'obtenir un incrément testable à chaque fin de sprint.

---

## Sprint 0 — Fondations (déjà livré)

Base sur laquelle s'appuient tous les sprints suivants :

- Shell Expo / React Native / TypeScript
- WatermelonDB : schéma complet des 7 entités (`UserProfile`, `Food`, `Recipe`, `RecipeIngredient`, `DiaryEntry`, `ActivityEntry`, `WeightEntry`, `Badge`)
- Design system complet (`ui/`) : Button, Text, Card, ArcGauge, HeroCard, MacroCard, ListCard, ListRow, NumberField, ProgressBar, QuickPortionButton, SearchField, SegmentedControl, StatTile, StepIndicator, TabBar, TextField, Toast, Toggle, BottomSheet, Chip
- `domain/calculations` complet : RM01–RM12 + calculs onboarding (Mifflin-St Jeor, TDEE, déficit, macros suggérées)
- `domain/validation` partiel : RM14 (valeurs non négatives), RM15 (`checkFoodDeletable`), bornes de saisie onboarding
- `domain/badges` amorcé : 2 badges sur les ~7 prévus par le spec
- Repositories `FoodRepository` et `ProfileRepository` implémentés (pattern interface + `Local*Repository`)
- Flow onboarding entièrement câblé : `WelcomeScreen` → `ProfileSetupScreen` → `GoalSetupScreen`

**Manquant à ce stade :** `Today`/`Journal`/`Library`/`Progress` sont des écrans vides (squelettes de navigation) ; aucun repository pour `Recipe`, `DiaryEntry`, `ActivityEntry`, `WeightEntry`, `Badge`.

---

## Sprint 1 — Bibliothèque d'aliments

**Objectif :** l'utilisateur peut construire sa bibliothèque personnelle. Prérequis de tout le reste.

- [ ] `LibraryScreen` (2c) : SearchField, chips Tout/★Favoris/Aliments/Recettes, HeroCard de comptage, sections — brancher sur `foodRepository.search()` (déjà observé)
- [ ] `FoodFormScreen` (2j) : création/édition, chips de référence (100g/100ml/unité), aperçu nutritionnel live, validation RM14 au submit
- [ ] Toggle favori (F06) sur `LibraryScreen` et `FoodFormScreen`
- [ ] État vide bibliothèque (2s)
- [ ] Archivage/suppression d'un aliment (RM15 déjà écrit dans `domain/validation`, reste à câbler le dialogue Annuler/Archiver/Supprimer)
- [ ] Tests : `FoodFormScreen` (rendu + validation), `LocalFoodRepository` (create/update/archive)

**DoD :** créer, chercher, modifier, archiver et favoriser un aliment ; données persistées après fermeture app.

*Détail en tickets : voir `SPRINT1-DETAILS.MD`.*

---

## Sprint 2 — Recettes

**Objectif :** composer des recettes à partir de la bibliothèque (F08–F09, RM03).

- [ ] `RecipeRepository` + `LocalRecipeRepository` (même pattern que Food) — CRUD Recipe + RecipeIngredient
- [ ] `RecipeFormScreen` (2l) : nom, portions, ajout d'ingrédients depuis la bibliothèque, recalcul live via `calculateRecipeTotals`/`calculatePortionNutrition` (déjà en `domain/calculations`)
- [ ] `RecipeDetailScreen` (2k) : vue par portion, liste ingrédients, total recette
- [ ] Section Recettes dans `LibraryScreen` + tap ★ favori recette
- [ ] Tests : repository Recipe, écran formulaire (calcul recalculé à chaque ajout/suppression d'ingrédient)

**DoD :** créer une recette avec plusieurs ingrédients, portions configurables, calcul auto correct.

---

## Sprint 3 — Journal alimentaire (boucle cœur)

**Objectif :** le parcours central de l'app — ajouter un aliment/une recette au journal du jour (F10–F14, RM04, RM16).

- [ ] `DiaryEntryRepository` + `LocalDiaryEntryRepository` — écriture copie les valeurs nutritionnelles (RM16, déjà garanti par le modèle de données)
- [ ] `AddEntryScreen` (2h) : recherche, chips Récents/★/Aliments/Recettes, résultat "Créer cet aliment" si vide
- [ ] `QuantitySheet` (2i) : BottomSheet, recalcul proportionnel (RM02) à chaque frappe, QuickPortionButton, toggle favori
- [ ] `JournalScreen` (2b) réel : DayStrip, HeroCard du jour, sections par repas, tap = suppression (toast)
- [ ] `TodayScreen` (2a) réel : ArcGauge + StatTiles branchés sur `calculateConsumedCalories`/RM04, sections repas
- [ ] F14 : modifier quantité / changer de repas / supprimer une entrée
- [ ] Tests : `DiaryEntryRepository`, recalcul RM02 dans `QuantitySheet`

**DoD :** ajouter un aliment ou une recette à un repas, voir le total du jour se mettre à jour immédiatement, modifier/supprimer une entrée.

---

## Sprint 4 — Récents, duplication, navigation calendrier

**Objectif :** vitesse d'encodage (priorité 2 du spec, F06-F07, F15, F28-F29).

- [ ] F07 : listes "récents" (aliments/recettes) — dérivées des dernières `DiaryEntry`
- [ ] F15 : dupliquer une entrée consommée + "copier le dîner d'hier" (encadré sur `AddEntryScreen`)
- [ ] F28 : navigation calendrier (hier/demain/date précise) sur `JournalScreen`
- [ ] F29 : vue calendrier avec indicateur simple (✓ jour rempli)
- [ ] État vide journée (2s) avec "Reprendre plus vite" (copier hier / mes favoris)
- [ ] Tests : logique de duplication, tri "plus récent en premier"

**DoD :** dupliquer un repas complet d'un autre jour, retrouver ses aliments récents en 1 tap, naviguer librement dans l'historique.

---

## Sprint 5 — Activité physique et poids

**Objectif :** compléter le modèle calorique net (F17, F25-F27, RM05-RM07).

- [ ] `ActivityRepository` + `WeightRepository` (même pattern)
- [ ] `ActivityFormScreen` (2m) : grille de types, durées en pills, estimation MET
- [ ] `WeightEntryScreen` (2n) : saisie rapide (pas ±0.5/±0.1), historique, `WeightChart`
- [ ] Câbler calories nettes/restantes (RM06, RM07) sur `TodayScreen` (StatTile "Brûlé" cliquable → 2m)
- [ ] `ProgressScreen` (2d) : HeroCard poids réel + graphique
- [ ] Tests : repositories, non-négativité (RM14) sur poids/calories brûlées

**DoD :** enregistrer une activité et une pesée, voir les calories nettes et restantes se recalculer correctement.

---

## Sprint 6 — Budget hebdomadaire et statistiques

**Objectif :** la vision "semaine" qui différencie Kcalvi (F18-F20, F30).

- [ ] `WeeklyBudgetScreen` (2o) : détail jour par jour, écart signé, moyenne disponible (F20)
- [ ] `WeeklyBudgetCard` sur `TodayScreen` (déjà prévue dans le design, à câbler sur les vraies données)
- [ ] F30 : stats hebdo sur `ProgressScreen` (moyenne kcal/jour, total, écart objectif, protéines moyennes)
- [ ] `WeeklyBarsChart` "calories vs objectif" (5 semaines)
- [ ] Tests : RM09-RM12 déjà couverts en unitaire, ajouter tests d'intégration écran (agrégation sur 7 jours réels)

**DoD :** voir en un coup d'œil le budget de la semaine et son évolution sur 5 semaines.

---

## Sprint 7 — Badges, streaks, motivation

**Objectif :** gamification positive complète (F21-F24, RM13) — actuellement seulement 2 badges sur ~7 existent.

- [ ] Compléter `domain/badges` : "Pile dans le mille" ⭐, "Journal complet" ✍️, "Journée active" 💪, "Perfect Week" 🌟 (en plus des 2 déjà faits)
- [ ] `BadgeRepository` + déclenchement à l'écriture (§8.3 des specs techniques — réévaluation à chaque écriture journal/activité pertinente)
- [ ] Streaks (F23) : logique de calcul (jours suivis consécutifs, indépendante du seul respect de l'objectif — RM13)
- [ ] `BadgesScreen` (2p) : obtenus / à débloquer
- [ ] F24 : messages d'encouragement contextuels (bandeaux sur Today/Journal)
- [ ] Tests : chaque condition de badge (cas limites : sous-consommation excessive ne doit jamais donner un meilleur badge — RM13)

**DoD :** badges et streaks se déclenchent correctement selon les règles du spec, jamais en récompensant une restriction excessive.

---

## Sprint 8 — Réglages, gestion des données, durcissement

**Objectif :** fermer le MVP (F31, §25, critères d'acceptation §38).

- [ ] `SettingsScreen` (2q) : objectif calorique (GoalStepper), toggles préférences, export, réinitialisation
- [ ] `GoalsScreen` (2r) : édition macros/poids cible post-onboarding
- [ ] §25 : confirmation obligatoire sur suppressions destructrices, réinitialisation app
- [ ] Revue exhaustive des états vides et erreurs (§29-30 du spec produit)
- [ ] Flows Maestro E2E (créer aliment, créer recette, ajouter au journal, encoder une pesée — déjà listés en §16.2 des specs techniques)
- [ ] Passe QA contre la checklist §38 (28 critères d'acceptation MVP) — cocher un par un
- [ ] Merge `feature/onboarding` → `master`, tag `v1.0.0-mvp`

**DoD :** les 28 critères d'acceptation du §38 sont cochés, l'app tourne 100% hors ligne sans compte.

---

## Notes de PM

- **Dépendances dures :** Sprint 3 (Journal) ne peut pas démarrer avant Sprint 1 (Food) et Sprint 2 (Recipe) — c'est le point de convergence de toute la boucle produit, à ne pas sous-estimer en temps.
- **Risque principal :** `domain/badges` et les streaks (Sprint 7) sont les moins spécifiés dans le doc produit (conditions "indicatives") — prévoir un temps de calibrage plutôt qu'une estimation figée.
- **Hors scope volontaire (V1.1+) :** scanner code-barres, Open Food Facts, Apple Health, iCloud, export CSV/PDF — à ne pas laisser rentrer par la fenêtre pendant ces 8 sprints.
- Au moment de la rédaction de ce plan, le repo est sur `feature/onboarding` avec un statut propre : merger ce Sprint 0 avant d'ouvrir la branche du Sprint 1.
