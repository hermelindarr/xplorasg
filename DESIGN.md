---
name: XploraSG
description: Verified travel guide to the Sierra Gorda de Querétaro, organized around its real elevation.
colors:
  forest-ink: "#1F2C24"
  forest-green: "#2F5D3E"
  sage: "#6E8B6F"
  terracotta: "#9E552F"
  cream: "#F3EDE2"
  sand: "#E6DCCB"
  warm-paper: "#FAF7F1"
  white: "#FFFFFF"
  clay-error: "#833C25"
  clay-error-bg: "#FBF1EC"
  ochre-warning: "#503915"
  ochre-warning-bg: "#FAF4E6"
typography:
  display:
    fontFamily: "Fraunces, Iowan Old Style, Georgia, serif"
    fontSize: "clamp(2.6rem, 6vw, 4.25rem)"
    fontWeight: 400
    lineHeight: 1.02
  headline:
    fontFamily: "Fraunces, Iowan Old Style, Georgia, serif"
    fontSize: "clamp(2rem, 1.3rem + 2.2vw, 3.25rem)"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Fraunces, Iowan Old Style, Georgia, serif"
    fontSize: "1.35rem"
    fontWeight: 400
    lineHeight: 1.25
  body:
    fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Poppins, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
  data:
    fontFamily: "Fraunces, Iowan Old Style, Georgia, serif"
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 1
    fontFeature: "\"tnum\" 1"
rounded:
  field: "10px"
  card: "12px"
  panel: "28px"
  hero: "32px"
  pill: "999px"
spacing:
  gutter-mobile: "20px"
  gutter-desktop: "32px"
  container: "80rem"
  section-mobile: "80px"
  section-desktop: "112px"
  card-gap: "24px"
components:
  button-primary:
    backgroundColor: "{colors.forest-ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.forest-green}"
  button-accent:
    backgroundColor: "{colors.forest-green}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
    height: "44px"
  button-accent-hover:
    backgroundColor: "{colors.forest-ink}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.forest-ink}"
    rounded: "{rounded.pill}"
    padding: "10px 20px"
    height: "44px"
  button-on-dark:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.forest-ink}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
    height: "48px"
  field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.forest-ink}"
    rounded: "{rounded.field}"
    padding: "12px 16px"
    height: "48px"
  chip:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.forest-ink}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  chip-selected:
    backgroundColor: "{colors.forest-ink}"
    textColor: "{colors.white}"
  card-media:
    backgroundColor: "{colors.sand}"
    rounded: "{rounded.card}"
  hero-panel:
    backgroundColor: "{colors.forest-ink}"
    textColor: "{colors.warm-paper}"
    rounded: "{rounded.hero}"
---

# Design System: XploraSG

## Overview

**Creative North Star: "La sierra en corte, en bitácora de campo"**

The Sierra Gorda is defined by its drop: from the semi-desert of Peñamiller up to the pine forests of Pinal de Amoles at about 2,700 m, and down to the mission valleys at about 500 m. The system turns that fact into its signature. The home page opens on a real terrain cross-section with every catalog place plotted at its true longitude and elevation, and elevation then travels with each place as a first-class data point: on cards, on the mosaic, and as the large figure at the top of every place page.

Everything around that signature reads like a local guide's field logbook: precise notes, real photographs, today's weather and the next three days, the road and access in plain words. Components are sober instruments. Photographs and verified data do the persuading; chrome stays quiet. The page is calm, generous in space and editorial in rhythm, never busy.

Confirmed rejections: it must never look like a generic AI-generated template (tracked uppercase labels over every section, one italic word in each headline, 01/02/03 markers on things that are not steps, an arrow on every link), and never like a government portal (crests, grey blocks, link lists).

**Key Characteristics:**
- One bold element per page: the elevation profile on the home page, the elevation figure on a place page.
- Real photographs only, clean on top of cards, never covered by labels or veils.
- Serif for headlines and key figures, sans for everything you read or tap.
- Warm paper backgrounds, forest ink text, terracotta reserved for fine detail.
- Show only what helps a visitor decide; omit placeholders, filler stats and non-information.

## Colors

A palette taken from the sierra itself: deep forest, sage scrub, mission terracotta, and limestone-paper neutrals.

### Primary
- **Deep Forest Ink** (forest-ink): main text, primary buttons and the dark hero panel that carries the elevation profile.
- **Forest Green** (forest-green): primary action on light surfaces, the terrain fill in the profile, focus rings and active states.

### Secondary
- **Sierra Sage** (sage): soft accents, the ridge line of the terrain, weather glyphs.

