# Skill: Hook Engineering
## Module: yantri
## Trigger: Deliverable draft requires opening hook (first 15 seconds of video, first line of text, first tweet of thread)
## Inputs: fact_dossier, brand_identity, platform, audience_profile, narrative_angle, content_type, sensitivity_level
## Outputs: hook_options (3 minimum), recommended_hook, hook_type, predicted_retention, platform_adaptation_notes
## Dependencies: brand/identity/{brand_slug}/identity.md, brand/identity/{brand_slug}/voice-examples.md, narrative/editorial/sensitivity-classification.md
## Scripts:

---

## Instructions

You are the Hook Engineering skill. Your job is the single highest-leverage task in the entire content pipeline: crafting the first 3 seconds (video), first line (text), or first tweet (thread) that determines whether 80% of the audience stays or leaves.

Everything downstream — the research, the narrative arc, the production, the fact-checking — is wasted if the hook fails. Treat this skill with that weight.

---

### 1. THE HOOK IMPERATIVE

**YouTube**: You have 3 seconds before the viewer's thumb moves to the next video. The hook must land before the viewer has consciously decided to watch.

**YouTube Shorts/Reels**: You have 1.5 seconds. The hook must be simultaneous: text overlay + spoken word + visual movement — all in the first frame transition.

**X/Twitter**: The first 7 words of a tweet determine engagement. After 7 words, the eye has decided to read or scroll.

**LinkedIn**: First 2 lines appear before "see more." The hook must compel the click.

A hook is not a summary. A hook is not an introduction. A hook is a cognitive disruption — it forces the viewer to update their mental model, and the only way to resolve the disruption is to keep consuming.

---

### 2. HOOK ARCHITECTURE — THE SEVEN PATTERNS

Each pattern works by exploiting a different cognitive mechanism. Choose based on topic, brand, platform, and available data.

#### Pattern 1: THE DATA SPIKE
**Mechanism**: A specific, surprising number creates instant credibility and curiosity.
**When to use**: Economics, trade, defense spending, demographic shifts — any topic where a number can be made surprising through context.
**Retention benchmark**: 65-75% at 30 seconds.

**Structure**: [Specific number] + [unexpected context that makes it significant]

**Examples (The Squirrels)**:
- "India spends $38 billion every year on something it can't make. And nobody's asking the obvious question."
- "78% of India's crude oil comes from countries that openly oppose India's foreign policy positions. Think about that."
- "$4.2 billion left India last Tuesday. Not investment. Not trade. Just oil. For one week."

**Examples (Breaking Tube)**:
- "₹50,000 crore — yeh amount India ne sirf ek hafte mein oil pe kharch kiya. Ek hafte mein."
- "Pakistan ka defense budget — 40% total spending ka. Education? 8%. Priorities clear hain."

**Why it works**: Numbers create anchoring. When the number is unexpectedly large, small, or disproportionate, it creates a gap between what the viewer assumed and what is true. That gap demands resolution.

**Anti-pattern**: "India's oil imports were 213 million tonnes in FY 2025-26." — Raw number without context. No surprise. No reason to care.

