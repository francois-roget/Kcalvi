# Kcalvi — Spécifications produit

**Version :** 1.0  
**Statut :** Version consolidée  
**Nom de travail :** Kcalvi  
**Baseline :** *Calories in balance.*  
**Plateforme initiale :** iPhone  
**Approche :** Personal-first / Local-first  

---

# 1. Vision du produit

## 1.1 Concept

Kcalvi est une application iPhone de suivi nutritionnel conçue pour permettre à l'utilisateur de suivre simplement :

- les aliments consommés ;
- les calories ;
- les macronutriments ;
- les recettes personnelles ;
- l'activité physique ;
- le poids ;
- les objectifs journaliers ;
- les objectifs hebdomadaires ;
- la progression et la régularité.

L'application privilégie une utilisation **rapide, simple et positive**.

Le MVP repose sur une bibliothèque personnelle d'aliments et de recettes, sans dépendance obligatoire à une base alimentaire externe.

---

## 1.2 Objectif principal

Permettre à l'utilisateur de répondre immédiatement à trois questions :

1. **Combien de calories ai-je consommées aujourd'hui ?**
2. **Combien puis-je encore consommer aujourd'hui ?**
3. **Où en suis-je par rapport à mon objectif sur l'ensemble de la semaine ?**

Kcalvi doit favoriser la **régularité et l'équilibre**, plutôt qu'une logique punitive basée sur chaque journée prise individuellement.

---

## 1.3 Proposition de valeur

Kcalvi se différencie par quatre principes :

### Encodage rapide

Favoris, récents, recettes, duplication de repas et, dans les versions futures, scan de code-barres, photo IA, texte naturel et voix.

### Vision journalière + hebdomadaire

L'application ne se limite pas à afficher un objectif quotidien. Elle permet également de piloter un **budget calorique hebdomadaire**.

### Motivation positive

Badges, encouragements et streaks récompensent la régularité sans valoriser une restriction calorique excessive.

### Contrôle utilisateur

Même avec l'introduction future de l'IA, l'utilisateur garde toujours la validation finale de son journal alimentaire.

---

# 2. Principes produit

## 2.1 Simplicité

Une action courante doit nécessiter le moins d'étapes possible.

Exemple :

```text
Accueil
→ Ajouter
→ Aliment récent
→ Quantité
→ Valider
```

---

## 2.2 Rapidité

Les aliments et recettes fréquemment utilisés doivent être accessibles immédiatement via :

- récents ;
- favoris ;
- recherche ;
- duplication d'un repas précédent ;
- templates de repas dans une version ultérieure.

---

## 2.3 Flexibilité

L'objectif calorique doit être analysé :

- au niveau journalier ;
- au niveau hebdomadaire.

Une journée dépassant légèrement l'objectif ne signifie pas nécessairement que la semaine est « ratée ».

---

## 2.4 Motivation positive

L'application peut utiliser :

- badges ;
- encouragements ;
- streaks ;
- récapitulatifs positifs.

Elle ne doit jamais valoriser une consommation excessivement inférieure à l'objectif.

---

## 2.5 Local-first

Le MVP doit :

- fonctionner hors ligne ;
- stocker les données sur l'iPhone ;
- ne nécessiter aucun compte utilisateur ;
- ne dépendre d'aucune API externe.

---

# 3. Utilisateur cible

## 3.1 Utilisateur principal du MVP

Le MVP est initialement conçu pour un **usage personnel**.

L'utilisateur :

- souhaite suivre ses calories et ses macros ;
- connaît ou définit lui-même son objectif calorique ;
- accepte de construire progressivement sa bibliothèque d'aliments ;
- crée ses propres recettes ;
- souhaite suivre son poids ;
- souhaite une vision plus flexible qu'un simple compteur journalier.

---

# 4. Périmètre du MVP

## 4.1 Must Have

Le MVP doit inclure :

- profil utilisateur ;
- objectif calorique journalier ;
- objectifs de macronutriments ;
- bibliothèque personnelle d'aliments ;
- création, modification et suppression d'aliments ;
- recettes personnelles ;
- calcul automatique des valeurs nutritionnelles ;
- journal alimentaire quotidien ;
- repas par catégories ;
- quantités et portions ;
- recherche locale ;
- favoris ;
- récents ;
- duplication ;
- calories consommées ;
- activité physique ;
- calories brûlées ;
- calories nettes ;
- calories restantes ;
- budget calorique hebdomadaire ;
- suivi du poids ;
- historique ;
- statistiques simples ;
- badges journaliers ;
- badges hebdomadaires ;
- streaks ;
- stockage local ;
- fonctionnement hors ligne.

---

# 5. Hors MVP / évolutions futures

Les fonctionnalités suivantes sont volontairement exclues du MVP :

