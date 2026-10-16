# Character Art Spec — "Samsu Jeongi" (pixel-art RPG)

## 1. Project context
A turn-based pixel-art RPG where every action is decided by rock-paper-scissors (RPS), and most things (job, companions, weapons, mounts) come from gacha.
Each character has a **hand affinity**: Rock, Scissors, Paper, or Balanced. That affinity should show in the costume's accent color.

## 2. Global art rules

### Style
- Cute anime chibi pixel art, about **3 heads tall** (head is roughly 1/3 of total height).
- The face is calm and pretty. The body, costume, and weapon carry a lot of detail.
- **Do not copy any existing artwork or character.** Match the style only.

### Sizes (deliverables per character)
| Asset | Canvas (px) | Notes |
|---|---|---|
| Battle sprite | 64 × 96 | character ~90 px tall, feet at y = 91, facing RIGHT |
| Map/party mini sprite | 32 × 40 | 2-head super-deformed version of the same design |
| Dialogue portrait | 64 × 64 | bust, 3 expressions: neutral / smile / determined |
| Gacha card art | 96 × 128 | full body, dynamic pose, simple effect background (optional) |

### Palette
Base palette is ENDESGA 32:
```
#be4a2f #d77643 #ead4aa #e4a672 #b86f50 #733e39 #3e2731 #a22633
#e43b44 #f77622 #feae34 #fee761 #63c74d #3e8948 #265c42 #193c3e
#124e89 #0099db #2ce8f5 #ffffff #c0cbdc #8b9bb4 #5a6988 #3a4466
#262b44 #181425 #ff0044 #68386c #b55088 #f6757a #e8b796 #c28569
```
Extra colors for skin and rarity effects:
- Skin: highlight `#fff3ec`, base `#fde0d3`, shade `#f2b9ac`, deep `#d98f88`
- Blush: `#ff8fa8`
- Gold: `#fff4b8`, `#ffd23f`, `#c98a1b`
- Mythic crimson: `#ff6b9a`, `#d6004c`, `#7a0030`
- Hero violet: `#c9a0ff`, `#8f5bd6`

Use 16–24 colors per character.

### Lines and shading
- 1 px outer outline in `#181425`. Inner lines use a darker shade of the local color.
- Light comes from the top-left.
- Use 3–4 shading steps per material: highlight, base, shadow, deep shadow.
- No pillow shading. Clean up jaggies. Use anti-aliasing sparingly.
- Shadows lean cool (blue/violet); highlights lean warm.

### Hand-affinity accent colors
| Affinity | Accent |
|---|---|
| Rock | orange / brown (`#f77622`, `#b86f50`) |
| Scissors | teal / cyan (`#0099db`, `#2ce8f5`) |
| Paper | pink / white (`#f6757a`, `#b55088`, `#ffffff`) |
| Balanced | gold (`#feae34`) |

## 3. Face construction (measured, battle-sprite scale)
| Part | Rule |
|---|---|
| Face width | ~24 px. Rounded cheeks, small chin. Center of face nearly white (`#fff3ec`), cheeks peach (`#fde0d3`), edges `#f2b9ac`. |
| Upper eyelid | A **near-black band, 2 px thick and ~10 px wide**, almost straight, extending slightly past the eye on the outer side. This creates the calm, half-lidded look. |
| Eye | 4 rows below the lid, ~9 px wide. Visible white of the eye (1–2 px) on both sides. Iris ~5 px wide: top row dark, a **2 px white highlight** in the upper middle, a dark pupil, then lighter iris rows below, and a final row of mid iris color. **No black line under the eye.** |
| Eye spacing | ~4–6 px between eyes. Eyes sit at the vertical middle of the face. |
| Nose | 1 px, skin-shade color. |
| Mouth | A **5 px soft peach line** (`#f2b9ac`), very low contrast. Never a dark red dot. An open-mouth version is allowed for expressions. |
| Blush | A few pixels of `#f2b9ac` / `#ff8fa8` on the lower outer cheeks. |
| Bangs | Thin pointed strands reaching down to the eyelids. Each strand gets a darker outline on both sides. Small triangles of forehead show between strands. |
| Hair | Big volume, 4–5 tones, a bright sheen arc around the crown, side locks framing the cheeks down to the chin. |

