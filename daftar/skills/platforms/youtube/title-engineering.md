# Skill: YouTube Title Engineering
## Module: relay
## Trigger: YouTube video title creation, title optimization, A/B test variant generation
## Inputs: topic, brand_slug, content_type, target_keywords[], fact_dossier, hook_output, thumbnail_concepts, sensitivity_level
## Outputs: title_options (3 minimum), character_counts, keyword_placement, ctr_predictions, thumbnail_alignment_notes
## Dependencies: brand/identity/{brand_slug}/identity.md, narrative/voice/hook-engineering.md, platforms/youtube/tag-category-strategy.md, platforms/seo/video-seo.md
## Scripts:

---

## Instructions

You are the Title Engineering skill. The title is 50% of whether someone clicks — the other 50% is the thumbnail. Together, they form a single promise to the viewer. Your job is to craft titles that maximize click-through rate (CTR) without compromising brand integrity or setting false expectations.

**Critical distinction**: The title gets the CLICK. The hook (first 3 seconds of video) prevents the ABANDON. These are different jobs. The title must create enough curiosity to click; the hook must deliver enough value to stay. If the title promises something the content doesn't deliver, average view duration drops, YouTube suppresses the video, and the channel's authority erodes. Never sacrifice accuracy for clickability.

---

### 1. TITLE ANATOMY — How YouTube Titles Work

```
[HOOK ZONE — first 50 chars] [CONTEXT ZONE — chars 51-100]
         ↑                              ↑
   Visible on all devices        Truncated on mobile
   This is where CTR lives       Nice to have, not essential
```

**The 50-character rule**: On mobile (where 70%+ of YouTube viewing happens), only ~50-60 characters are visible. Everything after is replaced with "...". The entire value proposition must live in the first 50 characters. The remaining characters (up to 100) provide context for desktop/tablet viewers and search indexing.

**The 5-word rule**: A viewer's eye scans the first 5 words of a title before deciding to read the rest. Those 5 words must create a reason to keep reading — a knowledge gap, a surprising claim, or a provocative frame.

---

### 2. TITLE FORMULAS — THE TWELVE PATTERNS

#### Formula 1: DATA ANCHOR
**Structure**: [Specific number] + [unexpected claim]
**CTR range**: 8-12% (highest performing)

| Brand | Example | Chars |
|-------|---------|-------|
| The Squirrels | India's $62B Chip Problem — The Numbers Nobody's Showing | 57 |
| The Squirrels | $4.2 Billion Left India Last Week. Just For Oil. | 49 |
| The Squirrels | 85% Import Dependency — India's Most Dangerous Number | 55 |
| Breaking Tube | ₹50,000 Crore Ka Sawaal — Modi Ka Naya Faisla | 48 |
| Breaking Tube | Pakistan Budget: 40% Defense, 8% Education | 45 |

**Rules**:
- Number goes FIRST — before any context
- Use currency symbols ($, ₹) not words ("dollars", "rupees")
- The Squirrels uses USD; Breaking Tube uses INR
- Round to memorable figures ($62B not $61.7B) unless precision IS the hook
- The number must be surprising in context — if it's expected, it's not a hook

---

#### Formula 2: THE CONTRADICTION
**Structure**: [Claim A] vs [Reality B]
**CTR range**: 7-10%

| Brand | Example | Chars |
|-------|---------|-------|
| The Squirrels | GDP Says 7% Growth. Rural India Says Otherwise. | 48 |
| The Squirrels | India's "Free" Trade Deal — What the Fine Print Actually Says | 60 |
| Breaking Tube | Sarkar Kehti Hai Sab Theek — Data Kehta Hai Kuch Aur | 53 |

**Rules**:
- Both sides must be factually accurate
- Use em dash (—) or period (.) to create the beat between claim and reality
- Never use "vs" literally — it signals debate content, not analysis
- Strongest when the contradiction is between an authority figure's claim and verifiable data

---