- base alimentaire externe ;
- catalogue spécifique au marché belge ;
- scanner de codes-barres ;
- Apple Health ;
- sauvegarde iCloud ;
- widgets iOS ;
- notifications intelligentes ;
- reconnaissance de repas par photo ;
- encodage par voix ;
- encodage en langage naturel ;
- projection du poids ;
- analytics avancés ;
- recommandations intelligentes ;
- coaching IA ;
- base collaborative ;
- intégrations Garmin/Fitbit ;
- fonctionnalités sociales.

L'architecture du MVP doit néanmoins permettre leur ajout ultérieur sans réécriture majeure du journal alimentaire.

---

# 6. Profil utilisateur

## F01 — Création et gestion du profil

L'utilisateur peut définir son profil.

### Données

- prénom ou pseudonyme ;
- sexe facultatif ;
- date de naissance facultative ;
- taille facultative ;
- poids actuel ;
- poids cible ;
- objectif principal.

### Objectifs possibles

- perte de poids ;
- maintien ;
- prise de poids ;
- objectif personnalisé.

### Critères d'acceptation

- [ ] Le profil peut être créé lors de la première utilisation.
- [ ] Les données peuvent être modifiées ultérieurement.
- [ ] Les données sont conservées après fermeture de l'application.

---

# 7. Objectifs nutritionnels

## F02 — Objectif calorique journalier

L'utilisateur définit manuellement son objectif calorique journalier.

Exemple :

```text
Objectif : 1 600 kcal / jour
```

### MVP

La saisie manuelle est obligatoire.

### Évolution future

Un calcul automatique pourra être proposé ultérieurement.

---

## F03 — Objectifs de macronutriments

L'utilisateur peut définir ses objectifs de :

- protéines ;
- glucides ;
- lipides.

Unité :

```text
grammes / jour
```

Exemple :

```text
Protéines : 100 g
Glucides : 160 g
Lipides : 60 g
```

---

# 8. Bibliothèque personnelle d'aliments

## F04 — Liste des aliments

La bibliothèque personnelle contient les aliments créés par l'utilisateur.

Chaque aliment doit pouvoir être :

- créé ;
- consulté ;
- recherché ;
- modifié ;
- supprimé ou archivé ;
- mis en favori.

---

## F05 — Création d'un aliment

### Champs obligatoires

- nom ;
- calories ;
- quantité de référence ;
- unité de référence.

### Champs optionnels

- marque ;
- protéines ;
- glucides ;
- lipides ;
- fibres ;
- sucre ;
- notes ;
- catégorie ;
- taille d'une portion ;
- unité de portion ;
- code-barres futur.

---

## 8.1 Modes nutritionnels

### Pour 100 g

```text
Skyr

Pour 100 g :
Calories : 64 kcal
Protéines : 10 g
Glucides : 4 g
Lipides : 0,2 g
```

### Pour 100 ml

```text
Lait d'amande

Pour 100 ml :
Calories : 24 kcal
```

### Par portion

```text
Yaourt grec

1 pot = 150 g
Calories : 120 kcal
```

### Par unité

```text
Œuf

1 unité
Calories : 78 kcal
```

---

# 9. Unités et conversions

## RM01 — Unités minimales du MVP

Le MVP doit supporter au minimum :

- g ;
- ml ;
- unité ;
- portion.

### Évolutions possibles

- cuillère à café ;
- cuillère à soupe ;
- tranche ;
- tasse ;
- verre.

---

## RM02 — Conversion proportionnelle

Pour un aliment défini pour 100 g :

```text
Calories consommées =
Calories pour 100 g × quantité consommée / 100
```

Exemple :

```text
150 g d'un produit à 80 kcal / 100 g

80 × 150 / 100
= 120 kcal
```

Le même principe s'applique aux macros.

---

# 10. Favoris et récents

## F06 — Favoris

L'utilisateur peut marquer :

- un aliment ;
- une recette

comme favori.

Les favoris doivent être accessibles depuis l'écran d'ajout.

---

## F07 — Récents

L'application conserve automatiquement les derniers éléments utilisés.

Listes :

```text
Aliments récents
Recettes récentes
```

Les éléments les plus récemment utilisés apparaissent en premier.

---

# 11. Recettes

## F08 — Création d'une recette

Une recette est composée d'aliments issus de la bibliothèque.

Exemple :

```text
Salade poulet feta

Poulet : 120 g
Feta : 40 g
Tomate : 150 g
Avocat : 50 g
Sauce : 20 g
```

---

## RM03 — Calcul du total nutritionnel d'une recette

Le système calcule automatiquement :

- calories totales ;
- protéines totales ;
- glucides totaux ;
- lipides totaux.

---

## F09 — Portions

L'utilisateur peut préciser le nombre de portions.

Exemple :

```text
Nombre de portions : 4
```

### Formule

```text
Calories par portion =
Calories totales / nombre de portions
```

Le même principe s'applique aux macros.

---

# 12. Journal alimentaire

## F10 — Journée alimentaire

Chaque date possède son journal.

Repas standards :

1. Petit-déjeuner
2. Déjeuner
3. Collation
4. Dîner

