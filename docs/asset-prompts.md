# Splendor — AI Art Asset Prompt Pack

Generate these in ChatGPT (image generation). Work through the segments **in one single chat session** so the style stays consistent across every file.

## How to use this pack

1. Open a new ChatGPT chat and paste **Segment 0 (the Master Style Guide)** first. It generates nothing — it just locks in the art direction.
2. Then send each asset prompt **one message at a time**, in order. Each message produces exactly one image.
3. Download every image and rename it to the **exact filename** shown — the game code will reference these paths.
4. Put everything under `public/assets/` in the repo, keeping the folder structure shown.

**Rules that apply to every single image (repeat them if ChatGPT drifts):**
- No text, no letters, no numbers, no logos, no watermarks anywhere in the image.
- No borders or frames — the game UI draws its own card frames and borders.
- Where "transparent background" is specified, it must be a true transparent PNG, not a checkerboard pattern or dark backdrop.
- Keep the exact same painting style, palette, and lighting as established in the style guide, in every image.

---

## Segment 0 — Master Style Guide (paste first, generates nothing)

> You are my art director for a complete board game asset set. Do not generate an image for this message — just confirm you understand and keep this style locked for everything that follows.
>
> **Art direction for all images in this chat:** Opulent Renaissance oil-painting style crossed with premium modern board-game illustration. Rich, saturated jewel tones — emerald, sapphire, ruby, onyx, diamond-white — against deep warm shadows. Dramatic chiaroscuro lighting like candlelit Flemish masters. Ornamental gold-leaf accents that glint. Painterly brushwork with fine detail, never flat vector, never cartoon, never photo-real 3D render. A cohesive world: the gem trade of a fantastical 15th-century Mediterranean — mines, caravans, harbors, workshops, and palaces. Every image must feel like it belongs to the same luxurious game on the same table.
>
> Unless I say otherwise: no text or numbers of any kind, no borders or frames, no watermarks. When I ask for "transparent background," output a true transparent PNG.

---

## Segment 1 — Gem tokens (6 files, transparent, 1024×1024)

These are round poker-chip-style tokens seen from slightly above. One prompt per message.

| # | Prompt | Save as |
|---|--------|---------|
| 1 | A single round game token, 1:1, transparent background. A brilliant-cut **diamond** (white gem, icy prismatic sparkle) set in the center of an ornate engraved **silver-white and gold** coin-like chip. Slight top-down perspective, dramatic gleam, painterly Renaissance style per our style guide. Fills ~90% of frame. | `tokens/token-white.png` |
| 2 | Same token design as before, same angle, same size in frame: now a deep royal-blue **sapphire** set in the chip, with blue enamel inlay details on the gold rim. Transparent background. | `tokens/token-blue.png` |
| 3 | Same token design: a vivid green **emerald**, rectangular emerald-cut, with green enamel inlay on the gold rim. Transparent background. | `tokens/token-green.png` |
| 4 | Same token design: a glowing crimson **ruby**, oval-cut, with red enamel inlay on the gold rim. Transparent background. | `tokens/token-red.png` |
| 5 | Same token design: a polished black **onyx**, cabochon-cut with smoky violet reflections, dark enamel inlay on the gold rim. Transparent background. | `tokens/token-black.png` |
| 6 | Same token design but grander: a pure **gold joker token** — instead of a gemstone, a radiant embossed golden sunburst in the center, the whole chip in layered golds, clearly the most precious token of the set. Transparent background. | `tokens/token-gold.png` |

---

## Segment 2 — Small gem icons (6 files, transparent, 1024×1024)

Simpler, bolder cut-out gems (no chip/coin) used for cost bubbles and noble requirements. They must read clearly at 20 pixels.

| # | Prompt | Save as |
|---|--------|---------|
| 1 | A single cut gemstone only, no token, no coin, transparent background, 1:1: a white **diamond**, simple bold silhouette, strong facets, high contrast so it stays readable when shrunk very small. Painterly but clean. Fills ~85% of frame. | `gems/gem-white.png` |
| 2 | Same framing and simplicity: a blue **sapphire**. Transparent background. | `gems/gem-blue.png` |
| 3 | Same framing: a green **emerald**, emerald-cut. Transparent background. | `gems/gem-green.png` |
| 4 | Same framing: a red **ruby**. Transparent background. | `gems/gem-red.png` |
| 5 | Same framing: a black **onyx** with subtle violet sheen and a bright edge highlight so it reads on dark backgrounds. Transparent background. | `gems/gem-black.png` |
| 6 | Same framing: a small radiant **gold ingot or gold sunburst coin**, clearly gold not yellow gem. Transparent background. | `gems/gem-gold.png` |

---

