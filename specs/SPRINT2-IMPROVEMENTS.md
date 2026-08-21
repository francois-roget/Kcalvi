# Sprint 2 — Améliorations issues de la passe de test

**Origine :** retours du testeur sur les écrans Bibliothèque (2c), Créer un aliment (2j),
Fiche recette (2k) et Créer une recette (2l), après livraison du Sprint 2.
**Réfère à :** `SPRINT2-DETAILS.MD`, `Kcalvi_Specifications_Produit_v1.0.md` (F08–F09, RM03, RM14–RM16),
`design_handoff_kcalvi/screens.md` (2c, 2i, 2j, 2k, 2l), `design_handoff_kcalvi/components.md`.
**Numérotation :** reprend la suite de KCAL-151 (dernier ticket du Sprint 2).

Chaque ticket est cadré en deux temps : **la demande produit** (constat, cause, décision) puis
**le cadrage technique** (fichiers, contrat, pièges, critères d'acceptation). L'objectif est qu'un
développeur puisse prendre un ticket sans avoir à rouvrir la discussion.

---

## Décisions produit prises

Quatre remarques du testeur ouvraient des choix qui changent le périmètre. Elles sont tranchées ici,
et ces décisions font autorité sur les tickets qui en découlent.

| # | Sujet | Décision | Conséquence |
|---|---|---|---|
| D1 | Supprimer une recette | **Archivage**, pas de destruction | Migration schéma v4 (`recipes.is_archived`) — cf. KCAL-162 |
| D2 | Supprimer un aliment utilisé dans une recette | **Le bouton « Supprimer quand même » disparaît** ; seul « Archiver » est proposé | RM15 est appliqué strictement, on ne casse jamais une recette — cf. KCAL-153 |
| D3 | Afficher les kcal sur les cards recette | **Calcul à la volée** dans la liste (pas de dénormalisation) | Requiert un helper de lecture groupée pour éviter le N+1 — cf. KCAL-158 |
| D4 | « Portions rapides » | **Vrai modèle multi-portions** (table `food_portions`) | Chantier structurant, migration v5 — cf. lot D |

**Note de séquencement (importante).** D4 est un chantier de ~20 h. Le faire *avant* le Sprint 3
n'est pas un luxe : l'écran 2i (« Feuille de quantité », `AddEntryScreen`) prévoit lui aussi
« 3 QuickPortionButton, valeur médiane présélectionnée ». Si le modèle multi-portions n'existe pas,
cet écran devra être écrit deux fois. Recommandation : intercaler le lot D entre ce lot de
corrections et le Sprint 3.

---

## Vue d'ensemble

| Lot | Ticket | Titre | Type | Prio | Est. |
|---|---|---|---|---|---|
| **A** | KCAL-152 | « null » affiché dans les champs à l'édition d'un aliment | Bug | P0 | 3 h |
| **A** | KCAL-153 | « Supprimer quand même » ne supprime rien (no-op silencieux) | Bug | P0 | 3 h |
| **A** | KCAL-154 | Libellé « Dupliquer » coupé sur deux lignes | Bug UI | P0 | 1 h |
| **B** | KCAL-155 | Griser « Enregistrer » tant que la recette n'a aucun ingrédient | UX | P1 | 2 h |
| **B** | KCAL-156 | Bouton (×) d'effacement dans le champ de recherche | UX | P1 | 2 h |
| **B** | KCAL-157 | Quick filters : masquer les sections hors périmètre du filtre | UX | P1 | 2 h |
| **B** | KCAL-158 | Libellés « X kcal pour 100 g » / « X kcal pour 1 portion » | UX | P1 | 5 h |
| **B** | KCAL-159 | Lever l'ambiguïté du mot « portion » | UX / contenu | P1 | 2 h |
| **B** | KCAL-160 | Agrandir la feuille d'ajout d'ingrédient | UX | P1 | 3 h |
| **C** | KCAL-161 | Toggle favori dans le formulaire de recette | Fonctionnalité | P1 | 2 h |
| **C** | KCAL-162 | Archiver une recette (+ migration v4) | Fonctionnalité | P1 | 8 h |
| **D** | KCAL-163 | Modèle multi-portions `food_portions` (+ migration v5) | Chantier | P2 | 14 h |
| **D** | KCAL-164 | Portions rapides dans le picker d'ingrédient | Fonctionnalité | P2 | 4 h |
| — | KCAL-165 | Tests de non-régression du lot | Tests | P1 | 5 h |
| | | | | **Total** | **~56 h** |

---

# Lot A — Anomalies (P0)

Ces trois points sont des défauts de la livraison Sprint 2, pas des évolutions. Ils passent avant
tout le reste.

---

## KCAL-152 — « null » affiché dans les champs non renseignés à l'édition d'un aliment

> *Remarque testeur : « Édition d'un ingrédient : il est écrit "null" dans les champs pour lesquels
> on n'avait pas renseigné de valeur à la création. »*

### Analyse

Cause exacte, identifiée dans le code. WatermelonDB stocke une colonne optionnelle non renseignée
comme `NULL` en SQLite et la relit en **`null`**, pas en `undefined`. Le modèle
`src/data/database/models/Food.ts` la type pourtant `number | undefined` (`@field('fiber') fiber?: number`) :
c'est un mensonge de typage que TypeScript ne peut pas rattraper, et `toDomainFood` le propage tel
quel jusqu'au domaine.

En bout de chaîne, `FoodFormScreen.tsx:109` :

```ts
function numberToText(value: number | undefined): string {
  if (value === undefined) return '';   // null passe à travers
  return String(value).replace('.', ',');  // String(null) === "null"
}
```

Les champs concernés sont **Fibres** et **Sucre** (les seuls numériques réellement optionnels ;
protéines/glucides/lipides passent par `toNumberOrZero` à l'écriture et valent donc toujours 0).

**Le même défaut produit un second symptôme non signalé par le testeur :** une pill fantôme
« null g » dans la section *Portions rapides*, parce que `FoodFormScreen.tsx:568` teste
`servingQuantity !== undefined` — ce qui est vrai quand la valeur est `null`. À corriger dans le
même ticket.

C'est une classe de bug, pas un cas isolé : elle se reproduira sur chaque nouvelle colonne
optionnelle (`notes` de `Recipe`, futures colonnes du Sprint 3). Le correctif doit donc être posé
au niveau du mapping, pas du formulaire.

### Cadrage technique

**Correctif principal — normaliser à la frontière data → domaine.**
Ajouter un helper partagé et l'appliquer dans les deux mappers `toDomainFood`
(`LocalFoodRepository.ts` **et** la copie de `getRecipeWithIngredients.ts`) ainsi que dans
`toDomainRecipe` (`notes`) :

```ts
// src/data/repositories/mapping.ts (nouveau)
/** WatermelonDB reads an unset optional column back as `null`, while the domain types
 *  declare `T | undefined`. Normalize at the data/domain boundary so no `null` ever
 *  reaches a screen (a raw `null` renders as the string "null" in a TextField). */
export function optional<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}
```

Appliquer sur : `brand`, `fiber`, `sugar`, `servingQuantity`, `servingUnit`, `category`, `barcode`,
`source` (Food) et `notes` (Recipe).

**Point d'attention :** `toDomainFood` est aujourd'hui **dupliqué** entre `LocalFoodRepository.ts` et
`getRecipeWithIngredients.ts`. Profiter du ticket pour l'extraire dans `mapping.ts` et le partager —
sinon le correctif ne s'appliquera qu'à la moitié des chemins de lecture.

**Ceinture et bretelles.** Rendre `numberToText` défensif malgré tout
(`if (value === undefined || value === null) return ''`) : le typage ne protège pas d'une
régression future dans le mapping.

**Hors périmètre :** ne pas re-typer les modèles WatermelonDB en `T | null`. Le domaine reste sur
`T | undefined` (`TECHNICAL_SPECS.MD` §2.2) ; c'est le mapping qui absorbe l'écart.

### Critères d'acceptation

- Créer un aliment sans fibres ni sucre, l'enregistrer, le rouvrir en édition : les champs Fibres et
  Sucre sont **vides**, pas « null ».
- Créer un aliment sans portion rapide, le rouvrir : **aucune** pill n'est affichée à côté de
  « + Ajouter ».
- Un test unitaire dbtest couvre `toDomainFood` sur un enregistrement dont toutes les colonnes
  optionnelles sont absentes → toutes les propriétés valent `undefined`.

**Estimation : 3 h.**

---

## KCAL-153 — « Supprimer quand même » ne supprime rien (no-op silencieux)

> *Remarque testeur : « Quand je veux supprimer un aliment, je vois "cet aliment est utilisé dans
> 1 recette". C'est très bien. On me propose "Archiver" ou "Supprimer quand même". Quel va être le
> comportement de chaque option ? »*

### Réponse à la question posée

Aujourd'hui, dans le code livré :

| Option | Comportement réel | Verdict |
|---|---|---|
| **Archiver** | `foodRepository.archive()` passe `is_archived = true`. L'aliment disparaît de la recherche bibliothèque, **mais reste lié aux recettes** : `getRecipeWithIngredients` le retrouve par `id` sans filtrer l'archivage, donc les recettes continuent d'afficher les bonnes calories. C'est le comportement attendu. | ✅ Correct |
| **Supprimer quand même** | **Rien.** `foodRepository.delete()` rejoue `checkFoodDeletable` en interne et renvoie `err(FOOD_IN_USE)` ; `LibraryScreen.handleConfirmDelete` ignore le `Result` et referme la feuille. L'utilisateur croit avoir supprimé, l'aliment est toujours là. | ❌ Bug |

Et si on « réparait » le bouton dans le sens littéral de son libellé, ce serait pire : la ligne
`recipe_ingredients` resterait orpheline, `getRecipeWithIngredients` renverrait
`RECIPE_INGREDIENT_FOOD_NOT_FOUND`, et **la fiche recette entière afficherait « Recette introuvable »**.
Un aliment supprimé ferait donc disparaître la recette qui l'utilise.

### Décision produit (D2)

**Le bouton « Supprimer quand même » est retiré.** Quand un aliment est utilisé, les seules options
sont *Archiver* et *Annuler*. C'est l'application stricte de RM15, et cela supprime d'un coup le
no-op silencieux et le risque de recette cassée.

Le dialogue doit en plus **expliquer** ce que fait l'archivage — c'est précisément ce que le testeur
demandait. Nouveau contenu :

> **Titre :** « Cet aliment est utilisé dans 1 recette »
> **Message :** « Il ne peut pas être supprimé sans casser cette recette. En l'archivant, il
> disparaît de ta bibliothèque mais reste disponible dans les recettes qui l'utilisent. »
> **Actions :** `Archiver` (primary) · `Annuler` (ghost)

Le cas « aliment non utilisé » est inchangé : `Supprimer` / `Annuler`.

### Cadrage technique

**`src/features/library/screens/LibraryScreen.tsx`**
- `DeleteFoodSheet` : dans la branche `isInUse`, ne plus rendre le bouton `confirmAnyway`.
  `Archiver` devient `variant="primary"`, `Annuler` reste `ghost`. Le `testID`
  `library.deleteDialog.confirm` ne doit plus exister dans cette branche (le test KCAL-150 qui
  s'appuie dessus est à ajuster).
- `handleConfirmDelete` / `handleArchiveInstead` : **traiter le `Result`**. En cas d'échec, ne pas
  refermer la feuille et afficher le message d'erreur. C'est la cause racine du symptôme ; la laisser
  en place ferait revenir la classe de bug ailleurs.

**`src/i18n/fr.json`** — sous `library.deleteDialog` : réécrire `inUseMessage`, supprimer la clé
`confirmAnyway` devenue morte, ajouter `archiveError`.

**Ne pas toucher** à `foodRepository.delete()` ni à `checkFoodDeletable` : leur comportement est
correct, c'est l'UI qui promettait autre chose.

**Question laissée ouverte, hors périmètre :** aucun écran ne permet aujourd'hui de *désarchiver* un
aliment. À traiter dans un ticket dédié (écran Réglages ou filtre « Archivés » dans la bibliothèque).

### Critères d'acceptation

- Aliment utilisé dans ≥ 1 recette → la feuille propose exactement *Archiver* et *Annuler*, et le
  message explique la conséquence de l'archivage.
- Après archivage : l'aliment disparaît de la liste Aliments ; la fiche recette qui l'utilise
  s'ouvre normalement et affiche les mêmes calories qu'avant.
- Aliment non utilisé → feuille *Supprimer* / *Annuler* inchangée, la suppression fonctionne.
- Si le repository renvoie une erreur, la feuille reste ouverte avec un message ; elle ne se referme
  jamais en silence sur un échec.

**Estimation : 3 h.**

---

## KCAL-154 — Le libellé « Dupliquer » se coupe sur deux lignes

> *Remarque testeur : « Détail recette → "Dupliquer" : le "R" est sur une nouvelle ligne. »*

### Analyse

Pur problème de largeur, calculable. Sur `RecipeDetailScreen`, la rangée du bas suit le handoff
(`screens.md` 2k : « Dupliquer (flex 1) + Ajouter au repas (flex 2) ») :

```
iPhone 390 pt − 2 × 22 (screenPaddingH) − 12 (gap) = 334 pt
Bouton « Dupliquer » = 334 × 1/3 ≈ 111 pt
− 2 × 18 (Button paddingHorizontal = spacing[6]) = 75 pt utiles
« Dupliquer » en Manrope_800ExtraBold 16 ≈ 81 pt
```

Il manque ~6 pt, le dernier caractère bascule à la ligne — et comme `Button` impose
`height: 50` avec `justifyContent: center`, la deuxième ligne déborde. Sur iPhone SE (375 pt) l'écart
est encore plus large. Le problème n'apparaîtra pas qu'ici : `Button` n'a **aucune** protection contre
le retour à la ligne, donc tout libellé long dans un conteneur contraint le reproduira.

### Cadrage technique

Correctif au niveau du composant, `src/ui/Button/Button.tsx` :

1. Ajouter `numberOfLines={1}` sur le `<Text>` interne — un bouton n'est jamais multiligne dans ce
   design system.
2. Ajouter `adjustsFontSizeToFit` avec `minimumFontScale={0.85}` pour absorber les cas limites
   comme celui-ci sans troncature visible.
3. Réduire `paddingHorizontal` à `theme.spacing[4]` (14) pour `size="md"`, en conservant
   `spacing[6]` (18) pour `size="lg"` — le padding actuel est calibré pour des boutons pleine
   largeur.

Ne **pas** changer le ratio flex 1 / flex 2 : il vient du handoff design et le rééquilibrer
déséquilibrerait la hiérarchie voulue entre l'action principale et l'action secondaire.

Vérifier au passage `RecipeFormScreen` (feuille du picker : `Annuler` / `Ajouter` côte à côte) et le
header à trois zones (`Annuler` / titre / `Enregistrer`), qui présentent la même contrainte.

### Critères d'acceptation

- Sur iPhone SE (375 pt) comme sur iPhone 15 Pro Max, « Dupliquer » tient sur une ligne, centré,
  sans troncature ni débordement vertical.
- Aucun autre bouton de l'app ne régresse en taille de police (revue visuelle sur 2c, 2j, 2k, 2l).

**Estimation : 1 h.**

---

# Lot B — Cohérence et clarté (P1)

---

## KCAL-155 — Griser « Enregistrer » tant que la recette n'a aucun ingrédient

> *Remarque testeur : « Il n'est pas possible de créer une recette sans ingrédient mais le bouton
> "Enregistrer" est quand même disponible → soit on laisse créer une recette vide, soit on grise le
> bouton. »*

### Décision produit

**On grise.** Une recette sans ingrédient n'a aucune valeur produit (les calories par portion
vaudraient 0) et l'autoriser polluerait la bibliothèque. La règle « ≥ 1 ingrédient » de KCAL-135
reste, mais elle doit être **visible avant** le tap, pas révélée après.

Principe à appliquer, à documenter pour toute la suite du projet :

- **Grisé** = l'action est structurellement impossible (ici : zéro ingrédient). L'utilisateur voit
  tout de suite qu'il lui manque quelque chose.
- **Erreur inline au submit** = un champ est mal rempli (nom vide, portions ≤ 0). On ne grise pas sur
  un champ pas encore saisi, ce serait hostile.

Le bouton grisé doit porter un `accessibilityHint` qui dit pourquoi — sans quoi c'est un cul-de-sac
pour un utilisateur VoiceOver.

### Cadrage technique

**`src/features/recipes/screens/RecipeFormScreen.tsx`**
- `const canSubmit = ingredients.length > 0 && !submitting;`
- L'appliquer aux **deux** points de sortie : `recipeForm.header.save` (ligne ~537) et
  `recipeForm.submit` (ligne ~699). Les deux existent, oublier l'un des deux laisse le trou ouvert.
- Ajouter `accessibilityHint={t('recipeForm.submitDisabledHint')}` quand `canSubmit` est faux.
- **Conserver** le garde-fou `if (ingredients.length === 0)` dans `onValid` : défense en profondeur,
  il ne coûte rien.
- L'erreur `recipeForm.errors.noIngredients` devient inatteignable par l'UI mais reste utile côté
  test — ne pas supprimer la clé.

**`src/i18n/fr.json`** — ajouter `recipeForm.submitDisabledHint` :
« Ajoute au moins un ingrédient pour enregistrer cette recette. »

Le rendu « désactivé » existe déjà dans `Button` (`opacity: 0.45` + `accessibilityState.disabled`),
rien à créer côté design system.

### Critères d'acceptation

- Formulaire vierge : les deux boutons Enregistrer sont visuellement grisés et inertes au tap.
- Après ajout du premier ingrédient : les deux redeviennent actifs immédiatement.
- Après suppression du dernier ingrédient : les deux redeviennent grisés.
- VoiceOver annonce le bouton comme désactivé et lit l'indication.

**Estimation : 2 h.**

---

## KCAL-156 — Bouton (×) d'effacement dans le champ de recherche

> *Remarque testeur : « Bibliothèque : quand le champ de recherche contient quelque chose, permettre
> de le vider en cliquant sur une icône (×) sur la droite du champ. »*

### Décision produit

**Accepté**, avec une réserve à tracer : `components.md` spécifie explicitement pour `SearchField`
« *Fond sand.300, radius md, padding 12×16, placeholder 14/500 #9AA5AD.* **Pas d'icône.** ».
C'est donc un **écart assumé au handoff design**, motivé par l'usage : sur iOS, effacer un champ
caractère par caractère est le geste le plus pénible d'un formulaire, et c'est un pattern natif
attendu. `components.md` doit être mis à jour dans le même ticket — pas de divergence silencieuse
entre le design system documenté et le code.

Le bouton apparaît **uniquement** quand le champ est non vide, pour préserver la sobriété visuelle
du champ au repos.

### Cadrage technique

**`src/ui/SearchField/SearchField.tsx`** — le composant est aujourd'hui un `TextInput` nu ; il doit
devenir un conteneur.

```
<View>                      // fond sand.300, radius md, flexDirection row, alignItems center
  <TextInput style={{ flex: 1 }} ... />
  {onClear && value ? <Pressable ...><Ionicons name="close-circle" /></Pressable> : null}
</View>
```

Contraintes non négociables :
- **Le style visuel (fond, radius, padding, typo) doit rester strictement identique** : il migre du
  `TextInput` vers le `View` conteneur, il ne se recalcule pas. Le padding droit du `TextInput` doit
  être réduit pour laisser la place à l'icône, sans décaler le texte au repos.
- Nouvelle prop **optionnelle** `onClear?: () => void`. Sans elle, le composant se comporte
  exactement comme aujourd'hui — pas de régression sur d'éventuels autres usages.
- `accessibilityLabel={t('common.clearSearch')}` (i18n obligatoire, `AGENTS.md`), `hitSlop={10}`,
  `accessibilityRole="button"`, cible tactile ≥ 44 pt (`theme.layout.minTouchTarget`).
- **Le champ ne doit pas perdre le focus** au tap : ne pas remonter le vidage via un `blur`, se
  contenter d'appeler `onClear`.

**Deux appelants à câbler** — ne pas en oublier un :
- `LibraryScreen.tsx:548` → `onClear={() => setSearchQuery('')}`
- `RecipeFormScreen.tsx:714` (picker d'ingrédient) → `onClear={() => setIngredientQuery('')}`

Effet de bord attendu et souhaitable : le vidage repasse par le `useDebouncedValue` de 250 ms, la
liste se rafraîchit donc comme lors d'une saisie normale. Pas de traitement spécial.

**`specs/design_handoff_kcalvi/components.md`** — remplacer « Pas d'icône » par la description du
bouton d'effacement conditionnel.

### Critères d'acceptation

- Champ vide → aucune icône ; champ non vide → icône (×) à droite, alignée verticalement.
- Tap sur (×) → champ vidé, liste complète restaurée, clavier toujours ouvert et champ toujours
  focalisé.
- Identique dans la bibliothèque et dans le picker d'ingrédient.
- Aucun décalage visuel du placeholder ni du texte saisi par rapport à la version actuelle.

**Estimation : 2 h.**

---

## KCAL-157 — Quick filters : masquer les sections hors périmètre du filtre

> *Remarque testeur : « Dans les Quick filters, si on choisit "Aliment", il ne faut pas afficher la
> section "recettes" avec "Aucun résultat" dedans, ça tombe sous le sens. Pareil pour le Quick
> filter "Recettes". »*

### Analyse

Le testeur a raison, et la cause est nette : `filteredFoods` / `filteredRecipes`
(`LibraryScreen.tsx:407-433`) renvoient un tableau vide pour la catégorie exclue, mais le rendu
(lignes 605-663) affiche les deux `SectionBlock` inconditionnellement. « Aucun résultat » est alors
lu comme *« il n'y a aucune recette »* alors que le sens réel est *« tu as demandé à ne pas en
voir »*. C'est un message qui ment.

### Décision produit

Le filtre pilote la **présence** de la section, pas seulement son contenu :

| Filtre | Section Recettes | Section Aliments |
|---|---|---|
| Tout | affichée | affichée |
| ★ Favoris | affichée | affichée |
| Aliments | **masquée** | affichée |
| Recettes | affichée | **masquée** |

Le message « Aucun résultat » ne subsiste que dans une section **pertinente** mais vide — par exemple
filtre ★ Favoris sans aucune recette favorite : là, l'information est vraie et utile.

Cas limite à traiter dans le même ticket : quand **toutes** les sections visibles sont vides (typique
d'une recherche sans résultat), afficher un message global unique
« Aucun résultat pour « *terme* » » plutôt que deux « Aucun résultat » empilés. À ne pas confondre
avec l'état bibliothèque vide (`LibraryEmptyState`, KCAL-108), qui ne concerne qu'une bibliothèque
neuve sans recherche en cours — la distinction existe déjà via `isLibraryEmpty` (ligne 403), la
préserver.

### Cadrage technique

**`src/features/recipes` : rien. `src/features/library/screens/LibraryScreen.tsx` uniquement.**

- Deux dérivés explicites, à côté de `filteredFoods` / `filteredRecipes` :
  ```ts
  const showRecipesSection = selectedFilter !== 'foods';
  const showFoodsSection = selectedFilter !== 'recipes';
  ```
  Les nommer plutôt que d'inliner la condition dans le JSX : la règle est produit, elle doit être
  lisible d'un coup d'œil.
- Le bouton « + » de création de recette vit **dans le header de la section Recettes**
  (`library.addRecipeButton`, ligne 610). Masquer la section le masque aussi. C'est acceptable — le
  « + » global du titre d'écran reste accessible — mais c'est un choix à assumer explicitement, pas
  un effet de bord.
- Le compteur du `HeroCard` **n'est pas filtré** : il reflète le contenu réel de la bibliothèque
  (éventuellement restreint par la recherche), indépendamment du chip actif. Ne pas le brancher sur
  `selectedFilter`.

**`src/i18n/fr.json`** — ajouter `library.list.noResultsForQuery` (« Aucun résultat pour « {{query}} » »)
et **supprimer la clé morte `library.sections.recipesComingSoon`**, vestige du stub KCAL-107.

### Critères d'acceptation

- Filtre *Aliments* → la section Recettes n'existe pas dans l'arbre de rendu (assertion sur l'absence
  du `testID`, pas seulement sur l'absence de cards).
- Filtre *Recettes* → idem pour la section Aliments.
- Filtre *★ Favoris* sans recette favorite → la section Recettes est présente avec « Aucun résultat ».
- Recherche sans aucun résultat → un seul message global mentionnant le terme recherché.

**Estimation : 2 h.**

---

## KCAL-158 — Libellés « X kcal pour 100 g » et « X kcal pour 1 portion »

> *Remarque testeur : « Dans la liste des aliments, il y a dans chaque ligne "100g", il faudrait
> plutôt mettre "X Kcal pour 100g". Pareil pour les recettes, il faudrait mettre "X KCal pour
> 1 portion". »*

### Analyse

Demande légitime : la calorie est l'information que l'utilisateur cherche en scannant sa
bibliothèque ; « 100 g » seul n'a aucune valeur décisionnelle. Les deux moitiés de la demande ont
toutefois des coûts très différents.

**Côté aliments — trivial.** `Food` porte déjà `calories` pour `referenceQuantity`. La ligne
`LibraryScreen.tsx:163` n'a qu'à être enrichie. Elle contient d'ailleurs **un bug i18n latent** :
`{food.referenceUnit}` affiche le code brut, donc un aliment « par unité » s'affiche aujourd'hui
« 1 unit » et non « 1 unité ». `RecipeFormScreen` a une fonction `unitLabel()` (ligne 157) qui
résout exactement ce problème — elle doit être partagée.

**Côté recettes — structurant.** `Recipe` ne porte aucune calorie. La décision Sprint 2
(`SPRINT2-DETAILS.MD`) posait explicitement : « *`RecipeRepository.search()` n'observe que la table
`recipes` […] l'écran 2c n'affiche pas de kcal sur la card recette, donc pas besoin de calculer un
total pour la liste.* » **Cette décision est levée par D3.**

### Décision produit (D3)

Calcul **à la volée**, sans dénormalisation. Une valeur stockée sur `recipes` serait plus rapide mais
deviendrait fausse dès qu'un aliment est modifié après coup — un chiffre calorique faux est pire que
pas de chiffre. À l'échelle d'une bibliothèque personnelle, le calcul direct est largement tenable
**à condition de ne pas le faire naïvement**.

Formats retenus :
- Aliment : `« 64 kcal pour 100 g »` · `« 24 kcal pour 100 ml »` · `« 78 kcal par unité »`
  (le cas `unit` a `referenceQuantity = 1`, « pour 1 unité » sonnerait faux)
- Recette : `« 420 kcal par portion · 4 portions »`

### Cadrage technique

**Le piège à éviter : le N+1.** L'approche évidente — appeler `getRecipeWithIngredients` pour chaque
recette affichée — coûte `1 + N` requêtes par recette, soit ~300 requêtes pour 50 recettes de
5 ingrédients, **à chaque frappe dans la recherche** (débouncée à 250 ms). Inacceptable.

**Helper à écrire : `src/data/repositories/getRecipesCalories.ts`**

```ts
/** Per-portion calories for a batch of recipes, in 2 queries total (not 2 per recipe).
 *  Used by the library list, where showing kcal per recipe card would otherwise mean
 *  one ingredients query + one food query per ingredient, per recipe, per keystroke. */
export async function getRecipesCalories(
  database: Database,
  recipes: Recipe[],
): Promise<Map<string, number>>
```

Implémentation imposée :
1. `recipe_ingredients` où `Q.where('recipe_id', Q.oneOf(recipeIds))` → **1 requête**
2. `foods` où `Q.where('id', Q.oneOf(uniqueFoodIds))` → **1 requête**
3. Regroupement en mémoire, puis `calculateRecipeTotals` → `calculatePortionNutrition` par recette.
   Réutiliser les fonctions de `domain/calculations` telles quelles ; ne surtout pas réécrire le
   calcul dans la couche data.

**`LibraryScreen.tsx`** — un `useEffect` sur `recipes` remplit un `Map<recipeId, kcal>` en state.
Reprendre exactement le pattern anti-course déjà en place pour `foodUsages` (ligne 452) : drapeau
`cancelled` dans le cleanup, sinon une recherche rapide affichera les calories de la requête
précédente.

**Limite connue, à assumer et documenter en commentaire.** L'observable `recipeRepository.search()`
n'observe que la table `recipes`. Si l'utilisateur modifie les calories d'un **aliment**, l'observable
ne ré-émet pas et les kcal affichées sur les cards recette restent périmées jusqu'au prochain
changement de recherche ou remontage de l'écran. Atténuation retenue : recalculer sur
`useFocusEffect` (React Navigation), ce qui couvre le parcours réel « j'édite un aliment → je reviens
sur la bibliothèque ». Ne **pas** ouvrir un observable joint pour ce seul affichage.

**Affichage — état de chargement.** Le calcul est asynchrone alors que la liste est déjà rendue. Ne
pas afficher « 0 kcal » pendant le chargement (chiffre faux) : afficher d'abord « N portions » seul,
puis compléter la ligne. Pas de spinner par card.

**Partage de `unitLabel`.** Extraire `unitLabel()` de `RecipeFormScreen.tsx:157` vers
`src/utils/format.ts` (ou `src/i18n/units.ts`) et l'utiliser dans `LibraryScreen`, `RecipeFormScreen`
et `RecipeDetailScreen`. Corrige le « 1 unit » au passage.

**`src/i18n/fr.json`** — nouvelles clés `library.food.kcalPerReference`,
`library.food.kcalPerUnit`, `library.recipe.kcalPerPortion`.

### Critères d'acceptation

- Card aliment « pour 100 g » → « 64 kcal pour 100 g » ; « par unité » → « 78 kcal par unité »
  (jamais « unit »).
- Card recette → « 420 kcal par portion · 4 portions », cohérent au kcal près avec la valeur affichée
  sur la fiche 2k de la même recette.
- Un test de performance ou une revue de code atteste que l'affichage de N recettes déclenche
  **2 requêtes**, pas `2 × N`.
- Après édition des calories d'un aliment puis retour sur la bibliothèque, les kcal des recettes
  concernées sont à jour.

**Estimation : 5 h.**

---

## KCAL-159 — Lever l'ambiguïté du mot « portion »

> *Remarque testeur : « À quoi correspond "nb de portions" dans une recette ? »*

### Réponse et analyse

Réponse produit (F09, `Kcalvi_Specifications_Produit_v1.0.md`) : c'est **le nombre de parts que
donne la recette**. Il sert de diviseur : `calories par portion = calories totales / nombre de
portions`. Une recette à 4 portions et 1 680 kcal au total affiche 420 kcal par portion.

Si le testeur pose la question, le libellé a échoué — et la cause dépasse ce seul champ.
**L'application emploie le mot « portion » pour deux notions différentes :**

| Contexte | Sens réel | Où |
|---|---|---|
| Aliment — « Portions rapides » | **taille** d'une portion (1 pot = 150 g) | 2j, `Food.servingQuantity` |
| Recette — « Portions » | **nombre** de parts | 2l / 2k, `Recipe.servings` |

Le formulaire de recette (2l) mélange littéralement les deux : le champ « Portions » (nombre de
parts) coexiste avec un picker d'ingrédient dont le chip « En portions » désigne la taille de portion
de l'aliment. La confusion est structurelle, pas cosmétique.

### Décision produit

Séparer le vocabulaire une bonne fois :

| Écran | Avant | Après |
|---|---|---|
| 2l — champ | « Portions » | « Nombre de portions » + aide « Cette recette se divise en N portions. Les valeurs affichées ci-dessous sont pour une portion. » |
| 2j — section | « Portions rapides » | « Portions usuelles » |
| 2l — chip picker | « En portions » | « En portions usuelles » |
| 2k — sous-titre | « 4 portions » | inchangé (sans ambiguïté en lecture) |

Le libellé du HeroCard « Par portion (calcul auto) » reste : associé au texte d'aide, il devient
explicite.

### Cadrage technique

Ticket essentiellement i18n + un texte d'aide. **Aucune modification de modèle de données ni de
calcul** — `Recipe.servings` et `calculatePortionNutrition` sont corrects, seul l'habillage change.

- `src/i18n/fr.json` : `recipeForm.servings`, nouvelle clé `recipeForm.servingsHint`,
  `recipeForm.picker.modeServings`, `foodForm.quickPortions.title`.
- `RecipeFormScreen.tsx` : rendre l'aide sous le champ Portions (`Text variant="caption"
  color="text.tertiary"`), dans le `FieldGroup` gauche de la `Row` (ligne 573). Vérifier que
  l'alignement avec le champ « Poids total » à droite ne casse pas — au besoin, poser l'aide sous la
  `Row` entière plutôt que dans la colonne.
- `TextField` n'a pas de prop `hint` : soit en ajouter une (préférable, réutilisable), soit rendre le
  `Text` directement dans l'écran. **Choix retenu : ajouter `hint?: string` à `TextField`**, le besoin
  reviendra (2i au Sprint 3).

**Cohérence à vérifier :** le renommage « Portions rapides » → « Portions usuelles » doit être repris
dans `screens.md` (2j) pour ne pas laisser diverger le handoff. Il sera de nouveau touché par
KCAL-163 — synchroniser les deux tickets s'ils sont menés en parallèle.

### Critères d'acceptation

- Le champ du formulaire de recette est intitulé « Nombre de portions » et porte une phrase d'aide
  visible sans interaction.
- Aucune écran n'emploie plus « portion » nu pour désigner à la fois une taille et un compte.
- `screens.md` est à jour.

**Estimation : 2 h.**

---

## KCAL-160 — Agrandir la feuille d'ajout d'ingrédient

> *Remarque testeur : « Ajouter un ingrédient à une recette : faire la popup plus grande. »*

### Analyse

`BottomSheet` (`src/ui/BottomSheet/BottomSheet.tsx`) est dimensionné par son contenu : il n'a qu'un
`maxHeight` (`windowHeight − keyboard − TOP_CLEARANCE`), pas de hauteur plancher. Le picker
d'ingrédient est donc aussi haut que ses résultats, et la liste est en plus bridée à
`maxHeight: 320` (`RecipeFormScreen.tsx:726`). Résultat : sur une recherche à 2 résultats, la feuille
occupe le tiers bas de l'écran alors qu'elle est l'écran de travail principal du parcours.

Second inconfort, non signalé mais réel : la feuille **change de hauteur entre l'étape 1 (recherche)
et l'étape 2 (quantité)**, ce qui produit un saut visuel désagréable en plein parcours.

### Décision produit

La feuille d'ajout d'ingrédient adopte une **hauteur stable d'environ 70 % de l'écran**, identique
sur ses deux étapes. Les autres feuilles de l'app (confirmation de suppression) **gardent leur
hauteur intrinsèque** : une feuille de confirmation à trois boutons ne doit pas occuper 70 % de
l'écran.

### Cadrage technique

**`src/ui/BottomSheet/BottomSheet.tsx`** — ajouter une prop optionnelle :

```ts
/** Fraction of the window height the sheet should occupy at minimum (0–1).
 *  Omitted: the sheet keeps its intrinsic, content-driven height. */
minHeightRatio?: number;
```

Intégration : `minHeight: minHeightRatio ? windowHeight * minHeightRatio : undefined` dans
`sheetStyle` (l'`useAnimatedStyle` ligne ~68), **à côté** du `maxHeight` existant, sans le remplacer.

Pièges à respecter :
- `minHeight` doit rester compatible avec la remontée clavier : la feuille est translatée de
  `−keyboardHeight`, donc un `minHeight` trop grand la ferait dépasser `TOP_CLEARANCE` (72). Borner :
  `Math.min(windowHeight * ratio, windowHeight - keyboardHeight - TOP_CLEARANCE)`.
- La valeur se calcule dans le worklet animé (`keyboardHeight` est une shared value) — ne pas la
  sortir en constante JS.

**`RecipeFormScreen.tsx`**
- `<BottomSheet minHeightRatio={0.7} …>` **uniquement** pour le picker d'ingrédient.
- Étape recherche : remplacer `maxHeight: 320` par `flex: 1` sur le `ScrollView` de résultats, pour
  qu'il consomme la hauteur libérée au lieu de laisser du vide.
- Le conteneur de l'étape 1 a déjà `flexShrink: 1` ; lui ajouter `flex: 1` pour que la chaîne de
  flex descende jusqu'au `ScrollView`.
- Étape quantité : le contenu est court, `minHeightRatio` suffit à figer la hauteur. Vérifier que le
  bloc reste ancré **en haut** de la feuille (pas centré verticalement).

**`LibraryScreen.tsx`** — `DeleteFoodSheet` : ne pas passer `minHeightRatio`, comportement inchangé.

### Critères d'acceptation

- La feuille d'ajout d'ingrédient occupe ~70 % de la hauteur d'écran, quel que soit le nombre de
  résultats (0, 2 ou 30).
- Aucun saut de hauteur au passage recherche → quantité.
- Clavier ouvert : la feuille reste entièrement visible, aucun contenu sous le clavier ni derrière
  l'encoche.
- La feuille de suppression d'aliment conserve exactement sa hauteur actuelle.

**Estimation : 3 h.**

---

# Lot C — Fonctionnalités manquantes (P1)

---

## KCAL-161 — Toggle favori dans le formulaire de recette

> *Remarque testeur : « Dans la création/édition d'une recette, il n'y a pas moyen de la sélectionner
> comme favorite alors que dans la liste de résultats, il y a bien l'étoile dans le design d'une
> recette. »*

### Décision produit

**On ajoute le toggle.** Cela **révise une décision explicite du Sprint 2** :

> « *Pas de toggle favori sur `RecipeFormScreen` : l'écran 2l ne le prévoit pas dans le design (à la
> différence de 2j pour les aliments). Le favori se bascule uniquement depuis 2c (liste) et s'affiche
> en lecture seule sur 2k.* » — `SPRINT2-DETAILS.MD`

La décision était fidèle au handoff, mais le handoff est incohérent : un aliment se favorise depuis
son formulaire (2j) *et* depuis la liste, une recette seulement depuis la liste. Rien ne justifie
cette asymétrie côté utilisateur, et le test la fait remonter immédiatement. `screens.md` (2l) est à
corriger en conséquence.

Le composant est déjà spécifié et implémenté pour 2j : `Card tone="light"` contenant le libellé
« Favori » et un `Toggle` à droite. On le reproduit à l'identique, positionné avant le bouton
Enregistrer, comme sur `FoodFormScreen`.

### Cadrage technique

**Le piège central de ce ticket — à lire avant de coder.** Aujourd'hui `RecipeFormScreen.onValid`
construit son `CreateRecipeInput` **sans** `isFavorite` (ligne 486). Comme
`LocalRecipeRepository.update` ne réécrit un champ que s'il est `!== undefined` (ligne ~118), le
favori posé depuis la liste **survit** à une édition. Dès que le formulaire enverra `isFavorite`, il
devient la source de vérité : si le mode édition ne **précharge pas** la valeur existante, éditer une
recette favorite la dé-favorisera silencieusement. C'est une perte de donnée utilisateur, discrète et
difficile à diagnostiquer après coup.

**`src/features/recipes/screens/RecipeFormScreen.tsx`**
1. `RecipeFormValues` += `isFavorite: boolean` ; `DEFAULT_VALUES` += `isFavorite: false`.
2. **Mode édition** : dans le `reset()` de l'effet de préchargement (ligne 315), ajouter
   `isFavorite: recipe.isFavorite`. **C'est le point critique ci-dessus.**
3. Rendu : `Card tone="light"` + `Controller name="isFavorite"` + `Toggle`, copie conforme de
   `FoodFormScreen.tsx:644-655`, inséré juste avant le bouton `recipeForm.submit`.
4. `onValid` : ajouter `isFavorite: values.isFavorite` à l'input.
5. `testID="recipeForm.favorite"` sur le `Toggle`.

**Aucune modification data.** `CreateRecipeInput` porte déjà `Partial<Pick<Recipe, 'isFavorite'>>` et
`update()` gère déjà le champ.

**Cohérence du parcours à vérifier :** après duplication (KCAL-141), `handleDuplicate` recopie
`isFavorite` de l'original et ouvre la copie en édition. Le toggle doit donc apparaître **déjà actif**
si l'original était favori. À couvrir par un test.

**`specs/design_handoff_kcalvi/screens.md`** (2l) : ajouter le toggle favori à la description.

### Critères d'acceptation

- Création : activer le toggle → la recette apparaît favorite (★ pleine) dans la bibliothèque.
- Édition d'une recette **déjà favorite** : le toggle est actif à l'ouverture ; enregistrer sans y
  toucher la laisse favorite. *(test de non-régression obligatoire)*
- Édition : désactiver le toggle → la ★ se vide dans la liste.
- Duplication d'une recette favorite → le formulaire de la copie s'ouvre avec le toggle actif.

**Estimation : 2 h.**

---

## KCAL-162 — Archiver une recette

> *Remarque testeur : « Pas de moyen de supprimer une recette ? »*

### Analyse

Exact : aucun écran n'expose ni suppression ni archivage de recette. Une recette créée par erreur
reste définitivement dans la bibliothèque. Côté data, `LocalRecipeRepository.delete()` **existe et
fonctionne** (destruction en cascade des `recipe_ingredients` dans un batch atomique) ;
`archive()` en revanche renvoie volontairement une erreur explicite
`RECIPE_ARCHIVE_NOT_SUPPORTED` — la table `recipes` n'a pas de colonne `is_archived`, et le Sprint 2
s'interdisait toute migration. Le commentaire dans le code documente honnêtement ce trou : c'est
maintenant qu'on le comble.

### Décision produit (D1)

**Archivage, pas suppression définitive.** Trois raisons :

1. **Symétrie** avec les aliments : deux gestes différents pour deux objets de même nature dans la
   même liste seraient incompréhensibles.
2. **Sprint 3** : `diary_entries` porte une colonne `recipe_id`. Détruire une recette laisserait des
   entrées de journal pointant dans le vide. RM16 (historique immuable) recopie certes les valeurs
   dans `DiaryEntry`, donc les calories de l'historique sont sûres — mais le lien, lui, serait cassé.
3. **Réversibilité** : une recette représente un vrai travail de saisie. La détruire sur un tap est
   disproportionné.

L'archivage suit la sémantique des aliments : la recette disparaît de la bibliothèque, ses données
restent en base.

### Cadrage technique

Ce ticket porte **la seule migration de schéma du lot A/B/C** — à traiter avec la rigueur imposée par
`TECHNICAL_SPECS.MD` §5.1 (jamais de reset, toujours une migration explicite).

**1. Schéma — `src/data/database/schema.ts`**
- `version: 3` → `4`
- Table `recipes` : `{ name: 'is_archived', type: 'boolean' }` (non optionnel, comme sur `foods`)

**2. Migration — `src/data/database/migrations.ts`**
```ts
{
  toVersion: 4,
  steps: [
    addColumns({ table: 'recipes', columns: [{ name: 'is_archived', type: 'boolean' }] }),
    // addColumns backfills existing rows with NULL, which the model would read back as
    // null rather than false -- the exact null/undefined class of bug fixed in KCAL-152.
    // Normalize the existing rows explicitly.
    unsafeExecuteSql('UPDATE recipes SET is_archived = 0 WHERE is_archived IS NULL;'),
  ],
}
```
Le second step n'est pas optionnel : sans lui, toute recette créée avant la migration remonterait
`is_archived = null`, et `Q.where('is_archived', false)` ne la matcherait pas — **toutes les recettes
existantes disparaîtraient de la bibliothèque**.

**3. Modèle et domaine**
- `models/Recipe.ts` : `@field('is_archived') isArchived!: boolean;`
- `domain/types` : `Recipe` += `isArchived: boolean`
- `LocalRecipeRepository.toDomainRecipe` : mapper le champ
- `create()` : `row.isArchived = false`

**4. Repository — `LocalRecipeRepository.ts`**
- `search()` : ajouter `Q.where('is_archived', false)` (aligné sur `LocalFoodRepository.search`)
- `archive()` : **remplacer** le retour `RECIPE_ARCHIVE_NOT_SUPPORTED` par la vraie écriture. Retirer
  aussi le long commentaire devenu obsolète et le code d'erreur du type `DomainError`.

**5. UI — `LibraryScreen.tsx`**
- `RecipeListItem` : ajouter une icône corbeille à droite de l'étoile, strictement calquée sur
  `FoodListItem` (même `Ionicons name="trash-outline"`, même taille 19, même `hitSlop`, même
  `testID` en `.delete`, mêmes `Pressable` imbriqués pour que le tap ne déclenche pas la navigation).
- Nouveau `ArchiveRecipeSheet` (ou généralisation de `DeleteFoodSheet`) :
  « Archiver *Nom* ? » / « Elle disparaîtra de ta bibliothèque. Les entrées de journal existantes ne
  sont pas modifiées. » / `Archiver` (primary) · `Annuler` (ghost).
- Traiter le `Result` de `archive()` (cf. KCAL-153, même exigence).

**Hors périmètre, à tracer :** aucun écran ne permet de **désarchiver** une recette. Même dette que
pour les aliments (KCAL-153) — un ticket commun « Gestion des éléments archivés » est à créer dans le
backlog.

**Tests — `LocalRecipeRepository.dbtest.ts`**
- `archive()` positionne bien `is_archived` et n'efface aucune ligne `recipe_ingredients`
- `search()` exclut les recettes archivées
- `findById()` retrouve **toujours** une recette archivée (indispensable : le journal du Sprint 3 en
  dépendra)

### Critères d'acceptation

- Migration jouée sur une base de données v3 contenant des recettes : après montée en v4, **toutes**
  les recettes existantes sont toujours visibles.
- Tap corbeille sur une card recette → feuille de confirmation ; après validation, la recette
  disparaît de la liste et le compteur du HeroCard décrémente.
- Une recette archivée n'apparaît sous aucun filtre ni recherche.
- Ses lignes `recipe_ingredients` sont intactes en base.
- `RECIPE_ARCHIVE_NOT_SUPPORTED` n'existe plus dans le code.

**Estimation : 8 h.**

---

# Lot D — Chantier structurant (P2)

---

## KCAL-163 — Modèle multi-portions (`food_portions`)

> *Contexte : remarque testeur « Ajouter un ingrédient à une recette : pourquoi ne pas proposer les
> "portions rapides" ? »*

### Analyse

La demande semble être un simple câblage d'UI. Elle bute en réalité sur une limite du modèle de
données, déjà identifiée pendant le Sprint 1 et documentée dans `FoodFormScreen.tsx:24-30` :

> « *Le type `Food` ne stocke qu'un seul couple `servingQuantity`/`servingUnit`, pas un tableau de
> portions. « Portions rapides » (screens.md 2j : « pills existantes + + Ajouter ») est donc
> implémenté comme un simple pré-remplissage de ce champ unique, pas comme une vraie liste.* »

D'où trois incohérences visibles :
- le titre « Portions**s** rapides » est au pluriel pour un champ unique ;
- le design 2i (Sprint 3) prévoit **3** `QuickPortionButton` avec « valeur médiane présélectionnée » —
  impossible avec une seule valeur ;
- le picker d'ingrédient ne peut proposer qu'un seul raccourci, ce qui est trop pauvre pour justifier
  l'UI.

### Décision produit (D4)

**On construit le vrai modèle multi-portions.** Un aliment porte N portions nommées
(« 1 pot = 150 g », « 1 c. à soupe = 15 g », « 1 tranche = 30 g »). C'est ce que le produit décrit
depuis le début (`Kcalvi_Specifications_Produit_v1.0.md` §8.1 « Par portion », RM01 qui liste
« portion » parmi les unités du MVP, et les évolutions cuillère/tranche/tasse).

**Ce chantier doit passer avant le Sprint 3**, pour la raison donnée en tête de document : sans lui,
l'écran 2i devra être écrit deux fois.

### Cadrage technique — découpage

**163a · Schéma et migration v5 (3 h)**

```ts
tableSchema({
  name: 'food_portions',
  columns: [
    { name: 'food_id',  type: 'string', isIndexed: true },
    { name: 'label',    type: 'string' },   // « 1 pot », « 1 c. à soupe »
    { name: 'quantity', type: 'number' },   // exprimée dans reference_unit du Food
    { name: 'unit',     type: 'string' },
    { name: 'position', type: 'number' },   // ordre d'affichage
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
  ],
})
```

**Reprise des données existantes — obligatoire.** La migration doit convertir chaque
`serving_quantity` / `serving_unit` déjà saisi en une ligne `food_portions`, sinon les utilisateurs
perdent leurs portions. Via `unsafeExecuteSql` : `INSERT INTO food_portions (...) SELECT ... FROM
foods WHERE serving_quantity IS NOT NULL`.

**Colonnes `serving_quantity` / `serving_unit` :** WatermelonDB ne sait pas supprimer une colonne
proprement. Elles restent en base, marquées `@deprecated` dans `models/Food.ts`, **plus jamais lues
ni écrites** par le code applicatif. À documenter par un commentaire explicite pour qu'un futur
développeur ne les réutilise pas par inadvertance.

**163b · Modèle, domaine, repository (4 h)**
- `models/FoodPortion.ts` + association `has_many` sur `Food` + enregistrement dans `modelClasses`
- Type domaine `FoodPortion` ; `Food` += `portions: FoodPortion[]`
- `FoodRepository.create/update` écrivent la liste de portions **dans le même `batch()`** que le
  Food. Reprendre exactement le pattern déjà éprouvé de `LocalRecipeRepository.create/update` avec
  ses ingrédients (`prepareCreate` + `prepareDestroyPermanently`, remplacement complet plutôt que
  diff).
- `findById` / `search` : décider si les portions sont chargées systématiquement. **Recommandation :
  oui pour `findById`, non pour `search`** (la liste bibliothèque n'en a pas besoin, et ce serait un
  N+1 supplémentaire par-dessus celui de KCAL-158).

**163c · Domaine — conversion (2 h)**
- Nouvelle fonction pure `convertPortionToReferenceQuantity(portion, count)` dans
  `domain/calculations`.
- `convertServingsToReferenceQuantity` devient obsolète → la supprimer une fois les appelants migrés
  (`RecipeFormScreen.tsx:452`), et retirer son test associé (KCAL-148).
- **L'invariant du Sprint 2 reste intégralement valable et doit être re-documenté sur la nouvelle
  fonction :** `RecipeIngredient.quantity` est **toujours** stocké en unité de référence ; la
  conversion se fait **avant** l'écriture, jamais au moment du calcul —
  `calculateProportionalNutrition` n'a aucune conscience des unités.

**163d · Traçabilité de la portion choisie (2 h) — point d'ambiguïté à clore**

`RecipeFormScreen.deriveIngredientDisplay` (ligne 168) reconstitue aujourd'hui la saisie d'origine
par **rétro-ingénierie** : « si `ingredient.unit === food.servingUnit`, alors l'utilisateur avait
saisi en portions, donc `displayQuantity = quantity / servingQuantity` ». Cette heuristique tenait
avec une portion unique. **Avec N portions, elle est indécidable** — deux portions peuvent partager
la même unité.

Correctif imposé : ajouter à `recipe_ingredients` une colonne
`portion_id` (`type: 'string', isOptional: true, isIndexed: true`) dans **la même migration v5**.
- Renseignée → l'ingrédient a été saisi en portions ; l'affichage lit le `label` de la portion.
- `null` → saisi directement en unité de référence.
- Supprimer `deriveIngredientDisplay` et son heuristique.
- Cas limite à gérer : la portion référencée a été supprimée de l'aliment depuis. `portion_id` est
  alors orphelin → retomber sur l'affichage en unité de référence, **jamais d'erreur** (l'ingrédient
  reste calculable, sa `quantity` est intacte).

**163e · `FoodFormScreen` — vraie liste de portions (3 h)**
- Section « Portions usuelles » (renommée par KCAL-159) : une pill par portion, tap = édition,
  « + Ajouter » = création, suppression par ligne.
- L'éditeur inline actuel (`Card tone="muted"`, ligne 583) est réutilisable ; il gagne un champ
  `label` en plus de quantité + unité.
- La Card d'aperçu (`foodForm.preview`) s'appuie aujourd'hui sur `servingQuantity` : la brancher sur
  la **première** portion (`position` la plus basse), ou sur la quantité de référence s'il n'y en a
  aucune.

**Estimation totale : 14 h.**

---

## KCAL-164 — Portions rapides dans le picker d'ingrédient

> *Remarque testeur : « Ajouter un ingrédient à une recette : pourquoi ne pas proposer les "portions
> rapides" ? »*

**Dépend de KCAL-163.** À faire immédiatement après.

### Décision produit

L'étape « quantité » du picker adopte le pattern déjà spécifié pour l'écran 2i
(`screens.md` : « *champ quantité (18/800) + unité, 3 QuickPortionButton (valeur médiane
présélectionnée)* ») : sous le champ de saisie, jusqu'à **3 `QuickPortionButton`** issus des portions
de l'aliment.

Règles d'affichage :
- Aliment avec ≥ 1 portion → pills des portions (max 3, par `position` croissante).
- Aliment sans portion → pills dérivées de l'unité de référence (50 g / 100 g / 150 g pour un aliment
  « pour 100 g ») pour que la ligne ne soit jamais vide.
- Aliment « par unité » → 1 / 2 / 3 unités.
- Aucune présélection automatique : le tap sur une pill remplit le champ, l'utilisateur valide.
  *(La « valeur médiane présélectionnée » de 2i concerne l'ajout au journal, geste beaucoup plus
  fréquent ; ici la saisie explicite est préférable.)*

### Cadrage technique

**`RecipeFormScreen.tsx`, étape `quantity` de la feuille (lignes 752-811).**
- `QuickPortionButton` existe déjà dans le design system — le réutiliser tel quel, ne rien créer.
- Le tap sur une pill fixe `quantityText` **et** `quantityMode`/`selectedPortion` de façon cohérente,
  puis laisse le champ éditable (l'utilisateur peut ajuster à 1,5 portion).
- Les chips de bascule « Par g » / « En portions usuelles » restent : les pills sont un raccourci,
  pas un remplacement.
- Renseigner `portion_id` (KCAL-163d) quand la quantité vient d'une pill de portion.
- Nouvelles clés i18n sous `recipeForm.picker.*`.

### Critères d'acceptation

- Aliment avec 2 portions enregistrées → 2 pills, tap → champ pré-rempli avec la bonne valeur.
- Aliment sans portion, référence 100 g → pills 50 / 100 / 150 g.
- Les deux chemins de saisie (pill et frappe manuelle) produisent **exactement** le même total de
  recette. *(reprise de l'exigence de test KCAL-149)*
- Réouvrir la recette en édition affiche l'ingrédient avec le libellé de la portion utilisée.

**Estimation : 4 h.**

---

## KCAL-165 — Tests de non-régression du lot

Les tickets ci-dessus touchent des chemins déjà couverts par les tests du Sprint 2 ; ce ticket
regroupe les extensions qui n'appartiennent à aucun ticket en particulier.

| Cible | Couverture attendue |
|---|---|
| `LocalFoodRepository.dbtest.ts` | Mapping des colonnes optionnelles absentes → `undefined`, jamais `null` (KCAL-152) |
| `LocalRecipeRepository.dbtest.ts` | `archive()` réel, `search()` filtrant les archivées, `findById()` retrouvant une archivée (KCAL-162) |
| `LibraryScreen.test.tsx` | Sections masquées par filtre (KCAL-157) ; feuille aliment-utilisé sans « Supprimer quand même » (KCAL-153) ; archivage d'une recette (KCAL-162) ; libellés kcal (KCAL-158) |
| `FoodFormScreen.test.tsx` | Édition d'un aliment sans fibres/sucre → champs vides ; aucune pill de portion fantôme (KCAL-152) |
| `RecipeFormScreen.test.tsx` | Enregistrer grisé à 0 ingrédient puis actif (KCAL-155) ; **édition d'une recette favorite qui reste favorite** (KCAL-161) ; parité pill / saisie manuelle (KCAL-164) |
| Migration | Test de montée v3 → v4 sur une base peuplée : aucune recette perdue (KCAL-162) |

**Estimation : 5 h.**

---

# Récapitulatif et séquencement

| Lot | Contenu | Sous-total |
|---|---|---|
| A — Anomalies | KCAL-152 → 154 | 7 h |
| B — Cohérence et clarté | KCAL-155 → 160 | 16 h |
| C — Fonctionnalités manquantes | KCAL-161, 162 | 10 h |
| D — Chantier multi-portions | KCAL-163, 164 | 18 h |
| Tests | KCAL-165 | 5 h |
| **Total** | | **~56 h** |

### Ordre recommandé

1. **Lot A** en premier : ce sont des défauts livrés, dont un (KCAL-153) qui fait croire à
   l'utilisateur qu'une suppression a eu lieu.
2. **KCAL-162** (migration v4) tôt : c'est la seule migration des lots A–C, et il vaut mieux la
   stabiliser avant d'empiler la v5 du lot D.
3. **Lot B** ensuite. KCAL-158 dépend de rien mais est le plus lourd du lot — ne pas le garder pour
   la fin de journée.
4. **KCAL-161** à n'importe quel moment (isolé, sans dépendance).
5. **Lot D** en dernier de ce document, **mais avant le Sprint 3**. KCAL-163 puis KCAL-164, dans cet
   ordre strict.
6. **KCAL-165** en continu, ticket par ticket, pas en fin de lot.

### Definition of Done

- Les douze remarques du testeur sont adressées ou explicitement arbitrées dans ce document.
- Aucune suppression ni archivage ne peut échouer en silence : tout `Result` en erreur produit un
  message visible.
- Aucune valeur `null` ne remonte de la couche data jusqu'à un écran.
- Les migrations v4 et v5 sont testées sur une base peuplée, sans perte de donnée.
- `screens.md` et `components.md` reflètent les écarts assumés (KCAL-156, 159, 161).
- Suite de tests verte.

---

# Observations hors demandes du testeur

Relevées pendant l'analyse du code, non couvertes par les tickets ci-dessus. À arbitrer séparément.

1. **Retour de navigation après duplication.** `handleDuplicate` (2k) crée la copie puis navigue vers
   `RecipeForm` en édition. À l'enregistrement, `onValid` fait `navigation.goBack()` — l'utilisateur
   atterrit sur la fiche de la recette **d'origine**, pas de sa copie. Déroutant. Correctif :
   `navigation.replace('RecipeDetail', { recipeId })` après enregistrement en provenance d'une
   duplication.

2. **Aucun écran de désarchivage.** Ni pour les aliments (existant depuis le Sprint 1) ni pour les
   recettes (introduit par KCAL-162). Un élément archivé est définitivement invisible. Ticket
   « Gestion des éléments archivés » à créer.

3. **`LocalRecipeRepository.update` remplace intégralement les ingrédients** (destroy + recreate) à
   chaque enregistrement, y compris pour un simple changement de nom si `input.ingredients` est
   fourni. Correct fonctionnellement, documenté dans le code, mais génère de la churn en base et
   invalidera tout `portion_id` posé par KCAL-163d. À revoir quand le diff par ligne deviendra
   nécessaire.

4. **Clé i18n morte** : `library.sections.recipesComingSoon`, vestige du stub KCAL-107. Supprimée par
   KCAL-157.

5. **`toDomainFood` est dupliqué** entre `LocalFoodRepository.ts` et `getRecipeWithIngredients.ts`.
   Factorisé par KCAL-152 ; mentionné ici parce que la duplication est exactement ce qui a permis au
   bug `null` de survivre à un seul point de correction.