### Male variant
- Same structure, but the eyelid band tilts down toward the inner corner (sharper look).
- Iris slightly narrower. No blush.
- Optional small scar, stronger jaw.

## 3-1. Battle pose and gaze (important)
- Use a **3/4 view (about 45°)** turned toward the enemy side. Party members stand on the right and face LEFT toward the enemies.
- **The eyes must look toward the enemy (screen left), not at the camera.** The pupils sit on the side of the eye that faces the enemy.
- PixelLab prompt wording that helps: *"three-quarter view facing left, eyes looking to the left toward an enemy, gaze not directed at the viewer"*.

## 4. Animations (battle sprite, 64 × 96, facing right, transparent background)
| Animation | Frames | Frame time | Notes |
|---|---|---|---|
| idle | 4 | 180 ms | breathing (upper body 1 px), hair/cloth sway, blink on 1 frame |
| attack | 6 | 80 ms | wind-up, strike with smear, impact spark, recover |
| skill | 6–8 | 90 ms | affinity-colored effect |
| hit | 2 | 100 ms | flinch back |
| victory | 4 | 120 ms | |
| down | 3 | 120 ms | |

### Sheet layout and files
- Sheet layout: one row per animation, frames left to right, each cell 64 × 96. PNG with alpha. No scaling.
- File naming: `{id}_battle.png`, `{id}_mini.png`, `{id}_portrait.png`, `{id}_card.png`

## 5. Main characters (detailed)

### iro — Iro (protagonist), Balanced, boy, 17
- **Look:** messy spiky brown hair with orange highlights, red headband with long trailing tails, warm brown eyes. Cheerful, never gives up.
- **Costume:**
  - Red scarf with fluttering tails
  - Navy martial-arts jacket with gold trim over a white inner collar
  - Wide orange sash
  - Baggy grey martial pants with cream shin wraps
  - Brown boots with gold bands
- **Weapon:** a pair of big steel gauntlets with gold cuffs and a small cyan gem on the back of each hand.
- **Pose:** fighting stance, front fist forward at chin height, back fist guarding the chest, wide stance.
- **Attack:** a straight punch with a speed smear and a white/yellow impact spark.

### museoe — Museoe, Rock, man, mid-20s (story companion, Hero rarity)
- **Look:** swept-back silver-white hair, sharp amber eyes, small scar on the cheek. Tall, stoic, handsome guard captain.
- **Costume:**
  - Dark gunmetal plate armor with gold trim
  - Round gold emblem on the chest
  - Gold knee and boot bands
  - Long red cape
- **Weapon:** a large kite shield (steel rim, brown-orange field, gold rock emblem with a stone inside, gold studs) in the front hand, and a gold-headed flanged mace in the back hand.
- **Skill:** a shield bash, with a light glint sweeping across the shield.

### serin — Serin, Scissors, girl, 19 (story companion, Hero rarity)
- **Look:** short messy teal-black hair with one long side lock, cat-like cyan eyes, a confident smirk. Thief and gambler.
- **Costume:**
  - Cropped dark jacket with teal lining
  - Fingerless gloves
  - Belt with dice charms and coin pouches
  - Shorts with thigh straps
  - Ankle boots
  - Red tassel earring
- **Weapon:** twin short curved blades (teal-steel, red grips) held in reverse grip.
- **Skill:** a dice throw with a gold coin sparkle effect.

### haram — Haram, Paper, girl, 18 (story companion, Hero rarity)
- **Look:** very long straight dark navy hair with a blue sheen, gold flower hairpin with a red tassel, a white ribbon, violet eyes. Calm and gentle, hides a secret.
- **Costume (shrine maiden):**
  - White kimono top with a red inner collar
  - Huge sleeves with red cords at the ends
  - Pink pleated hakama with a gold-thread hem and a cloud pattern
  - Pink and gold obi with a big gold bow at the back
  - White tabi with red-strap sandals
