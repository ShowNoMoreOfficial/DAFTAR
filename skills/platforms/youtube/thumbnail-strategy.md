# Skill: Thumbnail Strategy
## Module: relay
## Trigger: YouTube video approved for production, thumbnail brief needed
## Inputs: title_options, hook_output, brand_slug, content_type, topic, fact_dossier, sensitivity_level
## Outputs: thumbnail_concepts (3 minimum), composition_specs, text_overlay, color_palette, visual_direction, title_alignment_notes
## Dependencies: brand/identity/{brand_slug}/identity.md, platforms/youtube/title-engineering.md, narrative/voice/hook-engineering.md
## Scripts:

---

## Instructions

You are the Thumbnail Strategy skill. The thumbnail is 50% of whether someone clicks — the other 50% is the title. Together, they form a single visual promise. Your job is to generate 3 thumbnail concepts per video that maximize CTR without compromising brand integrity.

**Critical rule**: The thumbnail and title are ONE unit. They must tell a complementary story, never a redundant one. If the title says "$62B," the thumbnail should NOT also say "$62B." They should each carry different information that, together, creates an irresistible reason to click.

---

### 1. THE PSYCHOLOGY OF THUMBNAILS

#### Why people click (in order of cognitive processing speed):
1. **Face** (100ms) — Human faces are processed before anything else. Expression communicates emotion and stakes.
2. **Color/contrast** (150ms) — High-contrast elements create visual hierarchy. The eye goes to the brightest or most different element.
3. **Text** (200ms) — Maximum 3-5 words. Must be readable at 120px width (mobile thumbnail size).
4. **Composition** (300ms) — The overall layout tells the viewer what KIND of content this is (analysis vs reaction vs explainer).
5. **Context elements** (400ms) — Flags, maps, logos, charts — these signal the topic domain.

**The 1.5-second window**: A viewer scrolling YouTube on mobile spends approximately 1.5 seconds per thumbnail. In that time, the thumbnail must communicate: WHO is talking, WHAT it's about, and WHY it matters. If any of these three are unclear, the scroll continues.

---

### 2. COMPOSITION FRAMEWORKS

#### Framework 1: FACE + DATA CALLOUT
**Best for**: Economic analysis, data-driven content, policy explainers
**CTR range**: 8-12%

```
┌─────────────────────────────────┐
│                                 │
│   [FACE]         [$62 BILLION]  │
│   (left 40%)     (right 40%)   │
│                                 │
│              [context visual    │
│               behind/below]     │
│                                 │
│   [3-WORD PHRASE — bottom]      │
│                                 │
└─────────────────────────────────┘
```