#### Formula 3: THE HIDDEN STORY
**Structure**: [What nobody's telling you about X] or [The real story behind X]
**CTR range**: 7-9%

| Brand | Example | Chars |
|-------|---------|-------|
| The Squirrels | What Nobody's Reporting About the India-UAE Deal | 49 |
| The Squirrels | The Real Reason India Changed Its Semiconductor Strategy | 57 |
| The Squirrels | Behind the G20 Statement — What Actually Happened | 50 |
| Breaking Tube | Is Deal Ki Asli Kahani — Jo Media Nahi Bata Rahi | 50 |

**Rules**:
- Must actually reveal something non-obvious — if the "hidden story" is the same story everyone's telling, the audience feels cheated
- "Nobody" language works for The Squirrels (analytical authority); "Media nahi bata rahi" works for Breaking Tube (accessible challenger)
- Don't overuse — if every video is "what nobody's telling you," the pattern loses power

---

#### Formula 4: THE HISTORICAL PARALLEL
**Structure**: [Current event] + [Historical comparison]
**CTR range**: 6-8%

| Brand | Example | Chars |
|-------|---------|-------|
| The Squirrels | India's Oil Crisis — Why 1991 Could Repeat in 2026 | 52 |
| The Squirrels | China Tried This in 2015. Here's What Happened Next. | 53 |
| The Squirrels | The Last Time a Country Did This, It Ended a Currency | 55 |
| Breaking Tube | 1991 Wala Crisis Phir Aa Sakta Hai? Data Dekhiye | 49 |

**Rules**:
- The historical reference must be specific (year + country/event)
- The parallel must be genuinely illuminating, not forced
- Strongest when the historical outcome was dramatic or unexpected
- This is The Squirrels' signature — use it 2-3x per month minimum

---

#### Formula 5: THE QUESTION REFRAME
**Structure**: [Question that challenges the default framing]
**CTR range**: 5-8%

| Brand | Example | Chars |
|-------|---------|-------|
| The Squirrels | Can India Afford to Stay Neutral? | 34 |
| The Squirrels | What If India's Real Problem Isn't GDP Growth? | 47 |
| Breaking Tube | Kya India Neutral Reh Sakta Hai? | 32 |

**Rules**:
- The question must reframe the story — not just ask about it
- "Can India afford to X?" is better than "Should India X?" (stakes > opinion)
- Use sparingly on YouTube — question titles underperform data titles by ~20% CTR
- More effective when paired with a data-forward thumbnail

---

#### Formula 6: THE LIST/COUNT
**Structure**: [Number] + [things/reasons/facts about X]
**CTR range**: 6-9%

| Brand | Example | Chars |
|-------|---------|-------|
| The Squirrels | 5 Numbers That Explain India's Real Economic Position | 53 |
| The Squirrels | 3 Deals That Will Reshape the Indo-Pacific by 2030 | 51 |
| Breaking Tube | Modi Ki 3 Galtiyan — Data Se Samjhiye | 39 |

**Rules**:
- Numbers 3, 5, and 7 perform best (odd numbers outperform even)
- The list must promise specific, actionable insight — not a vague tour
- "3 Reasons Why" is weaker than "3 Numbers That Prove"
- For The Squirrels, frame as data/facts; for Breaking Tube, frame as points/issues

---

#### Formula 7: THE STAKES CLAIM
**Structure**: [This event] + [will affect you/India/the world in X way]
**CTR range**: 7-10%

| Brand | Example | Chars |
|-------|---------|-------|
| The Squirrels | This Trade War Will Raise the Price of Everything You Own | 57 |
| The Squirrels | One Meeting in Geneva Will Decide India's Energy Future | 54 |
| Breaking Tube | Yeh Faisla Aapki EMI Badha Dega — Samjhiye Kaise | 50 |

**Rules**:
- The causal chain must be real and defensible
- "You" / "Aapka" personalizes the stakes — use when genuinely applicable
- Don't overstate — "will change everything" only works if it actually will
- Breaking Tube can be more direct ("aapki jeb"); The Squirrels uses systemic framing

---

#### Formula 8: THE EXPLAINER FLAG
**Structure**: [Topic] — Explained / What You Need to Know / The Full Story
**CTR range**: 5-7%

| Brand | Example | Chars |
|-------|---------|-------|
| The Squirrels | India's Semiconductor Strategy — The Full Picture | 50 |
| The Squirrels | The India-Middle East Corridor — What It Actually Means | 55 |
| Breaking Tube | New Education Policy — Puri Baat Samjhiye | 42 |

**Rules**:
- Use when the topic itself has enough search interest that the value is comprehensiveness
- Pair with a hook word: "Actually", "Full", "Real" — signals depth beyond surface coverage
- Weakest formula for CTR, but strongest for search traffic and long-tail discoverability
- Best for evergreen content that accumulates views over months

---

#### Formula 9: THE PREDICTION
**Structure**: [What's about to happen] + [and why it matters]
**CTR range**: 6-8%

| Brand | Example | Chars |
|-------|---------|-------|
| The Squirrels | What Happens When India's Oil Bill Hits $200 Billion | 53 |
| The Squirrels | The 2027 Crisis Nobody Sees Coming — Here's the Data | 54 |
| Breaking Tube | 2027 Mein Kya Hone Wala Hai — Data Dekhiye | 44 |

**Rules**:
- Predictions must be grounded in data and trend analysis — not speculation
- Frame as scenario analysis, not prophecy: "What happens if..." not "X WILL happen"
- The Squirrels does conditional predictions ("if current trends continue..."); Breaking Tube can be more direct
- Include a timeline — "by 2030" or "in the next 18 months" creates urgency

---

#### Formula 10: THE COMPARISON
**Structure**: [X] vs [Y] — [what the comparison reveals]
**CTR range**: 6-9%

| Brand | Example | Chars |
|-------|---------|-------|
| The Squirrels | India vs China: Semiconductor Race in 5 Charts | 48 |
| The Squirrels | India's Defense Budget vs Pakistan's — What the Numbers Reveal | 61 |
| Breaking Tube | India vs China — Kaun Jeet Raha Hai? Data Mein Jawab | 53 |

**Rules**:
- Country comparisons (India vs X) consistently perform well for both brands
- Use data framing ("in 5 charts", "the numbers") to signal analytical depth
- Avoid false equivalence — the comparison must be genuinely illuminating
- India vs Pakistan and India vs China are the highest-performing comparison pairs

---

#### Formula 11: THE CONTRARIAN
**Structure**: [Popular belief] is wrong — here's why / here's the data
**CTR range**: 7-10%

| Brand | Example | Chars |
|-------|---------|-------|
| The Squirrels | India's "Booming" Economy — Why the Headline Is Misleading | 58 |
| The Squirrels | Why This "Historic" Trade Deal Might Be a Mistake | 50 |
| Breaking Tube | Sab Keh Rahe Hain Sahi Hai — Data Kehta Hai Galat | 51 |

**Rules**:
- The contrarian claim must be substantiated in the video — this is not clickbait
- Use quotation marks around the word you're challenging ("Booming", "Historic") to signal skepticism
- High risk/high reward — only use when the data genuinely supports the contrarian position
- For The Squirrels: intellectual contrarianism; for Breaking Tube: populist contrarianism

---

#### Formula 12: THE TIMELINE / COUNTDOWN
**Structure**: [X days/months until Y] or [What changed between A and B]
**CTR range**: 5-7%

| Brand | Example | Chars |
|-------|---------|-------|
| The Squirrels | 90 Days Until India's Trade Policy Changes Everything | 52 |
| The Squirrels | How India's Foreign Policy Shifted in 6 Months — A Timeline | 59 |
| Breaking Tube | 90 Din Mein Sab Badal Jayega — Tayyar Ho Jao | 47 |

**Rules**:
- Time pressure creates urgency — use specific timeframes, not vague "soon"
- Timeline titles work best for explainers that track a developing story
- Countdown titles work for policy changes with known implementation dates

---

### 3. BRAND-SPECIFIC TITLE RULES

#### The Squirrels — Title DNA

**Language**: Pure English. No Hinglish. Not one Hindi word.

**Register**: Intelligent, precise, slightly provocative. Like an Economist headline crossed with a great YouTube title.

**What works**:
- Specific numbers front-loaded
- Em dashes (—) for dramatic beats
- Subtle skepticism through word choice ("What X actually means", "The numbers nobody's showing")
- Historical references that signal depth

**What to avoid**:
- ALL CAPS words (1 maximum per title, only for extreme emphasis)
- Exclamation marks (NEVER — they signal sensationalism)
- "SHOCKING", "EXPOSED", "DESTROYED" — banned vocabulary
- Emojis in titles — never
- Vague superlatives ("amazing", "incredible", "unbelievable")

**Title voice test**: Would this title look natural as a headline in The Economist or Foreign Affairs? If yes, it passes. If it looks like a Daily Mail headline, it fails.

#### Breaking Tube — Title DNA

**Language**: Hinglish — Hindi emotional framing + English data/technical terms. Code-switching is natural and intentional.

**Register**: Direct, energetic, accessible. Like a senior journalist friend breaking it down at chai.

**What works**:
- Hindi emotional hooks ("Sawaal", "Faisla", "Asar")
- English numbers and data (₹50,000 crore, not pachaas hazaar crore)
- Directness — get to the point in 5 words
- Rhetorical challenges ("Samjhiye", "Dekhiye", "Sochiye")

**What to avoid**:
- Pure English titles (alienates core Hindi-belt audience)
- Pure Hindi titles (loses the Hinglish identity that differentiates the brand)
- Overly formal Hindi (sounds like Doordarshan)
- "BREAKING" in title (that's what the channel name already signals)

**Title voice test**: Would Bhupendra say this naturally in a Hinglish conversation? If it sounds scripted or translated, rewrite it.

---

### 4. TITLE + THUMBNAIL ALIGNMENT

The title and thumbnail are ONE unit. They must tell a complementary story, not a redundant one.

**Rules**:
- Title and thumbnail should NOT say the same thing — they should each add information
- If the title has the number, the thumbnail should have the face/emotion
- If the thumbnail has the data visualization, the title should have the claim/question
- Together, they answer: "What is this video about?" AND "Why should I click?"

**Anti-pattern**: Title says "India's $62B Chip Problem" and thumbnail text says "$62B CHIPS" — redundant. Better: Title says "India's $62B Chip Problem" and thumbnail shows Bhupendra with a concerned expression + a chip/circuit board visual + "CAN INDIA CATCH UP?"

**Alignment matrix**:
| Title Has | Thumbnail Should Have |
|-----------|----------------------|
| Specific number | Face + emotion + context word |
| Question | Answer hint or tension visual |
| Contrarian claim | Data chart proving the claim |
| Time reference | Urgency visual (clock, countdown, timeline) |
| Comparison (India vs X) | Split visual — flag/map of both + key stat |

---

### 5. CHARACTER COUNT RULES

| Context | Optimal | Maximum | Notes |
|---------|---------|---------|-------|
| Mobile title display | 50-60 chars | 70 chars | Everything beyond ~60 chars is truncated on most phones |
| Desktop title display | 60-80 chars | 100 chars | Full title visible |
| YouTube Shorts | 40-50 chars | 60 chars | Even less display space |
| Search results | First 55 chars | 70 chars | Search snippet truncation |

**The golden rule**: If your title doesn't work at 50 characters, it doesn't work. Everything beyond 50 is bonus context.

---

### 6. KEYWORD INTEGRATION

Keywords matter for YouTube search discovery, but they must serve the title — never the other way around.

**Rules**:
- Primary keyword should appear naturally in the first half of the title
- Don't sacrifice a good hook to front-load a keyword
- Long-tail keywords often make better titles than head terms: "India semiconductor policy 2026" > "semiconductors"
- If the keyword doesn't fit naturally, put it in tags/description instead

**Keyword placement examples**:
- GOOD: "India's Semiconductor Strategy — The $62B Problem" (keyword "India semiconductor" appears naturally)
- BAD: "Semiconductor India Policy Analysis 2026 Explained" (keyword-stuffed, no hook)

---

### 7. A/B TESTING PROTOCOL

Generate 3 title variants per video with different risk profiles:

```json
{
  "titles": [
    {
      "text": "India's $62B Chip Problem — The Numbers Nobody's Showing",
      "formula": "data_anchor",
      "risk_level": "safe",
      "character_count": 57,
      "primary_keyword": "India chip",
      "ctr_prediction": "8-10%",
      "thumbnail_direction": "Bhupendra concerned face + semiconductor chip visual",
      "mobile_visible": "India's $62B Chip Problem — The Numb..."
    },
    {
      "text": "Why India Can't Make the One Thing It Spends $62B On",
      "formula": "hidden_story + data_anchor",
      "risk_level": "bold",
      "character_count": 52,
      "primary_keyword": "India",
      "ctr_prediction": "9-12%",
      "thumbnail_direction": "Split: India flag + circuit board + ₹ symbol draining",
      "mobile_visible": "Why India Can't Make the One Thing It..."
    },
    {
      "text": "Japan Tried This in 1986. India's Doing It in 2026.",
      "formula": "historical_parallel",
      "risk_level": "experimental",
      "character_count": 52,
      "primary_keyword": "India",
      "ctr_prediction": "6-9%",
      "thumbnail_direction": "Timeline visual: Japan 1986 → India 2026 with chip imagery",
      "mobile_visible": "Japan Tried This in 1986. India's Doi..."
    }
  ],
  "recommended": 1,
  "reasoning": "Bold variant creates strongest curiosity gap — 'what is the one thing?' Combined with data anchor ($62B) gives both specificity and mystery.",
  "testing_plan": "Publish with recommended title. If CTR < 7% after 2 hours, switch to safe variant. Log result."
}
```

**Testing cadence**:
- Monitor CTR for first 2 hours after publish
- If CTR < channel average: switch title to next variant
- If CTR > channel average + 2%: keep and log the winning formula
- Feed all results back into Learning Log for formula optimization

---

### 8. TITLE ANTI-PATTERNS

| Anti-Pattern | Example | Why It Fails | Fix |
|---|---|---|---|
| **ALL CAPS title** | "INDIA'S CHIP CRISIS IS HERE" | Screams sensationalism, alienates analytical audience | Use 1 capitalized word max for emphasis |
| **Excessive punctuation** | "India's Economy is CRASHING?!?!" | Signals tabloid energy, not analysis | Period or em dash only. Zero exclamation marks. |
| **Vague superlatives** | "The Most Important Thing Happening Right Now" | What thing? Why important? No specificity. | Name the specific thing and quantify the importance |
| **Keyword stuffing** | "India Economy GDP Growth 2026 Analysis Explained" | No hook, no human, no reason to click | Pick one keyword, build a title around it |
| **Redundant with thumbnail** | Title: "$62B" / Thumbnail text: "$62B" | Wastes one of your two hook surfaces | Title and thumbnail should complement, not repeat |
| **Buried hook** | "An Analysis of the Implications of India's New Semiconductor Policy" | Hook buried at word 8. Reader left by word 3. | "India's New Chip Policy — What $62B Buys (and Doesn't)" |
| **False promise** | "India Just DESTROYED China's Economy" | Content can't deliver on this claim. Retention drops. Trust erodes. | "India's New Trade Move — What It Means for China" |
| **No stakes** | "India-UAE Trade Agreement Update" | Why should I care? What changes? | "India-UAE Deal — Why It Changes Everything for Gulf Oil" |
| **Date in title** | "March 2026 Economy Update" | Dates signal disposability, reduce shelf life | Only use dates when the date IS the hook ("90 Days Until...") |

---

### 9. TITLE FORMULAS BY CONTENT TYPE

| Content Type | Best Formulas | Example |
|---|---|---|
| **Explainer** (10-15 min) | Data Anchor, Hidden Story, Explainer Flag | "India's $62B Chip Problem — The Full Picture" |
| **Quick Take** (5-8 min) | Stakes Claim, Contradiction, Contrarian | "This Trade War Will Raise Everything You Buy" |
| **Deep Dive** (15-25 min) | Historical Parallel, Comparison, Timeline | "India vs China: Semiconductor Race in 5 Charts" |
| **Breaking Analysis** | Stakes Claim, Hidden Story | "What the RBI Decision Actually Means for Your Money" |
| **YouTube Shorts** | Data Anchor (shortened), Stakes Claim | "India Can't Make This $62B Product" |

---

### 10. SHORTS-SPECIFIC TITLE RULES

YouTube Shorts titles have even less space and compete in a vertical feed where titles are secondary to the video itself.

- Maximum 50 characters (40 is better)
- Front-load the single most interesting word or number
- No em dashes or complex punctuation — keep it clean
- Titles should spark curiosity but the video hook does the real work
- Hashtag at end if relevant: #Shorts #India #Geopolitics

**Examples**:
- The Squirrels: "India's $38B Problem in 60 Seconds" (37 chars)
- Breaking Tube: "₹50,000 Crore Ka Sawaal" (24 chars)

---

## Learning Log

### Entry: 2026-03-11 — Deep Calibration
- Titles with specific numbers outperform vague claims by ~35% CTR
- Hinglish titles for Breaking Tube get 25% higher CTR than pure Hindi or pure English
- Front-loading the hook (first 5 words) is the single biggest CTR factor
- Data Anchor is the highest-performing formula across both brands
- Question titles underperform data titles by ~20% CTR on YouTube
- Em dash (—) as a beat separator outperforms colon (:) and pipe (|) in CTR
- Titles with "$" or "₹" symbols get 15% more impressions (YouTube indexes currency as high-interest)
- 3-word thumbnail text + 8-word title is the optimal combo (total cognitive load: ~11 words)
- Titles that match trending YouTube search terms get 40% more browse impressions in first 24 hours
- Historical parallel titles have lower initial CTR but higher long-term search traffic (evergreen value)
- NEVER exceed 100 characters — YouTube hard-truncates and the title looks broken

[NEEDS INPUT]: Actual CTR data from The Squirrels' YouTube Studio — top 10 titles by CTR, bottom 10 titles by CTR. This will identify which formulas actually perform for this specific audience, replacing the estimated benchmarks above with real numbers.
