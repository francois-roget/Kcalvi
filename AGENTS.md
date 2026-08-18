# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Specs reference

- Business/product questions (features, rules, MVP scope, roadmap): `specs/Kcalvi_Specifications_Produit_v1.0.md`.
- Technical/architecture questions (stack, folder structure, data layer, conventions): `specs/TECHNICAL_SPECS.MD`.
- Screens, components, interactions (design handoff): `specs/design_handoff_kcalvi/`.
- Sprint planning and ticket breakdown: `specs/SPRINTS.MD` and `specs/SPRINT1-DETAILS.MD`.

Always check the relevant file above before answering a spec question or making a product/architecture decision — don't guess from memory of a previous conversation.

# Internationalization

All user-facing text must go through i18next (`src/i18n/fr.json` + `t()`), with no hardcoded strings in components — this includes visible text, but also `accessibilityLabel`/`accessibilityHint`, screen/navigation titles, and form validation errors shown to the user.

`domain/` and `data/repositories/` stay framework- and locale-independent (see `TECHNICAL_SPECS.MD` §2.2): their `Result` error `message` field is a technical fallback only (English, for logs/tests), never displayed directly to the user. UI code must build the displayed text from `error.code` (and any structured fields like `min`/`max`) via `t()`.

# Code comments

All comments in the code must be written in English, regardless of the language used elsewhere (specs, commit messages, UI copy in `fr.json`).
