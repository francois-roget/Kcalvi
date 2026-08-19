# Écrans

Référence visuelle : `Kcalvi ecrans.dc.html` (identifiants 2a → 2s, badge visible sur chaque écran).
Référence de comportement : `Kcalvi Prototype.dc.html`.
Cadre commun : iPhone 390×844, fond sand.100, padding horizontal 22, gap vertical 10–12,
status bar puis contenu scrollable puis TabBar (écrans d'onglet) ou header de navigation (écrans empilés).

---

## 2e · Onboarding — Bienvenue → `features/profile/screens/WelcomeScreen`
Plein écran ink.900. Carré 54 radius 16 azure.400 avec « K », titre « Kcalvi » (40/800, −1.4),
sous-titre 15/600 onDark.muted (max 280 de large) : « Le suivi calorique simple, pensé pour durer.
Ta bibliothèque, tes recettes, ton budget de la semaine. »
Trois arguments à puce 6px (azure.400, terracotta.300, olive) : « Encodage en 3 tapes »,
« Budget hebdomadaire, pas de journée ratée », « 100 % hors ligne, aucune inscription ».
Bas : Button onDark « Commencer » + mention « Tes données restent sur ton iPhone » (12.5/600 onDark.subtle).

## 2f · Onboarding — Profil (étape 1/3) → `features/profile/screens/ProfileSetupScreen`
Barre de progression 3 segments (4px, actif azure.600). Titre « Parle-moi de toi » + explication.
Chips Homme / Femme. Champs : Âge (ans), Taille (cm) sur une ligne ; Poids actuel (kg), Poids cible (kg)
sur la suivante. ListCard « Niveau d'activité » : Sédentaire ×1,2 / Légèrement actif ×1,375 (sélectionné,
valeur azure.600) / Actif ×1,55 / Très actif ×1,725. Button primary « Continuer ».
L'étape 2 (rythme et objectif) est fusionnée dans 2g.

## 2g · Onboarding — Objectif (étape 3/3) → `features/profile/screens/GoalSetupScreen`
HeroCard : « Calories par jour » + 1 600 en display, puis 3 StatTile : Maintien 2 100 / Déficit −500 /
Semaine 11 200. Chips de rythme : 0,25 / 0,5 (sélectionné) / 0,75 kg par semaine.
ListCard macros suggérées : Protéines 100 g, Glucides 160 g, Lipides 60 g.
Encadré info : « Le budget hebdomadaire est activé : un écart un jour se compense sur les autres. »
Button primary « Créer mon profil ». Calculs : Mifflin-St Jeor × facteur d'activité − déficit (RM09 pour la semaine).

## 2a · Aujourd'hui → `features/today/screens/TodayScreen`
TodayHeader (« Bonjour François », date en overline tertiary, badge terracotta.100 « 5 jours »).
HeroCard : ArcGauge 1 245 / 1 600 + StatTile Consommé / Brûlé / Restant (Brûlé cliquable → 2m).
Trois MacroCard. Section « Repas » (overline + « Tout voir » → Journal) : 4 MealCard, le dîner en état vide.
WeeklyBudgetCard en bas (masquable via le réglage Budget hebdomadaire).
Tap sur un repas → 2h préfiltré sur ce repas.

## 2b · Journal → `features/journal/screens/JournalScreen`
Titre « Journal » + mois. DayStrip 7 jours. HeroCard du jour sélectionné : date, kcal / objectif,
pill de statut (« Dans la cible » azure.400 sur fond translucide, « Au-dessus » en terracotta).
MealSection par repas + section Activité (total en terracotta.600, « − 210 kcal »).
Tap sur une ligne = suppression (toast « … retiré »). Note de bas 11.5/500 quaternary.

## 2c · Bibliothèque → `features/library/screens/LibraryScreen`
Titre + bouton + (rond 30, ink.800) → 2j. SearchField. Chips Tout / ★ Favoris / Aliments / Recettes.
HeroCard de comptage en trois colonnes séparées par un filet ink.700 : aliments (blanc),
recettes (terracotta.300), favoris (azure.400).
Sections Recettes puis Aliments : items en Card light, tap recette → 2k, tap ★ = bascule favori.

## 2d · Progression → `features/progress/screens/ProgressScreen`
Titre + SegmentedControl 30 j / 90 j. HeroCard poids : valeur en stat, delta azure.400, WeightChart
(polyline + ligne cible), légende date de début / cible / aujourd'hui.
Deux tuiles : Moyenne / jour (azure.100) et Pesée (terracotta.100, tap → 2n).
Card WeeklyBarsChart « Calories vs objectif » (5 semaines).
Section Badges (« Tout voir » → 2p) : 3 tuiles compactes.
**Ajouter dans le header l'accès aux Réglages** (icône engrenage → 2q), conformément aux specs techniques §4.

## 2h · Ajout rapide → `features/journal/screens/AddEntryScreen`
Header : Annuler / « Ajouter au <repas> » / Créer (→ 2j). SearchField.
Chips Récents / ★ Favoris / Aliments / Recettes. FlatList de résultats (nom + ★, référence, bouton +).
Recherche vide → « Aucun résultat » + « Créer cet aliment ».
Bas : encadré pointillé « Copier le dîner d'hier · 620 kcal ».
Tap sur un item → ouvre 2i.

## 2i · Feuille de quantité → `features/journal/components/QuantitySheet`
BottomSheet sur l'écran d'ajout. Nom + référence, kcal calculées à droite (24/800 azure.600),
champ quantité (18/800) + unité, 3 QuickPortionButton (valeur médiane présélectionnée),
ligne P / G / L à une décimale (nowrap), toggle « Ajouter aux favoris », Button primary
« Ajouter au <repas> ». Recalcul proportionnel à chaque frappe (RM02) ; les valeurs sont **copiées**
dans DiaryEntry à la validation (RM16).