---

## F11 — Ajouter un aliment ou une recette

Depuis un repas :

```text
+ Ajouter
```

L'utilisateur peut choisir :

- récent ;
- favori ;
- aliment ;
- recette.

---

## F12 — Recherche locale

La recherche fonctionne au minimum sur :

- nom ;
- marque.

Exemple :

```text
Recherche : mozzarella
```

Résultat :

```text
Mozzarella Galbani
Mozzarella Delhaize
Mozzarella light
```

---

## F13 — Sélection de quantité

Après sélection d'un aliment :

```text
Aliment : Mozzarella
Quantité : 70 g
```

L'application recalcule immédiatement :

- kcal ;
- protéines ;
- glucides ;
- lipides.

---

## F14 — Modifier une entrée

Depuis le journal, l'utilisateur peut :

- modifier la quantité ;
- changer de repas ;
- supprimer l'entrée.

---

## F15 — Duplication

L'utilisateur peut :

- dupliquer un aliment consommé ;
- dupliquer une recette consommée ;
- copier un repas depuis un autre jour.

Exemple :

```text
Copier le dîner d'hier
```

---

# 13. Dashboard quotidien

## F16 — Résumé journalier

L'accueil doit présenter au minimum :

```text
Aujourd'hui

1 245 / 1 600 kcal

355 kcal restantes
```

Puis :

```text
Protéines
82 / 100 g

Glucides
125 / 160 g

Lipides
48 / 60 g
```

---

## RM04 — Calories consommées

```text
Calories consommées =
Somme des calories de toutes les entrées alimentaires du jour
```

---

# 14. Activité physique

## F17 — Enregistrer une activité

L'utilisateur peut encoder manuellement une activité.

### Champs

- nom ;
- durée facultative ;
- calories brûlées ;
- notes facultatives.

Exemple :

```text
Marche
45 minutes
210 kcal
```

---

## RM05 — Calories brûlées

```text
Calories brûlées =
Somme des activités du jour
```

---

## RM06 — Calories nettes

```text
Calories nettes =
Calories consommées - calories brûlées
```

Exemple :

```text
Calories consommées : 1 700
Activité : 250

Calories nettes : 1 450
```

---

## RM07 — Calories restantes

```text
Calories restantes =
Objectif journalier - calories nettes
```

Exemple :

```text
Objectif : 1 600
Net : 1 450

Restant : 150 kcal
```

---

## RM08 — Dépassement journalier

Lorsque l'objectif est dépassé :

```text
1 725 / 1 600 kcal

125 kcal au-dessus de l'objectif
```

Le dépassement ne doit pas être formulé comme une faute ou un échec.

---

# 15. Budget calorique hebdomadaire

## F18 — Budget semaine

Le système calcule un budget calorique sur sept jours.

---

## RM09 — Budget hebdomadaire

```text
Budget hebdomadaire =
Objectif journalier × 7
```

Exemple :

```text
1 600 × 7
= 11 200 kcal
```

---

## RM10 — Consommation nette hebdomadaire

```text
Consommation nette hebdomadaire =
Somme des calories nettes des 7 jours
```

---

## RM11 — Budget restant de la semaine

```text
Budget restant =
Budget hebdomadaire - consommation nette cumulée
```

---

## F19 — Affichage hebdomadaire

Exemple :

```text
Cette semaine

7 820 / 11 200 kcal

3 380 kcal disponibles
```

---

## F20 — Moyenne disponible par jour

Fonction optionnelle du MVP.

Exemple :

```text
Budget restant : 3 380 kcal
Jours restants : 2

Moyenne disponible :
1 690 kcal / jour
```

---

## RM12 — Définition de la semaine

Par défaut :

```text
Lundi → Dimanche
```

Cette règle pourra devenir configurable ultérieurement.

---

# 16. Badges et gamification

## F21 — Badges journaliers

### Badge — Dans la cible 🎯

Condition de base :

```text
Calories nettes ≤ objectif
```

Une future règle de complétude pourra empêcher l'attribution d'un badge sur une journée manifestement incomplète.

---

### Badge — Pile dans le mille ⭐

Condition indicative :

```text
98 % à 100 % de l'objectif
```

---

### Badge — Journal complet ✍️

Condition :

tous les repas ont été complétés ou explicitement marqués comme sans consommation.

---

### Badge — Journée active 💪

Condition :

- activité enregistrée ;
- objectif calorique respecté.

---

## F22 — Badges hebdomadaires

### Semaine maîtrisée 🏆

Condition :

```text
Calories nettes hebdomadaires
≤ budget calorique hebdomadaire
```

---

### Perfect Week 🌟

Condition :

objectif journalier respecté les 7 jours.

Ce badge doit rester secondaire par rapport au badge hebdomadaire afin de ne pas décourager l'utilisateur après une seule journée supérieure à l'objectif.

---

## F23 — Streaks

Exemples :

```text
3 jours suivis 🔥
7 jours suivis
4 semaines complètes
```

