# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary:** a tourist planning a trip to the Sierra Gorda de Querétaro (for example from Querétaro city or CDMX). They decide from home where to go, what to see and where to sleep, then check the app again on their phone in the sierra, often with weak or no signal.

**Secondary:**
- Local tourism providers (lodging, fondas, guides, cooperatives) who want visitors to contact them directly.
- Administrators of XploraSG who review and publish content, events and promotions.
- Evaluators of the Nuevos Talentos Científicos y Tecnológicos 2026 program, who assess the prototype (the satisfaction survey at `/encuesta` is part of that validation).

## Product Purpose

XploraSG gathers verified tourism information about the Sierra Gorda de Querétaro in one place: places (missions, waterfalls, canyons, viewpoints, archaeological sites), community tourism services, a cultural agenda, a map with routes and weather, and an assistant (Chatboot) that answers from the verified listings.

Success in the coming months, all three confirmed:
1. Pass/win the NTCT 2026 evaluation.
2. Publish it with real users (domain xplorasg.com.mx; deploy targets cPanel and Vercel exist in the repo).
3. Bring more local providers on board and send them direct WhatsApp contacts.

## Positioning

- Information is verified against official sources (Turismo Querétaro, UNESCO, INAH, CONANP) and never invented; when a fact is missing, the product says so.
- Works without signal: it is an installable PWA that keeps the catalog and saved places offline.
- Direct contact with local providers, no commissions or intermediaries.
- Covers the six Sierra Gorda municipalities: Arroyo Seco, Jalpan de Serra, Landa de Matamoros, Peñamiller, Pinal de Amoles, San Joaquín.

## Operating Context

- Planning happens at home on desktop or phone; use in the field happens on a phone, on mountain roads, with intermittent connectivity.
- The region's defining trait is elevation change (roughly 500 m to 2,700 m among catalog places), which drives climate, clothing and travel time.
- Weather and elevation come from Open-Meteo; routes from a routing service with Google Maps as fallback; map tiles from OpenStreetMap.
- Content is captured from "fichas" (Word documents in `documentos/fichas/`) and reviewed by an administrator before publishing.

## Capabilities and Constraints

- Stack (existing): React 19 + Vite + Tailwind CSS 4 frontend (PWA), Express + TypeScript backend, Supabase (Postgres, Auth, Storage).
- Roles: turista, prestador, administrador.
- Features: catalog with search and filters, place and service detail pages, favorites (local, synced when signed in), map with nearby places and routes, agenda of events and promotions, Chatboot with optional voice (Web Speech API), satisfaction survey, legal pages.
- Bilingual ES/EN is required for all user-facing text (`frontend/src/i18n/`).
- **Open decision:** the assistant is currently named "Chatboot"; the user did not mark the name as binding.

## Brand Commitments

- Official XploraSG logo (`frontend/public/brand/`, `<BrandLogo />`) and the official palette must be kept: forest green, sage, terracotta, cream/sand, deep forest ink.
- Slogan in use: "Explora. Conecta. Vive la Sierra Gorda."
- Only verified data: hours, prices and places come exclusively from approved fichas; nothing may be fabricated.
- Bilingual ES/EN.

## Evidence on Hand

- 20 published places and 15 services with real photos (`content/fichas/media/`, plus images served by the API).
- Source fichas in `documentos/fichas/`; downloadable guides in `frontend/public/guias/`.
- Team photo at `frontend/public/equipo/`.
- Survey responses are collected in the database (no results summarized yet).
- **Absent, must not be fabricated:** testimonials, user counts, ratings or reviews, press, partner endorsements.

## Product Principles

1. Verified or nothing: every fact shown traces back to an approved ficha or an official source; gaps are stated, not filled.
2. Plan at home, use in the sierra: every key screen must work on a phone with weak signal.
3. Local people first: providers are contacted directly; the product never stands between visitor and host.
4. Show what helps a visitor decide (elevation, weather, access, hours, cost), and leave out what does not.
5. Spanish and English are equal citizens.

## Accessibility & Inclusion

- Mobile-first; touch targets of at least 44 px on touch screens; respect `prefers-reduced-motion` (already global).
- WCAG AA contrast as the working standard (documented in `docs/diseno.md`).
