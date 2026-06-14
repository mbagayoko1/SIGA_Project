# GIAP — Geospatial Integrated Analysis Portal

Geospatial analysis platform for UNFPA's mandate in West and Central Africa
(modeled after the Population Data Portal and SWP 2024 report), restyled in the
**Quantum** corporate portal design language.

Originally an AI Studio app; replicated and re-themed to run locally with Claude
Code. React 19 + Vite + Tailwind v4, with Gemini AI briefings and Firebase auth.

## Run locally

```bash
npm install --legacy-peer-deps
npm run dev          # http://localhost:3000  (preview tooling uses 3002)
```

The app boots straight to the Quantum **Home portal**. With no keys configured it
runs in a **local mock session** — click "Sign in with Google" to enter as the
demo admin (Moussa BAGAYOKO). All modules are fully navigable.

## Adding real keys

1. **Gemini** (AI briefings & analysis): put your key in `.env.local`
   ```
   GEMINI_API_KEY="your-key"
   ```
2. **Firebase** (Google auth + Firestore user store): replace the placeholder
   values in `firebase-applet-config.json` with your real project config. As soon
   as `apiKey` is no longer the placeholder, real Google sign-in and the
   connectivity probe activate automatically (the mock session turns off).

## Design

The Quantum reskin is driven from two places:

- `src/index.css` — the `@theme` tokens (`--color-unfpa-blue`, `--color-sidebar-bg`,
  `--color-main-bg`, …) are remapped to the Quantum corporate-blue palette, which
  propagates across every module.
- `src/components/quantum/` — the Quantum portal shell:
  - `QuantumHome.tsx` — the tiled home portal (greeting hero, tab nav, Quick
    Actions, Apps grid) that launches each GIAP module.
  - `QuantumTopBar.tsx` — the white utility bar (brand + icon cluster + avatar).
  - `QuantumBrand.tsx` — the GIAP brand mark.

`Home` is the default view; every module is reachable from the Apps grid or the
in-app header nav.