Le streak doit principalement récompenser :

- l'utilisation régulière ;
- l'encodage ;
- la constance.

Il ne doit pas uniquement dépendre du fait de rester sous un objectif calorique.

---

## RM13 — Gamification responsable

Une consommation très inférieure à l'objectif ne doit jamais générer un badge supérieur.

Exemple :

```text
Objectif : 1 600 kcal

1 550 kcal
```

ne doit pas être considéré comme moins bon que :

```text
1 000 kcal
```

L'application récompense la **régularité**, pas la restriction maximale.

---

## F24 — Messages d'encouragement

Exemples :

```text
Belle journée 🎯
Tu termines dans ta cible.
```

```text
Objectif hebdomadaire atteint 🏆
11 050 / 11 200 kcal
```

```text
Une journée plus élevée ne définit pas ta semaine.
Il te reste 3 250 kcal dans ton budget hebdomadaire.
```

---

# 17. Suivi du poids

## F25 — Pesée

L'utilisateur peut enregistrer :

- date ;
- poids ;
- note facultative.

---

## F26 — Historique du poids

Afficher :

- poids actuel ;
- poids de départ ;
- poids cible ;
- évolution totale.

Exemple :

```text
Départ : 81,0 kg
Actuel : 77,8 kg
Évolution : -3,2 kg
```

---

## F27 — Graphique du poids

Le MVP peut afficher une courbe simple.

```text
Poids
│
│ ●
│   ●
│      ●
│         ●
└────────────── Date
```

---

# 18. Historique alimentaire

## F28 — Navigation calendrier

L'utilisateur peut naviguer vers :

- hier ;
- demain ;
- une date spécifique.

---

## F29 — Vue calendrier

Les journées peuvent afficher un indicateur simple.

Exemple :

```text
L   M   M   J   V   S   D

✓   ✓   ✓   ✓   •   •   •
```

---

# 19. Statistiques MVP

## F30 — Statistiques hebdomadaires

Afficher au minimum :

- moyenne kcal/jour ;
- total kcal ;
- objectif hebdomadaire ;
- différence ;
- protéines moyennes ;
- poids actuel ;
- évolution du poids.

---

# 20. Navigation principale

Navigation recommandée :

```text
Aujourd'hui
Journal
Bibliothèque
Progression
```

Les réglages sont accessibles depuis le profil.

---

# 21. Écran Aujourd'hui

## Objectif

Donner immédiatement la situation du jour.

### Affichage recommandé

```text
Bonjour 👋

SAMEDI 15 AOÛT

Calories

1 245
──────
1 600 kcal

355 restantes

[ Protéines ] [ Glucides ] [ Lipides ]

Petit-déjeuner
320 kcal

Déjeuner
485 kcal

Collation
120 kcal

Dîner
320 kcal

+ Ajouter
```

---

## Carte semaine

Sous le résumé journalier :

```text
CETTE SEMAINE

████████████░░░░

7 820 / 11 200 kcal

3 380 kcal disponibles
```

---

# 22. Écran Bibliothèque

Sections :

```text
Recherche

★ Favoris
🕘 Récents
🥗 Aliments
🍲 Recettes
```

Actions :

```text
+ Nouvel aliment
+ Nouvelle recette
```

---

# 23. Écran Progression

Sections :

- poids ;
- calories ;
- macros ;
- badges ;
- streaks.

---

# 24. Paramètres

## F31 — Paramètres MVP

Paramètres :

- objectif calorique ;
- objectifs macros ;
- poids cible ;
- unité de poids ;
- gestion des données ;
- à propos.

---

# 25. Gestion des données

L'utilisateur doit pouvoir :

- modifier ses données ;
- supprimer ou archiver un aliment ;
- supprimer une recette ;
- supprimer une pesée ;
- réinitialiser l'application.

Une confirmation est obligatoire pour les suppressions importantes.

---

# 26. Stockage MVP

Architecture :

```text
Application iPhone
       │
       ▼
Stockage local
       │
       ├── Profil
       ├── Aliments
       ├── Recettes
       ├── Journal
       ├── Activités
       ├── Poids
       └── Badges
```

Aucun serveur n'est obligatoire pour la V1.

---

# 27. Modèle de données

## UserProfile

```text
id
name
dailyCalorieGoal
proteinGoal
carbGoal
fatGoal
startWeight
currentWeight
targetWeight
createdAt
updatedAt
```

---

## Food

```text
id
name
brand
calories
protein
carbs
fat
fiber
sugar
referenceQuantity
referenceUnit
servingQuantity
servingUnit
category
barcode
source
isFavorite
isArchived
createdAt
updatedAt
```

`barcode` et `source` peuvent rester inutilisés dans le MVP mais permettent les évolutions futures.

---

## Recipe

```text
id
name
servings
notes
isFavorite
createdAt
updatedAt
```

---

## RecipeIngredient

```text
id
recipeId
foodId
quantity
unit
```