## 2j · Créer un aliment → `features/library/screens/FoodFormScreen`
Header Annuler / Nouvel aliment / Enregistrer. Champ Nom. Chips de référence : pour 100 g / 100 ml / par unité.
Champs Calories, Protéines, Glucides, Lipides (2 par ligne). Portions usuelles : pills existantes + « + Ajouter ».
Card azure.100 d'aperçu (« Aperçu pour 40 g · 106 kcal · P 5,7 g · G 0,6 g · L 8,8 g »).
Toggle favori. Button primary. Validation RM14 au submit via `domain/validation`.

## 2k · Fiche recette → `features/recipes/screens/RecipeDetailScreen`
Header ‹ Retour / Modifier. Titre + « N portions · favori ».
HeroCard : « Par portion » + kcal en 34/800, macros empilées à droite (11.5/600 onDark.muted).
ListCard des ingrédients (nom + quantité en 500 quaternary, kcal à droite). Ligne « Total recette ».
Bas : Button secondary « Dupliquer » (flex 1) + Button primary « Ajouter au repas » (flex 2).

## 2l · Créer une recette → `features/recipes/screens/RecipeFormScreen`
Champ Nom, champs Nombre de portions (+ aide « Cette recette se divise en N portions. Les valeurs
affichées ci-dessous sont pour une portion. ») / Poids total. Picker d'ingrédient : chip de mode
« En portions usuelles » à côté du mode par unité de référence, feuille à hauteur stable ~70 %
d'écran (KCAL-160). ListCard des ingrédients + encadré pointillé « + Ajouter un ingrédient ».
HeroCard « Par portion (calcul auto) » avec kcal et macros recalculées en direct (RM03 puis F09).
Card tone="light" Favori + Toggle, identique à 2j (KCAL-161), juste avant le Button primary.

## 2m · Activité → `features/activity/screens/ActivityFormScreen`
Header Annuler / Activité. Grille 2 colonnes de types (Marche, Course, Vélo, Natation, Musculation, Autre) :
sélectionné = ink.800 / blanc. Quatre durées en pills (15 / 30 / 45 / 60 min).
HeroCard estimation : kcal en terracotta.300 (30/800) + « X kcal par minute » à droite.
Card terracotta.100 d'avertissement sur l'approximation. Button primary.
Estimation = MET × durée (Marche 4,7 kcal/min, Course 10,5, Vélo 7,2, Natation 8,4, Musculation 5,5, Autre 5).

## 2n · Pesée → `features/weight/screens/WeightEntryScreen`
Header Annuler / Pesée / Historique. Date en overline, valeur 60/800 (−2.5) + « kg »,
delta azure.600 sous la valeur. Quatre pas : − 0,5 / − 0,1 / + 0,1 / + 0,5 (Cards blanches).
HeroCard avec WeightChart. ListCard des 4 dernières pesées. Button primary « Enregistrer la pesée ».

## 2o · Budget semaine → `features/today/screens/WeeklyBudgetScreen`
HeroCard : « Semaine 34 · lun → dim », restant en 34/800, ProgressBar 8px, consommées / budget.
ListCard jour par jour : nom (largeur 88), mini-barre proportionnelle (max 2 200 kcal),
kcal, écart signé (azure.600 sous l'objectif, terracotta.600 au-dessus, « en cours » / « à venir » en gris).
Deux tuiles : Reste par jour (azure.100) et Écart cumulé (terracotta.100). Encadré info explicatif.
Calculs RM09–RM12, semaine lundi → dimanche.

## 2p · Badges → `features/progress/screens/BadgesScreen`
HeroCard série en cours (5 jours, record 11 à droite en terracotta.300).
Section Obtenus : 4 Cards light, compteur ×N coloré. Section À débloquer : Cards sand.200,
texte tertiary + progression (« 5 / 7 »). Conditions dans `domain/badges` (F21–F24, RM13).

## 2q · Réglages → `features/profile/screens/SettingsScreen`
Titre « Réglages ». Card dark de profil (avatar azure.400 40px, nom, « Perte de poids · 0,5 kg / semaine »).
Section Objectif calorique : GoalStepper (− / + par 50), sous-titre « semaine 11 200 ».
Section Préférences : ListCard de 3 toggles (Budget hebdomadaire, Semaine commençant lundi, Rappels du soir).
Section Données : Exporter mes données, Réinitialiser la journée (terracotta.600).
Pied de page « Kcalvi 1.0 — hors ligne, sans compte » (11.5/500 quaternary).

## 2r · Objectifs → `features/profile/screens/GoalsScreen`
HeroCard objectif + trois actions (− 50 / + 50 / Recalculer). Chips Automatique / Manuel.
Trois Cards de macro (nom, grammes, pourcentage, ProgressBar). ListCard poids
(actuel, cible, rythme, échéance estimée). Button primary.

## 2s · États vides → `features/today`, `features/library`
- Journée vide : ArcGauge à 0 (piste seule), « Journée à démarrer », 4 MealCard toutes en état vide,
  Card « Reprendre plus vite » avec « Copier hier » et « Mes favoris ».
- Bibliothèque vide : EmptyState « Ta bibliothèque est vide » + « Ajoute les aliments que tu manges
  vraiment. Chacun encodé une fois te servira pour toujours. » + Button primary « Créer mon premier
  aliment » et secondary « Partir d'une liste de base ».
