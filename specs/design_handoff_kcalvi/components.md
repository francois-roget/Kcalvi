# Composants — `src/ui/` et composants de feature

Convention : un dossier par composant, `index.tsx` + `<Nom>.styles.ts` + `<Nom>.test.tsx`
(TECHNICAL_SPECS §9.2). Tous les textes passent par i18next (`i18n/fr.json`), tous les nombres par
`Intl.NumberFormat('fr-BE')`.

## src/ui/

### Text
`variant` : display | stat | h1 | h2 | title | body | bodySm | caption | overline | micro
`color` : clé de `theme.colors.text` ou `onDark`. Wrappe `<Text>` RN, applique le token.

### Button
`variant` : primary | secondary | onDark | ghost · `size` : lg (hauteur 50) | md (hauteur 42)
- primary : fond terracotta.600, texte #fff, radius lg, label title (16/800)
- secondary : fond sand.300, texte primary
- onDark : fond azure.400, texte ink.900 (utilisé sur les fonds ink)
- ghost : pas de fond, texte azure.600, 700/13
Pressed : opacité .92 + assombrissement 8 %. `disabled` : opacité .45.

### Card
`tone` : light (fond #fff, ombre card) | dark (fond ink.800) | info (azure.050 + bordure info) |
accent (azure.100) | warm (terracotta.100) | muted (sand.200) | dashed (bordure 1.5 pointillée border.dashed)
`radius` par défaut 2xl (20), `padding` par défaut 14/16.

### ListCard + ListRow
Une seule Card qui contient N `ListRow` séparés par 1px border.subtle — jamais une carte par ligne.
ListRow : `label`, `value`, `sublabel?`, `accessory?` (chevron | toggle | star), `onPress?`,
padding 13×18, hauteur mini 44.

### Chip
`selected` : fond ink.800 / texte #fff / 700 · sinon fond sand.300 / texte secondary / 600.
Padding 7×14, radius pill. Groupe en ligne, gap 7.

### QuickPortionButton
Valeur de portion : sélectionné = fond #E9F1F6 + texte azure.600 (700), sinon sand.300 + secondary (600).
Radius sm, padding 11×13.

### Toggle
Piste 44×26 radius pill : actif azure.600, inactif #E3DACB. Bouton 20×20 blanc, offset 3.
Transition 200 ms (Reanimated `withTiming`).

### TextField / NumberField
Fond #fff, bordure 1px border.default, radius md, padding 12×14. Label overline-like 11/600 tertiary
au-dessus, gap 6. Unité alignée à droite (caption, quaternary). Valeur : 17/800 pour les nombres,
15/700 pour le texte. Erreur : bordure terracotta.600 + message 11/600 terracotta.600 en dessous
(cas RM14 : valeur négative refusée).

### SearchField
Fond sand.300, radius md, padding 12×16, placeholder 14/500 #9AA5AD. Pas d'icône.

### ArcGauge
`value`, `goal`. react-native-svg : arc `M22 122 A103 103 0 0 1 228 122` dans un viewBox 250×132,
trait 16, `strokeLinecap="round"`, longueur totale 324. Piste ink.700, valeur azure.400 (terracotta.600
si value > goal). Animation `strokeDasharray` 500 ms cubic-bezier(.4,0,.2,1) via Reanimated.
Au centre : valeur en display, sous-titre « sur X kcal » en caption onDark.muted.

### ProgressBar
Hauteur 5 (macros) ou 6–8 (budget), radius pill, piste sand.400 ou ink.700 sur fond sombre.
Animation de largeur 450 ms ease-out.

### MacroCard
`label`, `value`, `goal`, `color` (macro.protein | carbs | fat). Card light radius xl, padding 12×13,
label micro tertiary, valeur 16/800 + « /goal g » en 11/600 #B3BEC6, ProgressBar en bas.
Trois côte à côte, gap 9.

### StatTile
Petite tuile sur fond sombre : fond ink.900, radius md, padding 10×12, label micro onDark.subtle,
valeur 15/700. Variante claire : fond azure.100 ou terracotta.100, radius 2xl, padding 13×15.

### HeroCard
Card dark radius 3xl/4xl. **Un seul par écran.** Contient soit l'ArcGauge + 3 StatTile, soit un couple
label/valeur + valeur secondaire à droite, soit un graphique.

### SegmentedControl
Deux à trois options courtes en pills (30 j / 90 j, Automatique / Manuel) — même style que Chip.

### Toast
Position absolue, left/right 22, bottom 114 (au-dessus de la tab bar), fond ink.800, radius lg,
padding 13×18, texte 13/700 #fff, coche azure.400 à droite. Auto-dismiss 2,2 s, entrée fade + translateY 8.

### BottomSheet (QuantitySheet)
Overlay rgba(15,34,49,.4) ; feuille fond #fff, radius haut 30, padding 18×22 (bas 30), ombre sheet,
poignée 38×4 #E3DACB centrée. Fermeture par tap sur l'overlay. Contenu : nom + référence, kcal calculées
(h2 → 24/800 azure.600), champ quantité + 3 QuickPortionButton, ligne P/G/L (nowrap), Button primary.

### TabBar
4 onglets, bordure haute 1px sand.400, fond sand.100, padding 11 haut / 24 bas, labels 11 :
actif 700 azure.600, inactif 600 text.quaternary.

### EmptyState
Icône ou chiffre dans un carré 64 radius xl (fond azure.100), titre 19/800, texte 13/600 tertiary
centré (line-height 1.55), puis un Button primary et un Button secondary empilés (gap 9).

## Composants de feature

| Composant | Feature | Rôle |
|---|---|---|
| TodayHeader | today | Salutation + date + badge de série |
| MealCard | today | Repas : titre, résumé des aliments, total kcal ; état vide = fond azure.050 + bordure info + « + Ajouter » |
| WeeklyBudgetCard | today | Carte azure.100 : restant, 7 barres de jour, total / budget ; tap → écran Budget semaine |
| DayStrip | journal | 7 jours : cellule Card 14 radius, numéro 13/800, point de statut 5px (azure.600 dans la cible, terracotta.600 au-dessus, sand.300 futur) ; jour courant = fond ink.800 |
| MealSection | journal | Titre overline + total à droite, puis ListCard des entrées ; tap sur une ligne = suppression avec confirmation |
| FoodSearchList | library, journal | FlatList de résultats, item = nom (+ ★) / référence / bouton + |
| FoodForm | library | React Hook Form : nom, référence (100 g / 100 ml / unité), kcal, P, G, L, portions rapides, favori |
| RecipeForm, RecipeDetail | recipes | Ingrédients en ListCard, totaux par portion calculés (RM03, F09) |
| ActivityPicker | activity | Grille 2 colonnes de types + durées en 4 pills + estimation en HeroCard |
| WeightEntry | weight | Grande valeur (60/800, −2.5), pas ±0,1 / ±0,5, courbe, historique |
| WeightChart | weight, progress | Polyline react-native-svg azure.400 (trait 3, caps arrondis) + ligne cible terracotta.300 pointillée 4/5 |
| WeeklyBarsChart | progress | 5 barres Views, radius 6, hauteur proportionnelle ; au-delà de l'objectif terracotta.600, semaine en cours azure.300 |
| BadgeList | progress | Obtenus : Card light + compteur coloré ; à débloquer : Card muted, texte tertiary + progression |
| GoalStepper | profile | Objectif kcal avec − / + par pas de 50, minimum 1 200 ; recalcule le budget semaine (RM09) |