---

## DiaryEntry

```text
id
date
mealType
foodId OR recipeId
quantity
unit
calories
protein
carbs
fat
createdAt
```

Les valeurs nutritionnelles consommées doivent être conservées dans l'entrée afin qu'une modification ultérieure de la fiche aliment ne modifie pas rétroactivement l'historique.

---

## ActivityEntry

```text
id
date
name
duration
caloriesBurned
notes
```

---

## WeightEntry

```text
id
date
weight
notes
```

---

## Badge

```text
id
type
earnedDate
periodStart
periodEnd
```

---

# 28. Types de repas

```text
BREAKFAST
LUNCH
SNACK
DINNER
```

---

# 29. États vides

Chaque écran doit prévoir un état vide.

Exemple bibliothèque :

```text
Aucun aliment pour le moment.

Crée ton premier aliment pour commencer.

[ + Nouvel aliment ]
```

---

# 30. Gestion des erreurs

Cas à prévoir :

- quantité invalide ;
- valeur négative ;
- champ obligatoire vide ;
- recette sans ingrédient ;
- suppression d'un aliment utilisé dans une recette ;
- suppression d'une recette utilisée dans l'historique ;
- données impossibles à sauvegarder.

---

# 31. Règles de validation

## RM14 — Valeurs non négatives

Les valeurs suivantes ne peuvent pas être négatives :

- calories ;
- protéines ;
- glucides ;
- lipides ;
- quantité ;
- poids ;
- calories brûlées.

---

## RM15 — Suppression d'un aliment utilisé

Si un aliment est utilisé dans une recette, l'application doit avertir :

```text
Cet aliment est utilisé dans 3 recettes.

Sa suppression pourrait affecter ces recettes.
```

Options :

```text
Annuler
Archiver
Supprimer quand même
```

L'archivage est recommandé afin de préserver la cohérence historique.

---

## RM16 — Historique immuable

Une modification de la fiche nutritionnelle d'un aliment ne doit pas modifier les journées passées.

Exemple :

Un aliment était enregistré à :

```text
100 kcal / 100 g
```

L'utilisateur corrige ensuite la fiche à :

```text
110 kcal / 100 g
```

Les anciens repas conservent leur calcul original.

---

# 32. Performance

Les opérations principales doivent sembler instantanées :

- ouverture du journal ;
- recherche locale ;
- ajout d'un aliment ;
- changement de quantité ;
- changement de date.

---

# 33. Fonctionnement hors ligne

Le MVP doit être entièrement utilisable sans connexion Internet.

---

# 34. Compte utilisateur

Aucun compte n'est obligatoire dans le MVP.

---

# 35. Confidentialité

Le MVP stockant les données localement :

- aucune création de compte obligatoire ;
- aucune transmission vers un serveur externe nécessaire ;
- aucune donnée personnelle ne doit quitter l'appareil sans fonctionnalité explicitement activée.

---

# 36. Sauvegarde

## MVP

Stockage local.

## V1.1

Sauvegarde iCloud afin d'éviter la perte des données lors :

- d'un changement d'iPhone ;
- d'une réinstallation ;
- d'une perte ou panne de l'appareil.

---

# 37. Export

Évolution future :

- CSV ;
- JSON ;
- PDF ;
- sauvegarde/import de la bibliothèque.

---

# 38. Critères d'acceptation du MVP

Le MVP est considéré comme fonctionnel lorsque l'utilisateur peut :

- [ ] créer son profil ;
- [ ] définir son objectif calorique ;
- [ ] définir ses macros ;
- [ ] créer un aliment ;
- [ ] modifier un aliment ;
- [ ] rechercher un aliment ;
- [ ] ajouter un aliment aux favoris ;
- [ ] retrouver ses aliments récents ;
- [ ] créer une recette ;
- [ ] ajouter plusieurs aliments à une recette ;
- [ ] calculer automatiquement les valeurs d'une recette ;
- [ ] définir un nombre de portions ;
- [ ] ajouter un aliment à un repas ;
- [ ] ajouter une recette à un repas ;
- [ ] modifier la quantité consommée ;
- [ ] supprimer une entrée ;
- [ ] voir ses calories consommées ;
- [ ] voir ses calories restantes ;
- [ ] encoder une activité physique ;
- [ ] voir ses calories nettes ;
- [ ] voir son budget hebdomadaire ;
- [ ] consulter une journée précédente ;
- [ ] copier un repas précédent ;
- [ ] encoder son poids ;
- [ ] consulter son évolution de poids ;
- [ ] recevoir un badge journalier ;
- [ ] recevoir un badge hebdomadaire ;
- [ ] conserver toutes les données après fermeture et réouverture ;
- [ ] utiliser l'application entièrement hors ligne.

---

# 39. Priorisation du MVP

## Priorité 1 — Cœur fonctionnel

```text
Profil
↓
Bibliothèque aliments
↓
Recettes
↓
Journal quotidien
↓
Calcul calories/macros
```

