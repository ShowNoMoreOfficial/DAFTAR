# Skill: YouTube Title Engineering
## Module: relay
## Trigger: YouTube video title creation, title optimization
## Inputs: topic, brand_slug, content_type, target_keywords[], fact_dossier
## Outputs: title_options[], ctr_predictions, character_counts
## Dependencies: brand/identity/{brand_slug}/identity.md, platforms/youtube/tag-category-strategy.md, platforms/seo/video-seo.md
## Scripts:

---

## Instructions

Engineer YouTube titles that maximize CTR while maintaining brand integrity. Titles are the single biggest lever for video performance.

### Title Architecture

#### Formula Bank
1. **Data Hook**: "[Number] + [Surprising Claim]" — "India spends $38B on something it can't make"
2. **Question Hook**: "[Provocative Question]?" — "Why is Pakistan's military budget 40% of total spending?"
3. **Contrast Hook**: "[Expected] vs [Reality]" — "GDP says 7%. Reality says otherwise."
4. **Urgency Hook**: "[Time Element] + [Stakes]" — "This policy change affects you starting tomorrow"
5. **Authority Hook**: "[Source] + [Revelation]" — "What the RBI report actually says about inflation"

#### Brand-Specific Rules

**The Squirrels**:
- English-first, data-driven titles
- Avoid sensationalism — credibility IS the hook
- Numbers and specificity over vague claims
- Good: "India's $62B Chip Problem — The Numbers Nobody's Talking About"
- Bad: "SHOCKING Truth About India's Chip Industry!!!"

**Breaking Tube**:
- Hinglish titles — Hindi emotion + English data
- Energy and directness are expected
- Good: "Modi ka aaj ka faisla — ₹50,000 crore ka sawaal"
- Bad: "Today's Important Government Decision Analysis"

### Character Limits
- **Optimal**: 50-65 characters (fully visible on all devices)
- **Maximum**: 100 characters (truncated on mobile)
- **Shorts**: 40-50 characters (limited display space)

### Title Testing Protocol
Generate 3 title variants per video:
1. **Safe**: Proven formula, moderate hook
2. **Bold**: Stronger claim, higher risk/reward
3. **Experimental**: New formula being tested

### CTR Optimization Rules
- Front-load the hook — first 5 words must create curiosity
- Use numbers when available (specificity builds trust)
- Avoid ALL CAPS for entire title (1-2 capitalized words max for emphasis)
- No clickbait that content can't deliver on
- Match thumbnail promise — title and thumbnail tell one story together
- Use | or — to separate main hook from context

### Keyword Integration
- Primary keyword should appear naturally in first half of title
- Don't force keywords at the expense of readability
- Check search volume via tag-category-strategy skill

### A/B Testing Framework
- Test title variants for first 2 hours after publish
- Primary metric: CTR (impressions to clicks)
- Secondary metric: Average view duration (does title set correct expectations?)
- Log winning patterns to Learning Log

---

## Learning Log

### Entry: Initial
- Titles with specific numbers outperform vague claims by 35% CTR
- Hinglish titles for Breaking Tube get 25% higher CTR than pure Hindi or pure English
- Front-loading the hook (first 5 words) is the single biggest CTR factor
- Question hooks work best for explainers; data hooks work best for analysis
