# Interactions et comportement

## Navigation (React Navigation, TECHNICAL_SPECS §4)
```
RootNavigator
└── BottomTabNavigator (4 onglets)
    ├── Today       → TodayScreen · AddEntryScreen (modal) · WeeklyBudgetScreen
    ├── Journal     → JournalScreen · AddEntryScreen (modal)
    ├── Library     → LibraryScreen · FoodFormScreen · RecipeDetailScreen · RecipeFormScreen
    └── Progress    → ProgressScreen · WeightEntryScreen · BadgesScreen · ActivityFormScreen
                      · SettingsScreen · GoalsScreen (via l'icône réglages du header)
```
Onboarding : stack séparé présenté tant que `UserProfile` n'existe pas.
`AddEntryScreen`, `ActivityFormScreen`, `WeightEntryScreen`, `FoodFormScreen`, `RecipeFormScreen`
sont des présentations modales (header Annuler / titre / action).

## Parcours d'ajout (le plus critique)
1. Tap sur un MealCard de Aujourd'hui (ou « + Ajouter » d'une MealSection du Journal) → AddEntryScreen,
   le repas cible est passé en paramètre de route et rappelé dans le titre.
2. Recherche ou chips ; la liste par défaut est « Récents » (dernières entrées, mélange aliments et recettes).
3. Tap sur un résultat → QuantitySheet, quantité présélectionnée sur la portion médiane.
4. Chaque changement de quantité recalcule kcal et macros (RM02) ; l'affichage ne recalcule rien lui-même,
   il appelle `calculateProportionalNutrition`.
5. Validation → `diaryRepository.addEntry` (valeurs nutritionnelles copiées, RM16) ; les écrans qui
   observent `['diary', date]`/`['week', weekStart]` via `useObservable` se mettent à jour automatiquement
   (TECHNICAL_SPECS §5.3, pas d'invalidation manuelle), réévaluation des badges à l'écriture
   (TECHNICAL_SPECS §8.3), retour sur Aujourd'hui + Toast « <aliment> · <kcal> kcal ajoutées ».

## Animations (Reanimated)
| Élément | Propriété | Durée / courbe |
|---|---|---|
| ArcGauge | strokeDasharray | 500 ms, cubic-bezier(.4,0,.2,1) |
| ProgressBar macros | width | 450 ms, ease-out |
| ProgressBar budget semaine | width | 450 ms, ease-out |
| WeeklyBarsChart | height | 400 ms, ease-out |
| Toggle | position du bouton | 200 ms, ease |
| BottomSheet | translateY + overlay opacity | 280 ms entrée, 200 ms sortie |
| Toast | opacity + translateY 8 | 180 ms, auto-dismiss 2 200 ms |
| MealCard pressed | scale 0.985 | 120 ms |
Pas d'animation sur les changements de nombre : la valeur change d'un coup, seule la jauge s'anime.

## Feedback et états
- **Dans la cible / au-dessus** : dès que consommé net > objectif, la jauge et le total passent en
  terracotta.600 ; la pill de statut du Journal devient « Au-dessus ».
- **Suppression d'une entrée** : tap sur la ligne → confirmation native (Alert) puis retrait + Toast.
- **RM15** (aliment utilisé dans une recette) : le `Result` en erreur remonte les recettes impactées,
  l'UI affiche un dialogue Annuler / Archiver / Supprimer quand même.
- **RM14** : champ en erreur = bordure terracotta.600 + message sous le champ, submit bloqué.
- **Chargement** : squelettes gris sand.200 aux dimensions des cartes, jamais de spinner plein écran
  (les données sont locales, l'attente est de l'ordre de 50 ms).
- **États vides** : voir 2s. Chaque écran de liste en a un.

## Règles d'affichage
- Tous les nombres via `Intl.NumberFormat('fr-BE')` : « 1 600 kcal », « 77,8 kg », « 15,4 g »
  (une décimale pour les macros et le poids, entier pour les kcal).
- Le jour du journal change à minuit, heure locale (TECHNICAL_SPECS §8.1).
- Semaine lundi → dimanche (RM12), réglable dans les Réglages.
- Les calories d'activité sont comptées à 100 % par défaut ; le ratio est un réglage.

## Ce que l'UI ne fait jamais
- Additionner des kcal ou des macros elle-même → `domain/calculations`.
- Lire WatermelonDB directement → repositories.
- Dériver une valeur consommée depuis `Food` à l'affichage → les valeurs sont figées dans `DiaryEntry`.