### Tertiary
- **Mission Terracotta** (terracotta): fine detail only, such as the selected point and its guide line in the profile, required-field marks and small highlights. It meets AA as text on cream (4.75:1).

### Neutral
- **Warm Paper** (warm-paper): the general page background and the light button on dark surfaces.
- **Limestone Cream** (cream): section backgrounds, quiet chips and info panels such as road and access.
- **Dry-Earth Sand** (sand): 1px dividers, card photo placeholders and table rules.
- **White** (white): fields and the few surfaces that must lift off the paper.
- **Clay** (clay-error on clay-error-bg) for errors and destructive actions; **Ochre** (ochre-warning on ochre-warning-bg) for warnings and offline mode. Never Tailwind's red or amber.

**The Terracotta Whisper Rule.** Terracotta marks a single point of attention per view (the selected place, a required mark). It is never a fill for buttons or large areas.

**The Earth States Rule.** Errors and warnings use clay and ochre at 9:1 contrast or better; system reds, ambers, greys and slates are out of palette.

## Typography

**Display Font:** Fraunces (with Iowan Old Style, Georgia)
**Body Font:** Poppins (with ui-sans-serif, system-ui)

**Character:** A soft, literary serif for what you remember (place names, headlines, the elevation figure) paired with a clear geometric sans for what you read and operate. Weights stay light to medium: Fraunces 400–500, Poppins 400–600, never 900.

### Hierarchy
- **Display** (Fraunces 400, clamp 2.6rem→4.25rem, 1.02): the home hero headline, which states the elevation range.
- **Headline** (Fraunces 500, clamp 2rem→3.25rem, 1.05, -0.02em): section and page titles.
- **Title** (Fraunces 400, 1.35rem, 1.25; utility `text-title`): place and service names on cards.
- **Data** (Fraunces 400, 3rem–3.75rem, tabular numerals): the elevation figure on place pages and the hero card; temperature in the weather card.
- **Body** (Poppins 400, 16px / `text-base`, 1.75): all reading text, at most about 70ch per line, with `text-wrap: pretty`. Card summaries are the one dense exception (14px / `text-sm`, two lines).
- **Label** (Poppins 400–500, 13px / `text-label`, 1.5, sentence case): municipality, elevation on cards, field labels and metadata.

**The Sentence Case Rule.** Labels are written in natural sentence case. Tracked uppercase is reserved for the logo tagline and the calendar date blocks of the Agenda.

**The Role Scale Rule.** Text sizes come from roles (`text-label`, `text-sm`, `text-base`, `text-title`, `section-title`), not from one-off pixel values such as `text-[15px]`. Reading text never drops below 16px.

**The Plain Headline Rule.** Headlines are set evenly. No single word is switched to italic or another color for emphasis.

## Layout

A centered container of 80rem with 20px gutters on mobile and 32px from the large breakpoint. Sections breathe with 80px of vertical space on mobile and 112px on desktop. Desktop pages use a 12-column grid with asymmetric splits: 7 + 5 in the home hero, 7 + 4 (offset by one) on detail pages, with the side column sticky under the header.

Card grids run 1 → 2 → 3 → 4 columns (sm, lg, xl) with a 24px column gap and 48px row gap, so text below each photo has room. The home mosaic uses CSS columns with alternating photo ratios.

Mobile first: a 64px bottom navigation bar is fixed on phones, and the assistant button floats above it at the bottom right, so no fixed action may sit in that corner. On phones the elevation profile keeps a 46rem minimum width and scrolls horizontally inside the hero, so every point stays tappable.

**The One Bold Element Rule.** Each page spends its boldness in one place (the profile, the elevation figure). Everything around it stays quiet and aligned to the grid.

## Elevation & Depth

The system is flat and tonal. Depth comes from dark versus paper surfaces, cream panels and 1px sand dividers, not from shadows. The only shadows are a near-invisible resting shadow and the lift of the floating search card that overlaps the hero.

### Shadow Vocabulary
- **Soft rest** (`box-shadow: 0 1px 2px rgb(31 44 36 / 0.04), 0 6px 18px -12px rgb(31 44 36 / 0.10)`): occasional resting elevation for white surfaces.
- **Search lift** (`box-shadow: 0 24px 60px -28px rgba(31,44,36,.45)`): only the home search card where it overlaps the hero.

**The Flat Field Rule.** Cards have no frame and no shadow: the photo's rounded edge and the text below define them.

**The No Glass Rule.** No backdrop blur, glassmorphism or decorative gradients. A single uniform dark veil over a photo is allowed only when text must sit on it.

## Shapes