---

## Priorité 2 — Expérience utilisateur

```text
Favoris
Récents
Recherche
Duplication repas
Navigation calendrier
```

---

## Priorité 3 — Suivi

```text
Activité
Poids
Budget hebdomadaire
Statistiques
```

---

## Priorité 4 — Motivation

```text
Badges
Streaks
Encouragements
```

---

# 40. Architecture évolutive des données alimentaires

Même si le MVP utilise uniquement la base personnelle, le fonctionnement du journal ne doit pas dépendre directement de cette source.

Architecture conceptuelle :

```text
                    JOURNAL
                       │
                       ▼
                Food Repository
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
     Local DB     External Food      AI
                   Providers      Recognition
         │             │             │
         ├─────────────┴─────────────┤
         │                           │
         ▼                           ▼
  Personal Library             Proposed Food
                                     │
                                     ▼
                              User Validation
                                     │
                                     ▼
                                  Journal
```

---

# 41. V1.1 — Kcalvi Convenience

Objectif : réduire encore la friction sans introduire une couche IA complexe.

---

## 41.1 Base alimentaire externe

Sources envisageables :

- Open Food Facts ;
- Nubel ;
- autres fournisseurs ;
- catalogue spécialisé Belgique.

### Objectif

Compléter la bibliothèque personnelle avec des produits vendus notamment chez :

- Delhaize ;
- Colruyt ;
- Carrefour ;
- Albert Heijn ;
- Lidl ;
- Aldi ;
- autres commerces.

### Parcours cible

```text
Recherche externe
↓
Produit sélectionné
↓
Vérification
↓
Ajout au journal
↓
Enregistrement facultatif dans "Mes aliments"
```

---

## 41.2 Scanner de codes-barres

Permettre de scanner un code EAN/UPC avec la caméra.

```text
Scanner le produit
↓
Lecture du code-barres
↓
Recherche externe
↓
Produit trouvé
↓
Affichage nutritionnel
↓
Validation / correction
↓
Ajout au repas
```

Si le produit n'est pas trouvé :

```text
Produit inconnu
↓
Créer un aliment
↓
Code-barres automatiquement associé
```

Une fois enregistré dans la bibliothèque personnelle, le produit doit rester disponible hors ligne.

---

## 41.3 Apple Health

Données potentielles :

- poids ;
- activité physique ;
- calories actives ;
- nombre de pas ;
- entraînements.

### Principes

- permissions explicites ;
- import uniquement des données nécessaires ;
- possibilité de désactiver l'intégration.

---

## 41.4 Sauvegarde iCloud

Données concernées :

- profil ;
- bibliothèque ;
- recettes ;
- journal ;
- poids ;
- activités ;
- badges ;
- préférences.

---

## 41.5 Export / import

Formats envisageables :

- JSON pour sauvegarde complète ;
- CSV pour historique ;
- PDF pour partage ou impression.

---

## 41.6 Templates et duplication intelligente

Fonctions possibles :

- enregistrer un repas type ;
- copier un repas complet ;
- proposer automatiquement les derniers repas similaires.

---

# 42. V2 — Kcalvi AI

Objectif : rendre l'encodage quasi instantané tout en conservant la validation utilisateur.

---

## F-AI01 — Reconnaissance de repas par photo

Depuis le journal :

```text
+ Ajouter
↓
📷 Scanner mon repas
```

L'utilisateur :

1. prend une photo ;
2. ou sélectionne une photo existante ;
3. attend l'analyse ;
4. consulte les aliments détectés ;
5. corrige si nécessaire ;
6. valide le repas.

---

### Exemple

```text
Salade poulet feta

Poulet
120 g
198 kcal

Feta
35 g
92 kcal

Tomates
140 g
25 kcal

Avocat
50 g
80 kcal

────────────────

Total estimé
395 kcal
```

Actions :

```text
[ Modifier ]
[ Ajouter au déjeuner ]
```

---

## F-AI02 — Correction avant validation

Chaque élément détecté doit pouvoir être :

- supprimé ;
- renommé ;
- remplacé ;
- ajouté ;
- associé à un aliment existant ;
- modifié en quantité ;
- modifié en unité.

Le recalcul kcal/macros doit être immédiat.

---

## RM-AI01 — Résultat présenté comme estimation

Les résultats issus de l'IA doivent toujours être identifiés comme des estimations.

---

## RM-AI02 — Validation obligatoire

```text
Analyse IA
≠
Entrée journal
```

Seule une action explicite de l'utilisateur valide l'ajout.

---

# 43. Apprentissage à partir de la bibliothèque personnelle

Kcalvi doit autant que possible utiliser les habitudes et recettes personnelles comme référence.

Exemple :

```text
Cela ressemble à :

★ Salade poulet feta

Utiliser ta recette ?
```

Actions :

```text
[ Utiliser ]
[ Analyser la photo ]
```

### Objectif

Réduire progressivement :