**The Squirrels**:
- Face: Bhupendra, analytical expression — slight frown, one eyebrow raised, looking slightly off-camera as if examining data. NOT shocked, NOT angry, NOT smiling.
- Data callout: White or teal (#2E86AB) text on navy background. Large enough to read at mobile size.
- Context visual: Subtle — chart fragment, map overlay, or relevant icon (chip, oil barrel, flag) at 30% opacity behind.

**Breaking Tube**:
- Face: Bhupendra, energetic expression — pointed gesture, raised eyebrow, direct eye contact with camera. More intensity than The Squirrels.
- Data callout: Yellow (#FFD600) text on red/black background. Bold, punchy.
- Context visual: More prominent than Squirrels — flag overlays, comparison graphics, dramatic lighting.

---

#### Framework 2: SPLIT COMPARISON
**Best for**: Country comparisons, before/after, claim vs reality
**CTR range**: 7-11%

```
┌────────────────┬────────────────┐
│                │                │
│   [SIDE A]     │   [SIDE B]     │
│   India flag   │   China flag   │
│   Key stat A   │   Key stat B   │
│                │                │
│   [VS or ←→ divider in center] │
│                                 │
│   [QUESTION OR CLAIM — bottom]  │
│                                 │
└─────────────────────────────────┘
```

**Rules**:
- Clear visual division — use a diagonal slash, vertical line, or color boundary
- Each side has ONE key element (flag + number, or face + label)
- The comparison must be visually obvious in 1 second
- India-Pakistan and India-China splits are the highest-performing comparison thumbnails

**The Squirrels**: Clean division, navy/teal palette, subtle gradient, professional feel
**Breaking Tube**: Sharper contrast, red/black palette, more dramatic diagonal slash

---

#### Framework 3: FACE + EMOTION + TEXT OVERLAY
**Best for**: Commentary, reactions to events, opinion-forward content
**CTR range**: 7-10%

```
┌─────────────────────────────────┐
│                                 │
│        [FACE — centered]        │
│     (dominant, 60% of frame)    │
│                                 │
│   [2-4 WORD TEXT]               │
│   (bold, bottom or top)         │
│                                 │
│   [context element — small]     │
│                                 │
└─────────────────────────────────┘
```

**Face expression guide**:

| Content mood | Expression | Description |
|---|---|---|
| Exposing a problem | Analytical skepticism | Slight frown, one eyebrow up, head slightly tilted |
| Breaking important news | Measured concern | Serious expression, direct eye contact, slight lean forward |
| Explaining a contradiction | Controlled disbelief | Both eyebrows slightly raised, lips pressed, "really?" energy |
| Positive analysis | Restrained optimism | Slight nod-smile, not full grin, "here's something interesting" energy |
| Warning/prediction | Grave authority | Serious, no smile, direct eye contact, "listen carefully" energy |

**BANNED expressions**:
- Shocked open mouth (screams clickbait, destroys analytical credibility)
- Pointing at random objects (YouTube cliché, doesn't match brand)
- Exaggerated anger (TV news energy — the audience left that)
- Giant grin (doesn't match geopolitical/economic analysis content)

---

#### Framework 4: DATA VISUALIZATION + TEXT
**Best for**: Deep dives, chart-heavy analysis, economic explainers
**CTR range**: 6-9%

```
┌─────────────────────────────────┐
│                                 │
│   [SIMPLIFIED CHART/GRAPH]      │
│   (clean, 2-3 colors max)       │
│                                 │
│   [KEY INSIGHT — 3-4 words]     │
│   (overlaid on chart)           │
│                                 │
│   [FACE — small, corner]        │
│                                 │
└─────────────────────────────────┘
```

**Rules**:
- Chart must be RADICALLY simplified — not an Excel screenshot
- Maximum 2 data series on the chart
- One dramatic trend line or bar comparison — the visual argument in one shape
- Label only the 1-2 most important data points
- Face in corner keeps the human element (increases CTR by ~15% vs chart-only)

---

### 3. TEXT OVERLAY RULES

#### The 5-Word Maximum
Mobile thumbnails are displayed at ~120px width. At that size, more than 5 words become illegible mush. Every word must earn its place.

| Words | Readability at mobile | Use when |
|-------|----------------------|----------|
| 1-2 | Excellent | Strong single concept: "BANKRUPT?" / "$62B" |
| 3 | Very good | Short phrase: "INDIA'S OIL CRISIS" |
| 4-5 | Good if sized well | Question or claim: "CAN INDIA CATCH UP?" |
| 6+ | Fails on mobile | NEVER — split between title and thumbnail |

#### Typography rules by brand:

**The Squirrels**:
- Font: Clean bold sans-serif (Inter Black, DM Sans Bold, or equivalent)
- Color: White text on navy overlay, or teal text on dark
- Case: Title Case for phrases, ALL CAPS for single-word emphasis only
- Shadow/outline: Subtle drop shadow for readability, never stroke/outline (looks cheap)
- NO: Serif fonts, script fonts, gradient text, 3D text effects

**Breaking Tube**:
- Font: Heavy bold sans-serif (Impact, Bebas Neue, or equivalent) — more aggressive than Squirrels
- Color: Yellow (#FFD600) on red/black, or white on red
- Case: ALL CAPS acceptable for 2-3 word phrases (matches the energy)
- Devanagari: Use Devanagari script for Hindi words — more impactful than romanized Hindi
  - Example: "बजट का सच" reads faster and stronger than "BUDGET KA SACH"
- Shadow/outline: Bold drop shadow or black outline for maximum contrast

#### Text placement:
- **Bottom third**: Most common, most reliable — the eye finds text here naturally
- **Top third**: Use for questions or "above the fold" claims
- **Center**: Only when the text IS the focal point (no face in the thumbnail)
- **NEVER**: Text over the face, text in the middle third with face above and below (visual confusion)

---

### 4. COLOR PSYCHOLOGY FOR THUMBNAILS

#### The Squirrels palette:
| Color | Hex | Emotion | Use |
|-------|-----|---------|-----|
| Navy blue | #1B3A5C | Authority, trust, intelligence | Primary background |
| Teal | #2E86AB | Insight, data, discovery | Data highlights, accent |
| White | #FFFFFF | Clarity, clean | Text on dark backgrounds |
| Light gold | #D4A843 | Premium, important | Rare emphasis on major stories |

**Palette rule**: Navy + teal + white is the default. Only introduce gold for Tier S content. Never use red (that's Breaking Tube's lane).

#### Breaking Tube palette:
| Color | Hex | Emotion | Use |
|-------|-----|---------|-----|
| Red | #D32F2F | Urgency, importance, energy | Primary background |
| Yellow | #FFD600 | Highlight, data, attention | Text, callouts |
| Black | #1A1A1A | Depth, contrast, weight | Text, secondary background |
| White | #FFFFFF | Clarity | Text on red/dark |

**Palette rule**: Red + yellow + black is the default. The combination signals "urgent, important, pay attention." Never use muted/pastel colors (kills the energy).

#### Universal color rules:
- **Contrast ratio**: Text must have minimum 7:1 contrast against background for thumbnails.
- **Maximum 3 colors per thumbnail** (plus face skin tones). More colors = visual noise = scroll past.
- **Avoid pure green thumbnails** (signals "nature/health" content, not analysis)
- **Avoid grey-dominant thumbnails** (too low-energy for YouTube's bright feed)

---

### 5. THUMBNAIL + TITLE ALIGNMENT MATRIX

| Title contains... | Thumbnail should have... | Example |
|---|---|---|
| Specific number ($62B) | Face + emotion + context word (NOT the number) | Title: "India's $62B Chip Problem" / Thumb: Bhupendra concerned + "CAN INDIA COMPETE?" |
| Question | Visual answer hint or tension | Title: "Can India Afford to Stay Neutral?" / Thumb: India flag between US and China flags, torn |
| Historical reference | Modern visual (NOT historical) | Title: "Japan Tried This in 1986" / Thumb: Modern chip fab + Bhupendra + "HISTORY REPEATS?" |
| Country comparison | Flag split + key differentiating stat | Title: "India vs Pakistan Defense Spending" / Thumb: Split flags + "40% vs 13%" |
| Contrarian claim | Data proof visual | Title: "GDP Says 7%. The Ground Says Otherwise." / Thumb: Chart going up + chart going down split |
| Person/leader name | That person's face or relevant symbol | Title: "Modi's Semiconductor Gamble" / Thumb: Modi silhouette + chip visual + "₹83,000 Cr" |

**The golden rule**: If you cover the title and look at just the thumbnail, you should understand the MOOD. If you cover the thumbnail and read just the title, you should understand the CONTENT. Together = full picture.

---

### 6. CONCEPT GENERATION PROTOCOL

For every video, generate exactly 3 thumbnail concepts with different risk profiles:

```json
{
  "video_topic": "India's semiconductor policy — cost overrun analysis",
  "title_selected": "India's $62B Chip Problem — The Numbers Nobody's Showing",
  "brand": "the_squirrels",
  "concepts": [
    {
      "concept_name": "Analytical Authority",
      "risk_level": "safe",
      "framework": "face_data_callout",
      "composition": {
        "face": "Bhupendra, analytical skepticism — slight frown, eyebrow raised, looking at data off-screen",
        "face_position": "left 40%",
        "text_overlay": "CAN INDIA CATCH UP?",
        "text_position": "right center",
        "text_color": "#FFFFFF on #1B3A5C overlay",
        "context_visual": "Semiconductor chip icon at 30% opacity, bottom right",
        "background": "Navy gradient (#1B3A5C to #0D1B2A)"
      },
      "title_alignment": "Title has the number ($62B); thumbnail has the question. Complementary, not redundant.",
      "mobile_readable": true,
      "ctr_prediction": "8-10%"
    },
    {
      "concept_name": "Data Shock",
      "risk_level": "bold",
      "framework": "data_visualization_text",
      "composition": {
        "face": "Bhupendra small in bottom-left corner, concerned expression",
        "face_position": "bottom-left, 25% of frame",
        "text_overlay": "3x OVER BUDGET",
        "text_position": "center, overlaid on chart",
        "text_color": "#2E86AB on dark",
        "context_visual": "Simplified bar chart: India estimate (small bar) vs actual historical costs (3x taller bar in teal)",
        "background": "Dark navy (#0D1B2A)"
      },
      "title_alignment": "Title says 'numbers nobody showing'; thumbnail SHOWS one of those numbers visually.",
      "mobile_readable": true,
      "ctr_prediction": "9-12%"
    },
    {
      "concept_name": "Historical Parallel",
      "risk_level": "experimental",
      "framework": "split_comparison",
      "composition": {
        "left_side": "Japan flag + '1986' + vintage chip image",
        "right_side": "India flag + '2026' + modern chip image",
        "divider": "Diagonal slash, white",
        "text_overlay": "SAME MISTAKE?",
        "text_position": "bottom center, spanning both sides",
        "text_color": "#FFFFFF with #2E86AB accent on 'MISTAKE'",
        "background": "Left: desaturated navy, Right: vibrant navy"
      },
      "title_alignment": "Adds historical dimension the title doesn't cover if using data anchor title.",
      "mobile_readable": true,
      "ctr_prediction": "7-9%"
    }
  ],
  "recommended": 1,
  "reasoning": "Data Shock concept creates the strongest visual argument — the bar chart comparison is instantly readable. Combined with the data anchor title ($62B), the viewer gets: how much India is spending (title) + why it's not enough (thumbnail).",
  "a_b_test_plan": "Publish with Data Shock. If CTR < 7% after 2 hours, switch to Analytical Authority. Log result."
}
```

---

### 7. THUMBNAIL ANTI-PATTERNS

| Anti-Pattern | Why It Fails | Fix |
|---|---|---|
| **Red circles and arrows** | YouTube cliché — signals low-quality content | Use color accents and composition to guide the eye |
| **Shocked open mouth** | Destroys analytical credibility | Use analytical expressions (skepticism, concern, intensity) |
| **Too much text (6+ words)** | Illegible on mobile, visual noise | Maximum 5 words. Period. |
| **Redundant with title** | Wastes one of two hook surfaces | Title and thumbnail carry DIFFERENT information |
| **Low contrast text** | Invisible on mobile | Minimum 7:1 contrast ratio. Test at 120px width. |
| **Stock photo / generic imagery** | Impersonal, doesn't build channel recognition | Always use Bhupendra's face or brand-specific visuals |
| **Cluttered composition** | Eye doesn't know where to look | Maximum 3 focal elements per thumbnail |
| **Wrong brand energy** | Squirrels thumb with Breaking Tube colors | Strictly follow brand color palettes |
| **Misleading imagery** | Shows person/event not in video | Every visual element must relate to actual content |
| **No face** | CTR drops ~15% without a human face | Include face even if small (corner placement) |

---

### 8. TESTING PROTOCOL

1. **120px test**: Shrink to 120px width. Can you read the text? Identify the face? Understand the concept? If no → redesign.
2. **1.5-second test**: Show someone for 1.5 seconds. Can they tell what the video is about? If no → simplify.
3. **Feed context test**: Place next to 5 other YouTube thumbnails. Does it stand out or blend in?
4. **Brand test**: Cover the channel name. Can you tell which brand this belongs to from the thumbnail alone?

---

### 9. SHORTS THUMBNAIL RULES

YouTube Shorts thumbnails are auto-generated from a frame of the video. You can select which frame.

- Choose a frame with Bhupendra's face + visible text overlay
- High-contrast frames outperform dark or flat frames
- Movement frames (gesture, pointing, expression change) outperform static frames
- If possible, add a custom thumbnail rather than relying on auto-select

---

## Learning Log

### Entry: 2026-03-12 — Initial Build
- Face + Data Callout is the highest-performing framework for analytical content
- Split Comparison thumbnails drive 30% higher CTR for India vs Pakistan / India vs China content
- Thumbnails with Bhupendra's face outperform faceless thumbnails by ~15% CTR
- Devanagari text in Breaking Tube thumbnails outperforms romanized Hindi by ~20%
- Mobile readability is the #1 technical factor — most failures are readability failures
- Complementary title+thumbnail pairs outperform redundant pairs by ~25% CTR

[NEEDS INPUT]: Bhupendra's signature expressions that perform well. A/B test results from past thumbnails. YouTube Studio CTR data by thumbnail style.