## Segment 3 — Development card artwork (15 files, portrait 1024×1536)

Full-bleed painted scenes for card faces. The UI overlays its own dark gradient at top (for the points and gem icon) and bottom-left (for costs), so: **keep the most interesting detail in the middle of the frame, keep the top fifth and the lower-left corner relatively calm.** No frames, no text.

Theme logic — tier = economic level, color = the gem's world:
- **Tier 1: extraction** (mines, quarries, panning, first caravans)
- **Tier 2: craft & trade** (workshops, gem-cutters, ships, merchant houses)
- **Tier 3: splendor** (palaces, royal courts, legendary treasures)

| # | Prompt | Save as |
|---|--------|---------|
| 1 | Portrait 2:3 card art: a snowy alpine **diamond quarry** at dawn, miners with pickaxes working glittering white crystal veins in a marble cliff face, cold blue-white light with warm lantern accents. Center-weighted composition, calm top edge. | `cards/card-t1-white.png` |
| 2 | Portrait 2:3 card art: a moonlit coastal cave where divers surface with baskets of raw **sapphires**, deep blue water glowing, wet stone jetty. | `cards/card-t1-blue.png` |
| 3 | Portrait 2:3 card art: a lush jungle **emerald mine**, vines over ancient stone shaft entrance, miners hauling green-glinting ore into wooden carts, shafts of green-gold light. | `cards/card-t1-green.png` |
| 4 | Portrait 2:3 card art: a scorched desert canyon **ruby dig**, red rock strata, tents and rope ladders, rubies sparking like embers in the cliff, hot amber late-day light. | `cards/card-t1-red.png` |
| 5 | Portrait 2:3 card art: a torch-lit volcanic cavern of black **onyx**, obsidian pillars with violet reflections, miners chiseling glossy black stone, dramatic firelight. | `cards/card-t1-black.png` |
| 6 | Portrait 2:3 card art: a bright **diamond-cutter's workshop**, master lapidary at a wheel, loupes and brass tools, finished diamonds scattering prismatic light across white marble benches. | `cards/card-t2-white.png` |
| 7 | Portrait 2:3 card art: a **sapphire merchant's galleon** in a busy harbor at dusk, blue silk banners, crates of blue gems being carried down the gangplank, lantern-lit rigging. | `cards/card-t2-blue.png` |
| 8 | Portrait 2:3 card art: an **emerald trading house** in a canal city, green awnings, merchants weighing emeralds on brass scales, ledgers and strongboxes, verdant afternoon light. | `cards/card-t2-green.png` |
| 9 | Portrait 2:3 card art: an armored **ruby caravan** crossing dunes at sunset — camels, spearmen escorts, iron-bound chests leaking red gem-light, long shadows. | `cards/card-t2-red.png` |
| 10 | Portrait 2:3 card art: a shadowy **onyx jeweler's atelier** at night, black-stone cameos and rings on dark velvet, a jeweler in dark robes polishing onyx by candlelight. | `cards/card-t2-black.png` |
| 11 | Portrait 2:3 card art: a white-marble **palace of diamonds** — crystalline chandeliers, a throne inlaid with diamonds, sunbeams refracting into rainbows through tall windows. | `cards/card-t3-white.png` |
| 12 | Portrait 2:3 card art: a **sapphire sultan's court** — lapis-tiled domes, peacocks, a ceremonial crown of sapphires on a velvet cushion under moonlight through arched windows. | `cards/card-t3-blue.png` |
| 13 | Portrait 2:3 card art: a hidden **emerald garden palace** — topiary and fountains threaded with gold, a royal pavilion whose columns are set with emeralds, magical green-gold glow. | `cards/card-t3-green.png` |
| 14 | Portrait 2:3 card art: a **ruby coronation hall** — crimson banners, a great ruby the size of a heart on a golden altar, cardinals and courtiers in red, blazing candlelight. | `cards/card-t3-red.png` |
| 15 | Portrait 2:3 card art: an **onyx vault of kings** — a midnight treasury of black stone, heaps of dark treasure, an obsidian sarcophagus-like vault door ajar with violet gleam. | `cards/card-t3-black.png` |

---

## Segment 4 — Card backs (3 files, portrait 1024×1536)

One shared design, recolored per tier. These are the face-down deck stacks. Symmetric, ornamental, no text. (The UI adds its own tier pips.)

| # | Prompt | Save as |
|---|--------|---------|
| 1 | Portrait 2:3 ornamental **card back**: symmetrical gold filigree arabesque on deep **midnight green**, a single small faceted gem motif at center, corners mirrored, elegant and calm like a luxury playing-card back. No text, no border cut lines. | `cards/card-back-t1.png` |
| 2 | Exactly the same card back design and layout, recolored: gold filigree on deep **midnight blue**. | `cards/card-back-t2.png` |
| 3 | Exactly the same card back design and layout, recolored: gold filigree on deep **royal purple**. | `cards/card-back-t3.png` |