Gently rounded photos and panels, pill-shaped controls. Photos and media use 12px corners; fields use 10px; large dark panels use 28–32px; buttons, chips and the favorite toggle are full pills or circles. Borders are 1px, used for dividers and secondary buttons, never as heavy frames.

## Components

### Buttons
Precise, quiet, never loud.
- **Shape:** full pill (999px), at least 44px tall (48px on the hero).
- **Primary:** forest ink with white text; hover turns forest green.
- **Accent:** forest green with white text for the main action of a page (for example "Cómo llegar"); hover turns forest ink.
- **Secondary:** white with a fine 1px ink border at 22% opacity; hover strengthens the border.
- **On dark:** warm paper with ink text on the dark hero; the companion is an outline in light cream at 40%.
- **Focus:** 2px forest-green outline with a 3px offset, on every interactive element.

### Chips
- **Style:** quiet outline (1px ink at 15%) or a cream fill, pill shape, 14px text.
- **State:** selected chips invert to forest ink with white text.

### Cards / Containers
- **Place and service cards:** a clean photo (4:3, 12px corners, sand placeholder) with the favorite toggle in its corner; below it, municipality and elevation (or service type and municipality) as a label row, the name as a Fraunces title, and two lines of description. The name is the link and stretches over the whole card.
- **Info panel:** cream background, 12px corners, for road and access notes.
- **Background:** no frame and no shadow (see Elevation & Depth).

### Inputs / Fields
- **Style:** white, 1px ink border at 14%, 10px corners, 48px tall.
- **Focus:** the border turns forest green with a soft 4px green halo at 15%.
- **Placeholder:** ink at 40%, short enough to fit a 375px screen.

### Navigation
- **Desktop:** sticky warm-paper header; text links in 14px Poppins; the active link gets a 1px ink underline that grows from the left.
- **Mobile:** a fixed bottom bar with five icon-and-label destinations; the active one turns forest green with a 1px green line above.

### Sierra Profile (signature)
A real terrain cross-section (Open-Meteo elevation model, Peñamiller → Landa) drawn in forest green with a sage ridge line on the forest-ink hero panel. Dashed contour lines at 1,000 and 2,000 m are labeled in light text. Each catalog place is a warm-paper dot with an ink outline at its true longitude and elevation. The selected place grows, turns terracotta, drops a dashed guide line to the base and shows its name; a photo card beside the profile gives the name, municipality and elevation. Points are keyboard-focusable buttons with full spoken labels. A tap or the cursor selects the nearest place within 36px (the drawn dot is only 10px), a second tap on the selected place opens it, and keyboard focus selects without opening. On phones a rail of 44px buttons under the profile lists the same places west to east and stays in sync with it, as the equivalent control for points that sit close together. On load the terrain draws once from west to east, and that motion is turned off under reduced motion.

## Do's and Don'ts

### Do:
- **Do** show elevation wherever a place appears, in tabular numerals with "m".
- **Do** keep photographs clean: no badges, veils or pills on top of card photos.
- **Do** write labels in sentence case and keep headlines evenly set.
- **Do** keep touch targets at 44px or more on touch screens and visible 2px green focus outlines. Compact controls (chips, icon buttons, small WhatsApp and favorite buttons, map zoom) stay at 32–40px for a mouse and grow with the `pointer-coarse:` variant (`pointer-coarse:min-h-11`, `pointer-coarse:size-11`); when the drawn mark must stay small (map pins, profile points), add an invisible hit area instead of enlarging the drawing.
- **Do** use clay and ochre for errors, warnings and offline notices.
- **Do** treat reduced motion as "no movement, keep the meaning": under `prefers-reduced-motion` remove slides, lifts, zooms and smooth scrolling (use `scrollBehavior()` from `utils/motion.ts` for scrolls started in code), and keep short opacity and color transitions that signal state (photo loaded, assistant open, terrain shown as a 300ms fade). Never zero out every transition globally.
- **Do** show hours and cost in full; never truncate them with an ellipsis.

### Don't:
- **Don't** put tracked uppercase eyebrow labels over sections.
- **Don't** italicize or recolor one word of a headline for emphasis.
- **Don't** number items 01/02/03 unless they are a real sequence of steps (the survey is one).
- **Don't** add an arrow to every link or an extra arrow button to cards.
- **Don't** use filler statistics ("20 lugares publicados") or non-information such as "Consultar tarifa vigente".
- **Don't** use backdrop blur, glassmorphism, decorative gradients or saturated colors outside the palette.
- **Don't** add fade-and-rise entrances to cards or sections as they scroll into view; the terrain drawing is the page's single choreographed moment.
- **Don't** look like a government portal: no crests, grey blocks or link-list layouts.
