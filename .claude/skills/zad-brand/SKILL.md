---
name: zad-brand
description: Zad's visual identity (colors, fonts, Sadu weave band, tiles, charts, RTL rules). Use whenever building or changing any page, component or chart in the Zad app.
---

# Zad brand

The look is **a Qatari kitchen notebook**: undyed wool, date-brown ink, saffron, madder red and date-palm green, with an Al Sadu weave band as the one decorative signature. It should feel warm and crafted, never like a generic SaaS template.

## Color tokens (define on `:root`; dark values under `prefers-color-scheme: dark` and `[data-theme="dark"]`)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--wool` | #ECE3D1 | #1E1611 | page background |
| `--card` | #F7F1E5 | #291F18 | tiles and panels |
| `--ink` | #2E1E15 | #F1E6D3 | text |
| `--ink2` | #6A5545 | #BBA78E | secondary text, axis labels |
| `--line` | #D6C7AD | #46362A | borders, "usual amount" bars |
| `--madder` | #9C2B22 | #D95F50 | waste, "before Zad", warnings |
| `--saffron` | #D48A1F | #EDAA45 | tomorrow, highlights, focus ring |
| `--palm` | #4B6A37 | #93B774 | savings, "with Zad", Zad forecast, donate |
| `--indigo` | #34406A | #9AA8DA | third chart series only |

Color carries meaning: red is waste or before, green is saved or with Zad, saffron is tomorrow or now. Keep these the same everywhere.

## Type
- Display: **Reem Kufi** (600–700). Use it for headings and big numbers.
- Body and UI: **Almarai** (400/700/800).
- Load both from Google Fonts with `display=swap`, with a system-ui fallback.
- Big-number tiles: 48–56px Reem Kufi. Labels: 14–15px Almarai bold. Captions: 12–13px in `--ink2`.

## Signature elements
- **Sadu band**: an 18px strip under the header and above the footer. It's built with CSS gradients: madder diamonds on an ink band between thin saffron lines. Use it only in those two places.
- **Prep ticket**: the About hero shows tomorrow's prep as a kitchen order slip, with perforated top and bottom edges, dotted leaders between dish and kg, a total, and a green "62 kg less than usual" stamp. Tilt it 1.6° (mirrored in RTL).
- **Plates**: in the Owner view, daily waste can be shown as a plate whose red slice is the waste share.

## Layout
- Owner: one centered column, max 860px. Blocks have a 22px radius on the answer card and 18px on the others.
- Kitchen: a 4-column tile grid with a 12px gap. Tiles are flat with a 6px radius and a 1px `--line` border, in the style of Power BI. Use 2 columns under 980px and 1 under 560px.
- Side gutter: at least 16px, using `max(16px, env(safe-area-inset-*))`.

## RTL
- Use logical CSS properties (`margin-inline-start`, `inset-inline-*`).
- Charts with a time axis keep `dir="ltr"` inside the SVG. Labels still use Arabic-Indic digits through `Intl.NumberFormat('ar-QA-u-nu-arab')`.
- Format dates with `ar-QA-u-ca-gregory-nu-arab` so they never switch to the Hijri calendar by accident.

## Do not
Emoji icons, gradients as decoration, an all-caps eyebrow above every heading, identical shadowed cards, or `→` added to buttons.