- les corrections ;
- le temps d'encodage ;
- la dépendance à l'IA générique.

---

# 44. Création d'une recette depuis un scan IA

Après validation d'un repas :

```text
Enregistrer ce repas comme recette ?
```

Puis :

```text
Nom :
Salade poulet feta

Portions :
1

[ Enregistrer ]
```

---

# 45. Encodage par texte naturel et voix

## F-AI03 — Texte naturel

Exemple :

```text
J'ai mangé :

150 g de poulet,
200 g de brocoli,
100 g de pommes de terre
et 20 g de sauce.
```

Kcalvi génère une proposition structurée.

---

## F-AI04 — Voix

Exemple :

```text
🎙️

"Ajoute 150 grammes de poulet,
200 grammes de brocoli
et 100 grammes de pommes de terre
au dîner."
```

Puis :

```text
Poulet       150 g
Brocoli      200 g
Pommes terre 100 g

Total estimé : 410 kcal
```

Actions :

```text
[ Modifier ]
[ Ajouter au dîner ]
```

---

## RM-AI03 — Même logique de validation

Photo, texte et voix suivent la même logique :

```text
IA
↓
Proposition
↓
Contrôle utilisateur
↓
Validation
↓
Journal
```

---

# 46. Projection de poids

## F-AI05 — Trajectoire

Kcalvi pourra estimer l'évolution future du poids à partir de l'historique réel.

Exemple :

```text
TA TRAJECTOIRE

Poids actuel
78,4 kg

Objectif
71,0 kg

Si ta tendance actuelle se poursuit :

30 jours    ≈ 76,9 kg
60 jours    ≈ 75,6 kg
90 jours    ≈ 74,4 kg

Objectif estimé :
fin novembre
```

---

## RM-W01 — Données minimales

Aucune projection ne doit être affichée si l'historique est insuffisant.

---

## RM-W02 — Projection indicative

La projection doit toujours être présentée comme une tendance estimée, jamais comme une garantie.

---

# 47. Analytics avancés

Fonctions futures :

- moyenne calorique sur 7 jours ;
- moyenne calorique sur 30 jours ;
- évolution des macros ;
- évolution du poids ;
- comparaison objectif / consommation ;
- régularité d'encodage ;
- nombre de semaines dans la cible ;
- évolution du budget hebdomadaire ;
- activités physiques ;
- tendances.

---

# 48. Widgets iOS

Exemple calories :

```text
KCALVI

1 280 / 1 600 kcal

320 kcal restantes
```

Exemple semaine :

```text
CETTE SEMAINE

8 450 / 11 200 kcal

2 750 kcal disponibles
```

---

# 49. Notifications intelligentes

Notifications facultatives.

### Rappel journal

```text
Il manque encore ton dîner 🍽️
```

### Encouragement

```text
🎯 Journée dans la cible.

Il te reste également
3 280 kcal dans ton budget semaine.
```

### Récapitulatif semaine

```text
🏆 Semaine équilibrée !

10 940 / 11 200 kcal
```

Les notifications doivent pouvoir être désactivées individuellement.

---

# 50. Suggestions intelligentes

Priorité : V3+.

Exemple :

```text
Il te reste environ 420 kcal aujourd'hui.

Tes dîners habituels proches de ce budget :

★ Omelette légumes — 385 kcal
★ Salade poulet feta — 410 kcal
★ Wrap mozzarella — 405 kcal
```

L'objectif est d'exploiter les recettes déjà enregistrées, pas de fournir un conseil médical.

---

# 51. Coaching IA

Priorité : V3+.

Questions possibles :

```text
Combien me reste-t-il cette semaine ?
```

```text
Quels sont mes repas habituels sous 500 kcal ?
```

```text
Quelle recette contient le plus de protéines ?
```

Le coach IA ne doit pas être présenté comme un substitut à un médecin, diététicien ou nutritionniste.

---

# 52. Base collaborative

Priorité : V3+.

Si Kcalvi évolue vers plusieurs utilisateurs, une gouvernance devra gérer :

- origine de la donnée ;
- validation ;
- correction ;
- doublons ;
- signalement d'erreur ;
- qualité nutritionnelle.

---

# 53. Architecture IA

Les fonctionnalités IA ne doivent jamais écrire directement dans la base principale.

```text
Photo / Texte / Voix
        │
        ▼
   AI Provider
        │
        ▼
Nutrition Proposal
        │
        ▼
User Review Layer
        │
        ├── Modifier
        ├── Supprimer
        ├── Ajouter
        └── Changer quantité
        │
        ▼
    Validation
        │
        ▼
     Journal
```

---

# 54. Abstraction AI Provider

L'application ne doit pas être développée autour d'un fournisseur unique.

Interface conceptuelle :

```text
MealRecognitionProvider

recognizeImage(image)
recognizeText(text)
recognizeVoice(audio)
```

Implémentations futures possibles :

