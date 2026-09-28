# Visual design

Look at `../design/screenshots/*.png` first. Mockups are 390×844 CSS px, and **1 CSS px = 1 dp**. Font sizes in px map to **sp**.

## Color tokens
| Token | Hex | Use |
|---|---|---|
| `background` | `#F4EFE6` | screen background (warm off-white) |
| `surface` | `#FFFFFF` | cards, bottom bar, sheet, inputs |
| `ink` | `#1B2B38` | primary text, outlines, the selected segmented option |
| `inkMuted` | `#5A6670` | secondary text, inactive nav labels |
| `outline` | `#E2DACB` | card borders, dividers |
| `outlineSoft` | `#EFE9DE` | list dividers, chart grid lines |
| `accent` | `#B8452F` | primary − button, Save, links, chart line (white text on it passes AA) |
| `accentSoft` | `#F1D9CF` | active nav pill, "+n" chip, chart fill (at 60% opacity) |
| `onAccentSoft` | `#8E3322` | text on the accentSoft chips |
| `cool` | `#E6ECF1` | "−n" chip background |
| `onCool` | `#1F4A6B` | text on the "−n" chips |
| `lidOuter` | `#E7DFD1` | the outer ring of the count circle; the segmented-control track in History |
| `lidRim` | `#D9CFBE` | the 10dp border of the inner lid circle; the "pull tab" bar; the sheet handle |
| `scrim` | `#8E8A83` | shown behind the sheet in the mockup; use the standard M3 scrim in the app |

Expose these as a typed `Colors` object (light and dark variants) via a React context/hook in `src/ui/theme.ts`.

## Typography
Fonts are bundled from `../design/fonts/ttf/`, loaded at runtime with `expo-font` (SIL OFL; the licence files sit next to them).
- **Display: Bricolage Grotesque.** Screen titles 26sp ExtraBold (letter-spacing −0.5); the big count 104sp ExtraBold (letter-spacing about −4, line height 1.0); the sheet title 24sp Bold; the quantity field 44sp ExtraBold; the chart's current value 28sp Bold; "± n" 24sp Bold.
- **Body: Figtree.** Body 15–16sp Regular/Medium; labels 14sp SemiBold; captions 12–13sp; buttons 15–16sp Bold; nav labels 12sp (Bold when active, Medium otherwise).
- CSV sample: the system monospace at 12sp.

## Shape and spacing
- Screen horizontal padding 24dp. Header top padding about 44dp (below the status bar; use proper window insets, don't hard-code this).
- Cards: 16–18dp corner radius, a 1dp `outline` border, `surface` fill, no elevation.
- Pill buttons: height 52dp, fully rounded. Segmented controls: 4dp padded track with a 14dp radius; options 40–44dp high with a 10dp radius.
- Bottom nav: `surface`, a 1dp top border; the active item has a 64×32dp `accentSoft` pill behind its icon.
- The sheet: 28dp top corners and a 36×4dp handle.

## Screen specifics
**Pantry**
- The count "lid": an outer circle 272dp (`lidOuter`), holding an inner circle 244dp (`surface`) with a 10dp `lidRim` border. Inside it: a 64×10dp rounded "pull tab" bar in `lidRim`, the number, then the "cans" label.
- The button row is centered, with a gap of 28dp:
  - **−**: a 128dp filled `accent` circle, with a white minus icon of about 52dp and a soft shadow (about 6dp y, 16dp blur, 18% ink)
  - **± n**: an 88dp `surface` circle with a 1.5dp `ink` border, showing "± n" and a small "Adjust" caption under it
- The Last-change card sits at the bottom of the content area.

**Adjust sheet**
- The order is exactly: title → "Currently in the pantry: N cans" → Add/Remove segmented (the selected option is `ink`-filled with white text) → Quantity → Note → Date and time → the "After saving" box (`background` fill) → Cancel / Save.
- The Quantity row sits in an outlined 18dp-radius container: a 56dp outlined circular stepper, a centered 120×64dp text field (2dp `ink` border, 14dp radius, big number), then another 56dp stepper. Under it, the helper text "Tap the number to type it directly".

**History**
- Chart: a step path, 2.5dp stroke, `accent`; a fill with `accentSoft` at 60% down to the baseline; dashed horizontal grid lines (`outlineSoft`, a 3/4 dash); a solid `outline` baseline; an end dot of 5dp radius in `accent` with a 2dp white ring. Draw it with `Canvas` and `Path`.
- Log rows: vertical padding 12dp, horizontal 16dp; the chip is 44×32dp with a 10dp radius; the total is right-aligned in Bold.

**Backup**
- Two action cards, each with a 44dp rounded-square icon tile (the Export tile in `accentSoft` with an `onAccentSoft` download icon; the Import tile in `cool` with an `onCool` upload icon). Export uses a filled accent button; Import uses an outlined `ink` button.
- The CSV sample block has an `ink` background, `background`-colored text and a 14dp radius.

## Icons
Use Material Symbols (Outlined), or simple stroke icons, of similar weight: settings (gear), history/chart, download, upload, remove, add, edit, chat-bubble for notes. For the "Pantry" nav item, a cylinder/database icon reads as a can.