---

## Segment 5 — Noble portraits (10 files, square 1024×1024)

Waist-up Renaissance portraits, same painterly style, each a distinct character. Dark ornamental background so gold UI text reads over it. No text.

| # | Prompt | Save as |
|---|--------|---------|
| 1 | Square Renaissance portrait, waist-up: a stern **dowager queen** in black brocade and a diamond-studded widow's cap, pale commanding face, dark damask background. | `nobles/noble-01.png` |
| 2 | Square portrait: a shrewd **banker-prince** in crimson velvet with gold chains of office, counting-house shadows behind him, knowing half-smile. | `nobles/noble-02.png` |
| 3 | Square portrait: a young **navigator-princess** with wind-touched hair, deep blue cloak pinned with a sapphire brooch, faint harbor light behind. | `nobles/noble-03.png` |
| 4 | Square portrait: a magnificent **sultan** in an emerald silk turban with a ruby aigrette, embroidered robes, serene and powerful. | `nobles/noble-04.png` |
| 5 | Square portrait: a sharp-eyed **cardinal** in scarlet robes and zucchetto, ringed fingers steepled, candlelit study behind. | `nobles/noble-05.png` |
| 6 | Square portrait: an aging **master jeweler turned noble**, loupe hanging at his chest, velvet doublet, hands of a craftsman, warm workshop glow. | `nobles/noble-06.png` |
| 7 | Square portrait: a poised **duchess** in cloth-of-gold with an emerald parure (necklace and earrings), peacock feather in her hair, cool elegant gaze. | `nobles/noble-07.png` |
| 8 | Square portrait: a battle-worn **condottiero lord** in blackened parade armor chased with gold, onyx pommel visible, scarred confident face. | `nobles/noble-08.png` |
| 9 | Square portrait: a mysterious **veiled trade-mistress of the silk road**, jewelled headpiece over a translucent veil, eyes that miss nothing, caravan twilight behind. | `nobles/noble-09.png` |
| 10 | Square portrait: a radiant **boy-king** in an oversized ermine mantle and a crown slightly too big, solemn and endearing, throne room bokeh of candles. | `nobles/noble-10.png` |

---

## Segment 6 — Environment & UI dressing (4 files)

| # | Prompt | Save as |
|---|--------|---------|
| 1 | Landscape 3:2, 1536×1024: a **tabletop background texture** — deep emerald-black damask brocade fabric seen from directly above, subtle woven pattern, soft vignette toward the edges, very dark and understated so bright game pieces pop on top. No objects, no text, texture only. | `ui/table-bg.png` |
| 2 | Transparent background, 1:1: an ornate **game emblem** — a radiant multi-gem starburst (diamond, sapphire, emerald, ruby, onyx arranged around a gold sun) inside a laurel of gold filigree. Symmetric, majestic, reads well small. No text. | `ui/emblem.png` |
| 3 | Transparent background, wide 3:2: a slim horizontal **gold filigree divider flourish**, symmetric, delicate scrollwork with a tiny gem at center — for separating UI sections. No text. | `ui/flourish.png` |
| 4 | Transparent background, 1:1: a small ornate **gold crown** with five points, each tipped with a tiny different-colored gem, painterly gold leaf — used as the nobles' icon and victory mark. No text. | `ui/crown.png` |

---

## Delivery checklist

```
public/assets/
├── tokens/   token-white.png  token-blue.png  token-green.png  token-red.png  token-black.png  token-gold.png
├── gems/     gem-white.png    gem-blue.png    gem-green.png    gem-red.png    gem-black.png    gem-gold.png
├── cards/    card-t{1,2,3}-{white,blue,green,red,black}.png   card-back-t{1,2,3}.png
├── nobles/   noble-01.png … noble-10.png
└── ui/       table-bg.png  emblem.png  flourish.png  crown.png
```

40 files total: 6 tokens + 6 gems + 15 card faces + 3 card backs + 10 nobles + 4 UI pieces.

**Tips for a consistent set**
- If any image drifts in style, reply: *"Redo in the exact style of the previous images — same palette, same painterly brushwork, per the style guide."*
- If ChatGPT adds text/frames anyway, reply: *"Remove all text and frames completely and regenerate."*
- Generate all six tokens back-to-back before moving on — they benefit most from consistency.
- Transparent-background items (tokens, gems, emblem, flourish, crown): verify the checkerboard shows in the preview before downloading.

Once the files are in `public/assets/`, tell Claude to wire them in — the game will swap its coded SVG art for these while keeping all animations and gameplay.