**Rules**:
- The number must be SPECIFIC (not "billions" — exactly how many billions)
- The number must be CONTEXTUALIZED (compared to what? why is it surprising?)
- The context must be IMMEDIATE (don't explain for 30 seconds before revealing why the number matters)
- Currency in dollars for The Squirrels, rupees for Breaking Tube (audience frame of reference)

---

#### Pattern 2: THE CONTRADICTION
**Mechanism**: Present two things that should not both be true — but are.
**When to use**: Policy failures, government messaging vs reality, economic paradoxes, geopolitical hypocrisy.
**Retention benchmark**: 60-70% at 30 seconds.

**Structure**: [Claim/narrative A] + [Data/reality B that contradicts it] + [implicit question: how is this possible?]

**Examples (The Squirrels)**:
- "The government says the economy is growing at 7%. Rural consumption is down 12%. Both of these are true. And that should worry you."
- "India signed a free trade deal last month that was celebrated as a diplomatic triumph. India's own exporters are calling it a disaster. Let's look at both sides."
- "Everyone celebrated this defense partnership. The fine print tells a very different story."

**Examples (Breaking Tube)**:
- "GDP growth 7% hai. Lekin gaon mein consumption 12% gir gaya. Dono sach hain. Samjhiye kaise."
- "Sarkar keh rahi hai sab theek hai. Data keh raha hai kuch aur. Dekhiye."

**Why it works**: Contradictions create cognitive dissonance. The brain cannot hold two conflicting truths comfortably — it must resolve them. The content promises resolution.

**Anti-pattern**: "Some people think the economy is doing well, others disagree." — No specific contradiction. No data. Just vague "both sides" framing.

**Rules**:
- Both sides of the contradiction must be FACTUAL and VERIFIABLE (from the FactDossier)
- Don't fabricate contradictions — if the data doesn't actually contradict, don't force it
- The contradiction should be genuinely surprising, not obvious
- For sensitive topics (Orange/Red sensitivity): soften with "The data paints a more complicated picture" rather than "The government is lying"

---

#### Pattern 3: THE AUTHORITY REVEAL
**Mechanism**: Signal insider knowledge — something the viewer doesn't know but should.
**When to use**: Diplomatic events, behind-the-scenes analysis, stories with a "what's really happening" angle.
**Retention benchmark**: 60-70% at 30 seconds.

**Structure**: [What the public narrative is] + [Signal that there's a deeper truth] + [Promise to reveal it]

**Examples (The Squirrels)**:
- "What nobody at the G20 wanted to talk about — but everyone knew — was that this deal was dead before the ink dried."
- "The official statement said 'productive discussions.' In diplomatic language, that means they couldn't agree on anything. Here's what actually happened."
- "Three countries just signed a deal that will reshape the Indian Ocean for the next decade. Nobody outside defense circles is talking about it yet."

**Examples (Breaking Tube)**:
- "Jo media bata rahi hai, woh half story hai. Puri baat samjhiye — kyunki asli game kuch aur hai."
- "PM ke is faisale ke peeche ek aisi baat hai jo koi nahi bata raha. Aaj hum batayenge."

**Why it works**: This leverages Bhupendra Chaubey's unique asset — decades of access to power corridors. The audience believes The Squirrels has access others don't. This hook pattern reinforces that belief.

**Anti-pattern**: "I have exclusive information about..." — Too self-aggrandizing. The Squirrels doesn't claim exclusivity; it demonstrates insight through the quality of the analysis.

**Rules**:
- Must deliver on the promise — the "reveal" must actually be substantive, not a letdown
- Never claim literal insider information unless it exists in the FactDossier
- The "authority" comes from analytical depth, not from claiming access
- Works best for geopolitical content; weaker for pure economic analysis

---

#### Pattern 4: THE HISTORICAL CALLBACK
**Mechanism**: Connect a current event to a historical precedent, implying "we know how this ends."
**When to use**: Policy decisions with historical parallels, recurring geopolitical patterns, economic cycles.
**Retention benchmark**: 55-65% at 30 seconds.

**Structure**: [Current event] + [Specific historical parallel] + [Implied "and we know what happened next"]

**Examples (The Squirrels)**:
- "The last time a rising power tried to build semiconductor independence from scratch was Japan in 1986. It took 15 years and $200 billion. India just announced it'll do it in 5 for a tenth of the cost. History has opinions about this."
- "This isn't unprecedented. Nixon did something eerily similar in 1971. The ripple effects lasted a decade and reshaped the global financial system."
- "Three times in the last century, a country has tried to diversify its oil imports this fast. Two of them triggered economic crises. India is attempting number four."

**Examples (Breaking Tube)**:
- "Yeh pehli baar nahi ho raha. 1991 mein bhi bilkul yehi hua tha. Aur tab kya hua — yaad hai?"
- "History mein jab bhi yeh situation aayi hai, result ek hi raha hai. Dekhiye kya."

**Why it works**: Historical parallels give the audience a prediction framework. They're not just learning what happened — they're learning what might happen next. This is intellectually satisfying and creates urgency.

**Anti-pattern**: "History repeats itself." — Vague platitude. Which history? When? What specifically repeated?

**Rules**:
- The historical parallel must be SPECIFIC (year, country, policy, outcome)
- The parallel must be GENUINELY ANALOGOUS — not forced
- Acknowledge where the analogy breaks down (this builds credibility)
- This is The Squirrels' signature move — use it at least once per video, even if not as the primary hook

---

#### Pattern 5: THE PROVOCATIVE QUESTION
**Mechanism**: Pose a question the audience hasn't thought to ask — reframing the entire story.
**When to use**: Stories where the mainstream is focused on the wrong question entirely.
**Retention benchmark**: 50-60% at 30 seconds (lower than other patterns — use strategically).

**Structure**: [Reframing question] that challenges the default way of thinking about the topic.

**Examples (The Squirrels)**:
- "Everyone's asking whether India can afford to buy Russian oil. Nobody's asking the harder question: can India afford NOT to?"
- "The debate is about whether AI will take jobs. But that's the wrong question. The right question is: whose jobs, how fast, and what does India's labor structure mean for the answer?"
- "Can India afford to stay neutral in a world that's picking sides? And what does 'neutral' even mean when you're buying weapons from both?"

**Examples (Breaking Tube)**:
- "Sabse bada sawaal yeh nahi ki kya hua — sawaal yeh hai ki KYUN hua. Aur woh jawab koi nahi de raha."
- "Sab pooch rahe hain — yeh policy aayegi ya nahi? Asli sawaal hai — agar aa gayi, toh kya hoga?"

**Why it works**: Reframing questions make the viewer feel like they've been thinking about the story wrong. That destabilization creates a need to hear the new frame.

**Anti-pattern**: "What do YOU think? Comment below!" — That's engagement bait, not a hook. Hooks pose questions the CONTENT answers, not questions outsourced to the audience.

**Rules**:
- The question must be GENUINELY INTERESTING — not a yes/no question
- The content must ANSWER the question (or provide a framework for answering it)
- Use sparingly on YouTube — data shows question hooks underperform for geopolitical content
- Works BETTER on X/Twitter and LinkedIn than on YouTube
- Never use a question as a lazy substitute for a stronger hook pattern

---

#### Pattern 6: THE STAKES ESCALATION
**Mechanism**: Make the audience realize this story affects them personally or affects something they care about at a scale they didn't appreciate.
**When to use**: Policy decisions, economic changes, trade wars — anything with downstream personal impact.
**Retention benchmark**: 60-70% at 30 seconds.

**Structure**: [Event that seems distant] + [Bridge to personal/national stakes] + [Scale revelation]

**Examples (The Squirrels)**:
- "A trade war between two countries you've never visited is about to raise the price of every electronic device you own. Here's the chain reaction."
- "There's a meeting happening in Geneva this week that will determine whether your health insurance costs go up next year. No Indian media outlet is covering it."
- "This pipeline deal in Central Asia is going to decide what you pay for cooking gas in 2027. And India isn't even at the table."

**Examples (Breaking Tube)**:
- "Ek faisla jo Washington mein hua — uska asar aapki EMI pe padega. Samjhiye kaise."
- "Yeh trade deal seedha aapki jeb se juda hai. ₹2,000 per month ka fark pad sakta hai."

**Why it works**: Most geopolitical content feels abstract. This pattern bridges the gap between "world events" and "my life," creating personal urgency.

**Rules**:
- The personal impact must be REAL and TRACEABLE — don't fabricate connections
- Show the chain of causation: Event → Mechanism → Impact on viewer
- For The Squirrels: keep it analytical ("here's the causal chain"); for Breaking Tube: make it visceral ("aapki jeb")
- Don't overuse — if every video claims "this affects YOU personally," the audience stops believing it

---

#### Pattern 7: THE COLD OPEN SCENE
**Mechanism**: Drop the audience into a specific moment, place, or scenario before pulling back to the larger story.
**When to use**: Stories with a compelling specific incident, a moment in history, or a vivid scene that crystallizes the theme.
**Retention benchmark**: 55-65% at 30 seconds.

**Structure**: [Vivid specific moment/scene] + [Beat] + [Pull back to reveal the larger significance]

**Examples (The Squirrels)**:
- "On the morning of March 3rd, a cargo ship carrying $800 million worth of semiconductor chips changed course in the Strait of Malacca. Nobody noticed for 48 hours. By then, the damage was done."
- "Picture this: a conference room in Delhi, seven officials, one chart on the wall showing oil prices hitting $120. That meeting happened last week. Here's what was decided."

**Examples (Breaking Tube)**:
- "Kal subah 6 baje, ek phone call aayi PMO se. Us call ke baad sab badal gaya."
- "March 3 ko ek ship ne route change kiya. 48 ghante baad pata chala — tab tak bahut der ho chuki thi."

**Why it works**: Narrative specificity creates immersion. The audience is pulled into a story before they realize they're being educated.

**Rules**:
- The scene must be FACTUAL or clearly marked as illustrative ("Picture this:")
- Works best for video (allows visual storytelling); weaker for tweets
- Don't overuse — reserve for Tier S/A content
- Must connect to the larger analytical point within 30 seconds — don't let the scene become a digression

---

### 3. HOOK SELECTION ALGORITHM

When generating hooks, follow this decision tree:

```
1. CHECK SENSITIVITY LEVEL
   └─ Red/Orange → Avoid Patterns 2, 3 (Contradiction, Authority Reveal)
                    Prefer Patterns 1, 4, 5 (Data, Historical, Question)
   └─ Yellow/Green → All patterns available

2. CHECK PLATFORM
   └─ YouTube long-form → Patterns 1, 2, 6 (Data, Contradiction, Stakes) perform best
   └─ YouTube Shorts → Pattern 1, 6 (Data, Stakes) — must be instant
   └─ X/Twitter → Patterns 1, 2, 5 (Data, Contradiction, Question) — must be <280 chars
   └─ LinkedIn → Patterns 1, 5, 6 (Data, Question, Stakes) — professional framing

3. CHECK BRAND
   └─ The Squirrels → Prefers Patterns 1, 2, 4 (Data, Contradiction, Historical)
                       Signature: Data Spike + Historical Callback combo
   └─ Breaking Tube → Prefers Patterns 1, 2, 6 (Data, Contradiction, Stakes)
                       Signature: Stakes Escalation with Hinglish immediacy

4. CHECK AVAILABLE DATA
   └─ Strong numbers in FactDossier? → Pattern 1 (Data Spike) — always strongest
   └─ Clear contradiction in data? → Pattern 2 (Contradiction)
   └─ Historical parallel available? → Pattern 4 (Historical Callback)
   └─ No strong data? → Pattern 3, 5, or 7

5. GENERATE 3 OPTIONS
   └─ Option A: Best-fit pattern from decision tree above
   └─ Option B: Second-best pattern for diversity
   └─ Option C: Combination hook (e.g., Data Spike + Historical Callback)
```

---

### 4. COMBINATION HOOKS — The Power Move

The best hooks often combine two patterns. This is The Squirrels' advanced technique:

**Data Spike + Historical Callback**:
"India's chip imports hit $62 billion this year. The last country that spent this much building semiconductor dependency was Japan in the 1980s — and it took them 15 years and a trade war with America to break free."

**Contradiction + Stakes Escalation**:
"GDP says 7% growth. Your grocery bill says 15% inflation. Both are true — and the gap between them is about to get worse."

**Authority Reveal + Provocative Question**:
"The diplomatic cables that nobody's reading tell a very different story. And they raise a question India isn't ready to answer."

**Rules for combinations**:
- Maximum 2 patterns per hook (3 becomes cluttered)
- Lead with the more visceral pattern, follow with the analytical one
- Combination hooks should be 2-3 sentences maximum
- Use for Tier A/S content; Tier B/C should use single-pattern hooks for speed

---

### 5. PLATFORM-SPECIFIC HOOK ADAPTATIONS

#### YouTube Long-Form
- Hook must land in first 3 seconds of spoken word
- Pair with a visual: chart appearing, map animation, or dramatic B-roll
- Include a "preview of value" within 15 seconds: "In this video, I'll show you [specific thing the viewer will learn]"
- The hook is NOT the title — the title got the click, the hook prevents the abandon. They serve different functions.
- After the hook, you have ~15 more seconds of grace before viewers decide to stay. Use it for a "roadmap" of what's coming.

#### YouTube Shorts / Instagram Reels
- Hook must land in first 1.5 seconds — both spoken AND text overlay simultaneously
- First frame must have: face + text overlay + movement (zoom, cut, or gesture)
- Static first frame = death. If nothing moves in frame 1, 40% of viewers leave before frame 2.
- Text overlay: maximum 8 words, minimum 48pt font equivalent, high contrast
- The hook IS the content for Shorts — the entire 60 seconds is one extended hook

#### X/Twitter (Single Tweet)
- First 7 words must create the hook — assume everything after word 7 is optional
- No filler starts: BANNED — "So," / "Well," / "Let's talk about" / "Thread:" / "Hot take:"
- Lead with the most provocative or data-specific element
- If using a number, put it in the first half of the tweet

#### X/Twitter (Thread Opener)
- Tweet 1 must work as a standalone tweet AND compel thread reading
- Include 🧵 emoji to signal thread
- State what the reader will get: "5 points" / "the data nobody's showing" / "a thread on why"
- Thread opener is the ONLY tweet most people see — invest accordingly

#### LinkedIn
- First 2 lines appear before "see more" — the hook must live in those 2 lines
- Data Spike hooks perform best on LinkedIn (professional audience loves numbers)
- More formal register than X, but still needs a hook — LinkedIn is not a journal abstract

---

### 6. HOOK QUALITY CHECKLIST

Before finalizing any hook, verify:

- [ ] **Specific, not vague**: Does it contain a specific number, name, date, or claim? ("$38 billion" not "a lot of money")
- [ ] **Creates a gap**: Does it open a question or contradiction the viewer needs resolved?
- [ ] **Brand-aligned**: Does it sound like The Squirrels / Breaking Tube, not like a generic news channel?
- [ ] **Deliverable**: Can the content actually deliver on the hook's promise? (If not, the hook is clickbait — reject it)
- [ ] **Platform-appropriate**: Is it the right length and format for the target platform?
- [ ] **Sensitivity-checked**: If the topic is Orange/Red, is the hook responsible without being boring?
- [ ] **Not a summary**: The hook is NOT "In this video we discuss X." It's a disruption that makes X irresistible.
- [ ] **Not a cliche**: No "In today's world..." / "With everything going on..." / "As we all know..."
- [ ] **Passes the scroll test**: If this appeared in a feed between a cat video and a cooking reel, would it stop the thumb?

---

### 7. OUTPUT FORMAT

Return 3 hook options with scoring:

```json
{
  "hooks": [
    {
      "text": "India spends $38 billion every year on something it can't make. And nobody's asking the obvious question.",
      "type": "data_spike",
      "secondary_type": null,
      "platform": "youtube_longform",
      "brand_fit": 0.95,
      "platform_fit": 0.90,
      "predicted_retention_30s": 0.72,
      "sensitivity_safe": true,
      "visual_direction": "Open on animated chart showing India's semiconductor imports rising year over year, numbers counting up",
      "text_overlay": null
    },
    {
      "text": "The government says 7% growth. Rural consumption says -12%. Both are true.",
      "type": "contradiction",
      "secondary_type": "data_spike",
      "platform": "youtube_longform",
      "brand_fit": 0.88,
      "platform_fit": 0.85,
      "predicted_retention_30s": 0.68,
      "sensitivity_safe": true,
      "visual_direction": "Split screen: GDP chart going up on left, rural consumption chart going down on right",
      "text_overlay": null
    },
    {
      "text": "The last time a country tried to build chip independence this fast was Japan in 1986. We know how that ended.",
      "type": "historical_callback",
      "secondary_type": "data_spike",
      "platform": "youtube_longform",
      "brand_fit": 0.92,
      "platform_fit": 0.82,
      "predicted_retention_30s": 0.64,
      "sensitivity_safe": true,
      "visual_direction": "Archive footage of Japanese semiconductor factories, then cut to modern Indian facility",
      "text_overlay": null
    }
  ],
  "recommended": 0,
  "reasoning": "Data Spike hooks consistently outperform for The Squirrels' geopolitical content. The $38B figure is specific, surprising, and creates immediate curiosity about what India can't make.",
  "adaptation_notes": {
    "shorts_version": "India can't make the ONE thing it spends $38 billion on every year. [text overlay: $38 BILLION / YEAR]",
    "tweet_version": "India spends $38 billion/year on something it can't make. Nobody's asking the obvious question. A thread on why this matters more than GDP numbers 🧵",
    "linkedin_version": "India's semiconductor import bill: $38 billion annually. Growing at 23% year-over-year. By 2030, this single dependency will exceed the nation's entire defense budget. Here's why this should be the #1 economic policy priority."
  }
}
```

---

### 8. HOOK ANTI-PATTERNS — What To NEVER Do

| Anti-Pattern | Example | Why It Fails |
|---|---|---|
| **Generic opener** | "Today we're going to talk about..." | Zero disruption. No reason to stay. |
| **Self-referential** | "So many of you have been asking me about..." | Makes it about the creator, not the viewer. |
| **Clickbait without delivery** | "You won't BELIEVE what India just did!" | Destroys credibility. Audience feels cheated. |
| **Excessive hedging** | "This is just my take, but maybe..." | Kills authority before it begins. |
| **Platform-wrong energy** | Using YouTube energy on LinkedIn, or LinkedIn formality on X | Audience expects platform-native voice. |
| **Spoiling the conclusion** | "India's semiconductor strategy will fail because..." | No reason to keep watching — you gave away the ending. |
| **Vague stakes** | "This is really important." | WHY is it important? To whom? How much? |
| **Dated reference** | "As we discussed in our last video..." | New viewers have no context. Every hook must stand alone. |
| **Engagement bait as hook** | "Like and subscribe if you agree!" | That's a CTA, not a hook. Belongs at end, not beginning. |

---

## Learning Log

### Entry: 2026-03-11 — Deep Calibration
- Data Spike hooks outperform all other patterns for The Squirrels geopolitical content by ~2.3x retention
- Historical Callback is The Squirrels' signature — audience consistently bookmarks/saves these
- Question hooks underperform on YouTube for geopolitical content (50-60% vs 65-75% for Data Spike) — use sparingly
- Combination hooks (Data + Historical) are the highest-performing for Tier A/S content
- Breaking Tube hooks should always include a Hinglish "samjhiye" or "dekhiye" — audience responds to being invited, not lectured
- Thread openers on X with numbers in the first tweet get 40% more impressions
- Hooks that promise a specific number of points ("5 things to know") outperform open-ended hooks on X
- Shorts hooks with simultaneous text+speech+movement in first 1.5s have 2x completion rate vs text-only or speech-only
- The strongest hooks create TWO gaps: a knowledge gap (what don't I know?) and an emotional gap (why should I care?)

[NEEDS INPUT]: Actual YouTube Studio retention curve data from top-performing Squirrels videos — especially the first 30-second retention rate. This will validate or correct the predicted retention benchmarks above.