```text
GeminiMealRecognition
OpenAIMealRecognition
AppleIntelligenceProvider
OtherProvider
```

Le fournisseur doit pouvoir évoluer sans modifier :

- le journal ;
- la bibliothèque ;
- les recettes ;
- les calculs nutritionnels.

---

# 55. Gestion des données IA

Avant toute intégration IA externe, documenter :

- quelles données quittent l'iPhone ;
- quel fournisseur les reçoit ;
- combien de temps elles sont conservées ;
- si elles sont utilisées pour entraîner un modèle ;
- dans quelle région elles sont traitées ;
- comment l'utilisateur consent ;
- comment l'utilisateur désactive la fonctionnalité.

Le fonctionnement principal de Kcalvi doit rester utilisable sans IA.

---

# 56. Philosophie produit face à l'IA

L'IA doit être utilisée pour :

> **réduire le temps d'encodage, pas retirer le contrôle à l'utilisateur.**

Principe :

```text
Automatiser la saisie
≠
Automatiser la décision
```

---

# 57. Positionnement fonctionnel

Kcalvi ne cherche pas à être :

- une immense bibliothèque nutritionnelle ;
- une application médicale ;
- un coach imposant des règles alimentaires ;
- un outil complexe de bodybuilding.

Kcalvi cherche à offrir :

### 1. Un encodage sans friction

MVP :

- favoris ;
- récents ;
- recettes ;
- duplication.

Puis :

- code-barres ;
- photo ;
- voix ;
- texte naturel.

### 2. Une vision réellement équilibrée des calories

```text
Aujourd'hui
+
Cette semaine
```

Le budget hebdomadaire reste un élément central de l'expérience.

### 3. Une motivation positive

- badges ;
- streaks ;
- régularité ;
- semaines équilibrées ;
- progression du poids.

Sans valorisation de la restriction calorique excessive.

---

# 58. Roadmap produit

## V1 — Kcalvi Core

Objectif : disposer rapidement d'une application personnelle complète et fiable.

- profil ;
- objectif kcal ;
- macros ;
- bibliothèque personnelle ;
- aliments personnalisés ;
- recettes ;
- quantités et portions ;
- journal alimentaire ;
- favoris ;
- récents ;
- recherche ;
- duplication ;
- activités ;
- calories nettes ;
- poids ;
- historique ;
- budget calorique journalier ;
- budget calorique hebdomadaire ;
- badges ;
- streaks ;
- statistiques simples ;
- stockage local ;
- fonctionnement hors ligne.

---

## V1.1 — Kcalvi Convenience

Objectif : réduire la friction sans introduire une couche IA complexe.

- scanner de codes-barres ;
- Open Food Facts ou autre provider ;
- Apple Health ;
- sauvegarde iCloud ;
- export/import ;
- templates de repas ;
- duplication intelligente ;
- amélioration des statistiques ;
- amélioration recherche/favoris/récents.

---

## V2 — Kcalvi AI

Objectif : rendre l'encodage quasi instantané.

- reconnaissance de repas par photo ;
- détection de plusieurs aliments ;
- estimation des portions ;
- estimation kcal/macros ;
- correction individuelle des aliments ;
- validation obligatoire avant ajout ;
- création d'une recette depuis un scan ;
- rapprochement avec les recettes personnelles ;
- encodage vocal ;
- encodage en langage naturel ;
- projection de poids à 30/60/90 jours ;
- widgets iOS ;
- notifications intelligentes ;
- analytics avancés.

---

## V3+ — Kcalvi Smart Ecosystem

À étudier uniquement si le produit évolue au-delà de l'usage personnel :

- base belge enrichie ;
- base communautaire ;
- synchronisation multi-utilisateur ;
- suggestions alimentaires intelligentes ;
- coach IA ;
- plans alimentaires ;
- intégrations Garmin/Fitbit ;
- partage de recettes ;
- fonctionnalités sociales éventuelles.

---

# 59. Principe de priorisation

Toute nouvelle fonctionnalité doit être évaluée selon quatre critères.

### A. Réduit-elle le temps d'encodage ?

Exemple :

```text
Scan photo → OUI
```

### B. Améliore-t-elle la compréhension de l'équilibre ?

Exemple :

```text
Budget hebdomadaire → OUI
```

### C. Aide-t-elle réellement à maintenir la régularité ?

Exemple :

```text
Badges utiles → OUI
```

### D. Augmente-t-elle fortement la complexité technique sans bénéfice immédiat ?

Si oui :

```text
Reporter à une version ultérieure.
```

---

# 60. Vision cible

```text
V1
"Je peux tout encoder facilement."

        ↓

V1.1
"Je dois encoder de moins en moins."

        ↓

V2
"Kcalvi comprend ce que j'ai mangé
et je n'ai plus qu'à vérifier."

        ↓

V3+
"Kcalvi connaît mes habitudes
et m'aide à maintenir mon équilibre."
```

La philosophie centrale reste :

> **Kcalvi — Calories in balance.**