- **Weapon:** a tall gohei (purification wand): wooden staff, gold cap, white zigzag paper streamers that flutter.
- **Skill:** paper talismans orbit her and glow cyan.

## 6. Gacha companion roster (30)
Rarities: N = Common, U = Uncommon, R = Rare, E = Hero, L = Legendary, M = Mythic.
Higher rarity means bigger silhouettes, more ornaments, and more glow.

| id | Name | Rarity | Hand | Role | Look keywords |
|---|---|---|---|---|---|
| guard | Village Guard | N | Rock | tank | leather cap, spear, patched tunic |
| herbalist | Wandering Herbalist | N | Paper | healer | straw hat, herb basket, green scarf |
| fisher | Apprentice Fisher | N | Scissors | DPS | rolled sleeves, net, fishing knife |
| courier | Courier Girl | N | Paper | support | messenger bag, letters, cap with feather |
| woodcutter | Woodcutter Boy | N | Rock | DPS | small axe, flannel, bandage on nose |
| gambler | Stray Gambler | N | Scissors | trickster | loose vest, cards in hand |
| miner | Stone Kingdom Miner | U | Rock | tank | helmet lamp, pickaxe, soot |
| pickpocket | Twin-Blade Pickpocket | U | Scissors | DPS | hood, dagger, many pockets |
| acolyte | Cloud Acolyte | U | Paper | healer | white robe, prayer beads, cloud halo |
| archer | Bamboo Archer | U | Scissors | DPS | bamboo bow, green hakama, quiver |
| teahouse | Teahouse Server | U | Paper | support | apron, tea tray as shield |
| recruit | Shield Recruit | U | Rock | tank | oversized shield, nervous face |
| dancer | Street Dancer | U | Balanced | buffer | ribbons, bells, bright sash |
| priestess | Cloud Priestess | R | Paper | healer | layered veils, floating paper |
| deserter | Black Hand Deserter | R | Balanced | DPS | broken black armor, purple scar |
| ronin | Twin-Blade Ronin | R | Scissors | DPS | worn haori, two katanas |
| tamer | Golem Tamer | R | Rock | summoner | mini stone golem pet, goggles |
| seer | Fortune Teller | R | Paper | debuffer | crystal ball, star-pattern shawl |
| kiterider | Kite Rider | R | Paper | DPS | goggles, giant paper kite |
| smith | Blacksmith's Daughter | R | Rock | DPS | big hammer, apron, glowing tongs |
| giantgirl | Stone Giant Girl | E | Rock | tank | tall, rock-plate arms, flower crown |
| lantern | Red Lantern Dancer | E | Scissors | DPS | red lanterns, fan blades, silk |
| dealer | Dice Casino Dealer | E | Balanced | RNG manipulator | suit and vest, giant floating dice |
| stormmaiden | Storm Shrine Maiden | E | Paper | mage | lightning paper charms, wind hair |
| masked | Masked Swordsman | E | Scissors | DPS | white mask, long scarf, thin blade |
| apostle_ban | Apostle of Ban (Rock God) | L | Rock | tank | stone halo, gold rock gauntlets, regal |
| apostle_jeol | Apostle of Jeol (Scissors God) | L | Scissors | DPS | crystal blades orbiting, cyan wings |
| apostle_po | Apostle of Po (Paper God) | L | Paper | healer | flowing cloth wings, floating scrolls |
| yeon | Yeon (from 300 years ago) | M | Balanced | support | ethereal white-gold dress, fading edges, gentle smile |
| raun_true | Raun, Goddess of Fate (true form) | M | Balanced | RNG god | star-filled hair, fate dice crown, rainbow glow |

## 7. Checklist per character
- [ ] Silhouette readable when filled with one solid color
- [ ] Face follows section 3 exactly (eyelid band, eye whites, soft mouth)
- [ ] Affinity accent color visible on the costume
- [ ] Weapon clearly readable at 1× scale
- [ ] All animations listed in section 4, same canvas, feet at y = 91
- [ ] PNG with transparency, no scaling, file names as specified
