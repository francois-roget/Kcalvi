# Sprint 1 — Détail des tickets

**Sprint :** Bibliothèque d'aliments
**Réfère à :** `SPRINTS.MD` (Sprint 1), `Kcalvi_Specifications_Produit_v1.0.md` (F04-F07, F12, RM14-RM15), `design_handoff_kcalvi/screens.md` (2c, 2j, 2s)
**Capacité supposée :** ~55h sur 2 semaines (rythme freelance solo, à ajuster selon disponibilité réelle)

État de départ : `FoodRepository` / `LocalFoodRepository` sont déjà implémentés (`findById`, `search`, `create`, `update`, `archive`, `delete`), `domain/validation` contient déjà `assertNonNegative` (RM14) et `checkFoodDeletable` (RM15). Ce sprint est donc majoritairement du câblage UI, pas de la construction de couche de données.

---

## A. Audit / data layer

| Ticket | Description | Fichiers | Estimation |
|---|---|---|---|
| KCAL-101 | Auditer `LocalFoodRepository` vs besoins de l'écran (recherche nom+marque F12, tri, filtre favoris) — décider si le filtre "★ Favoris" se fait côté repository ou côté écran (résultat observé filtré en mémoire) | `src/data/repositories/LocalFoodRepository.ts` | 1h |

---

## B. LibraryScreen (2c)

| Ticket | Description | Fichiers | Estimation |
|---|---|---|---|
| KCAL-102 | Layout écran : SafeArea, header titre + bouton rond "+" (→ FoodFormScreen) | `features/library/screens/LibraryScreen.tsx` | 2h |
| KCAL-103 | `SearchField` branché sur `foodRepository.search()` via `useObservable`, debounce léger | idem | 2h |
| KCAL-104 | Chips de filtre Tout / ★ Favoris / Aliments / Recettes (filtrage client-side du résultat observé — cf. KCAL-101) | idem | 3h |
| KCAL-105 | `HeroCard` de comptage 3 colonnes séparées par filet (aliments blanc, recettes terracotta.300, favoris azure.400) | idem | 2h |
| KCAL-106 | Liste des aliments en `Card` light : nom, référence, tap ★ = bascule favori inline (`foodRepository.update`) | idem | 3h |
| KCAL-107 | Section "Recettes" — titre de section + liste vide (Sprint 2 fournira les données ; ne pas bloquer le layout dessus) | idem | 1h |
| KCAL-108 | État vide bibliothèque (2s) : "Ta bibliothèque est vide" + CTA "Créer mon premier aliment" (primary) et "Partir d'une liste de base" (secondary) | idem | 2h |

> ⚠️ KCAL-108 — le bouton "Partir d'une liste de base" suppose des données de seed, non tranchées (`TECHNICAL_SPECS.MD` §20, point ouvert). Scope Sprint 1 : afficher le bouton, le brancher peut être reporté si le seed n'est pas prêt — à décider en stand-up avant de commencer ce ticket.

---

## C. FoodFormScreen (2j)

| Ticket | Description | Fichiers | Estimation |
|---|---|---|---|
| KCAL-109 | Layout + header "Annuler / Nouvel aliment ou Modifier / Enregistrer" | `features/library/screens/FoodFormScreen.tsx` | 2h |
| KCAL-110 | Champ Nom + chips de référence (pour 100 g / pour 100 ml / par unité), React Hook Form | idem | 3h |
| KCAL-111 | Champs Calories / Protéines / Glucides / Lipides, 2 par ligne, `NumberField` | idem | 2h |
| KCAL-112 | Champs optionnels : marque, fibres, sucre, catégorie, notes | idem | 2h |
| KCAL-113 | Portions rapides : pills existantes + action "+ Ajouter" une portion | idem | 3h |
| KCAL-114 | Card azure.100 d'aperçu nutritionnel live (`calculateProportionalNutrition`, déjà en `domain/calculations`) | idem | 2h |
| KCAL-115 | Toggle favori | idem | 1h |
| KCAL-116 | Validation RM14 au submit (`assertNonNegative` + champs obligatoires RHF) et affichage des erreurs par champ | idem | 3h |
| KCAL-117 | Wiring création (`foodRepository.create`) + navigation retour vers `LibraryScreen` | idem | 2h |
| KCAL-118 | Mode édition : préremplissage via `foodRepository.findById` + wiring `update` | idem | 3h |

---

## D. Suppression / archivage (RM15)

| Ticket | Description | Fichiers | Estimation |
|---|---|---|---|
| KCAL-119 | Dialogue "Annuler / Archiver / Supprimer quand même" déclenché depuis `LibraryScreen`, câblé sur `checkFoodDeletable` (déjà écrit dans `domain/validation`) | `features/library/screens/LibraryScreen.tsx` (+ composant dialogue partagé si besoin dans `ui/`) | 3h |

---

## E. Internationalisation

| Ticket | Description | Fichiers | Estimation |
|---|---|---|---|
| KCAL-120 | Clés `fr.json` : labels, placeholders, messages d'erreur, état vide (Library + FoodForm) | `src/i18n/fr.json` | 2h |

---

## F. Tests

| Ticket | Description | Fichiers | Estimation |
|---|---|---|---|
| KCAL-121 | Tests unitaires `LocalFoodRepository` : create/update/archive/delete, cas limites (valeur négative, quantité de référence à 0) | `LocalFoodRepository.dbtest.ts` | 3h |
| KCAL-122 | Tests `FoodFormScreen` : validation champ par champ, submit succès, submit erreur | `FoodFormScreen.test.tsx` | 3h |
| KCAL-123 | Tests `LibraryScreen` : filtrage par chip, recherche, bascule favori | `LibraryScreen.test.tsx` | 3h |

---

## G. QA manuelle

| Ticket | Description | Estimation |
|---|---|---|
| KCAL-124 | Passe QA sur simulateur/device réel : créer, chercher, modifier, favoriser, archiver un aliment ; vérifier persistance après relance de l'app | 2h |

---

## Récapitulatif

| Catégorie | Sous-total |
|---|---|
| A. Audit / data layer | 1h |
| B. LibraryScreen | 15h |
| C. FoodFormScreen | 21h |
| D. Suppression / archivage | 3h |
| E. i18n | 2h |
| F. Tests | 9h |
| G. QA manuelle | 2h |
| **Total** | **~53h** |

**Ordre suggéré :** A → C (le formulaire ne dépend de rien d'autre) → B (la liste a besoin d'avoir des aliments créés pour être testée visuellement) → D → E en continu → F en fin de sprint → G en clôture.

**Definition of Done Sprint 1 :** un utilisateur peut créer, chercher, modifier, favoriser et archiver un aliment ; les données persistent après fermeture de l'app ; l'état vide s'affiche correctement sur une bibliothèque neuve ; tests unitaires et composants verts.
