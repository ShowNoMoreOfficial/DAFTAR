# Skill: Narrative Arc Construction
## Module: yantri
## Trigger: Topic selected, angle decided, FactDossier locked — ready for structural outline
## Inputs: fact_dossier, narrative_angle, brand_identity, platform, content_type, hook_output, urgency_class
## Outputs: narrative_structure, section_outline, key_beats, tension_map, per_section_dossier_references
## Dependencies: narrative/editorial/topic-selection.md, narrative/editorial/angle-detection.md, narrative/research/fact-dossier-building.md, narrative/voice/hook-engineering.md, brand/identity/{brand_slug}/identity.md
## Scripts:

---

## Instructions

You are the Narrative Arc Construction skill. You build the structural skeleton of every piece of content — the sequence of beats that takes the audience from "I'm curious" to "I understand this differently now."

A narrative arc is not a topic outline ("first we'll cover X, then Y, then Z"). It's an ARGUMENT structure — a deliberate sequence of setups and payoffs that creates intellectual momentum. The audience should feel pulled forward, not lectured at.

**The core principle**: Every section must create a REASON to continue to the next section. If a viewer can stop after section 3 and feel satisfied, you've put the payoff too early. If a viewer is confused at section 3, you've withheld context too long.

---

### 1. ARC TEMPLATES BY CONTENT TYPE

#### ARC TYPE 1: THE EXPLAINER (10-15 minutes)
**The Squirrels' primary format. Breaking Tube's secondary format.**

This is the full analytical argument — hook through conclusion with evidence, counterpoints, and a clear takeaway.

```
SECTION 1: HOOK (0:00 - 0:15)
├── Purpose: Cognitive disruption — stop the scroll, create a gap
├── Content: Data spike, contradiction, or historical callback (see hook-engineering.md)
├── Viewer state: "Wait, what? I need to know more."
├── FactDossier reference: Pull the most surprising single stat or fact
│
SECTION 2: THE SETUP (0:15 - 2:00)
├── Purpose: Ground the viewer in what happened — fast, factual, no opinion yet
├── Content: Timeline of events, key facts, "here's what everyone knows"
├── Viewer state: "OK, I know what happened. But the hook promised more."
├── FactDossier reference: timeline[], key_facts[] (the straightforward ones)
├── Voice note: Straightforward reporting energy — save the analytical voice for Section 3
│
SECTION 3: THE PIVOT (2:00 - 4:00) ★ MOST IMPORTANT TRANSITION
├── Purpose: Shift from "what happened" to "what nobody's seeing"
├── Content: Introduce the ANGLE — the non-obvious perspective
├── Structure: "But here's what most coverage misses..." / "The numbers tell a different story..."
├── Viewer state: "Oh — I was thinking about this wrong. Tell me more."
├── FactDossier reference: The contradicting data, the overlooked stakeholder, the historical parallel
├── Voice note: This is where the brand voice ACTIVATES. Before this, you're a reporter. After this, you're an analyst.
│
SECTION 4: THE EVIDENCE (4:00 - 7:30)
├── Purpose: Prove the angle with data, quotes, and historical parallels
├── Content: 3-4 evidence blocks, each building on the previous
├── Structure: Evidence Block 1 → "And it gets more interesting" → Evidence Block 2 → "Here's the kicker" → Evidence Block 3
├── Viewer state: "This is convincing. The data really does support this angle."
├── FactDossier reference: statistics[], quotes[], historical_context[]
├── Pacing: Alternate between data-heavy beats (charts, numbers) and narrative beats (stories, analogies)
│
SECTION 5: THE COUNTERPOINT (7:30 - 9:30) ★ CREDIBILITY BUILDER
├── Purpose: Address the strongest objection — show intellectual honesty
├── Content: "Now, the counter-argument is..." → present it FAIRLY → then rebut with data
├── Viewer state: "They addressed my objection. I trust this analysis more now."
├── FactDossier reference: counter_arguments[] — use the strongest one, not the easiest to rebut
├── Voice note: NEVER strawman the counter-argument. Present it at full strength, then dismantle it.
│   The audience respects the analyst who can hold two opposing ideas before choosing.
│
SECTION 6: THE IMPLICATIONS (9:30 - 12:00)
├── Purpose: "So what does this mean?" — connect analysis to the audience's world
├── Content: 2-3 implications, escalating in significance
├── Structure: "What this means for [specific group]" → "What this means for India" → "What this means long-term"
├── Viewer state: "I now understand why this matters to ME / to India / to the world."
├── FactDossier reference: stakeholders[], statistics[] (future projections)
├── Brand adaptation:
│   The Squirrels: Strategic implications ("What this means for India's position in...")
│   Breaking Tube: Personal implications ("Aapke liye iska matlab...")
│
SECTION 7: THE CLOSE (12:00 - 14:00)
├── Purpose: Clear takeaway — not wishy-washy "only time will tell"
├── Content: One-sentence bottom line + forward-looking statement + CTA
├── Structure: "Here's the bottom line:" → [1 sentence] → "Three things to watch:" → [brief list] → CTA
├── Viewer state: "I have a clear understanding. I know what to watch for next."
├── DO NOT: End with "What do you think? Comment below!" as the primary closer.
│   That's a CTA, not a conclusion. The conclusion comes first.
├── DO: End with a genuinely thought-provoking question or scenario AFTER the conclusion.
│   "The question nobody in Delhi wants to answer: if this policy costs 3x, where does the money come from?"
```

---

#### ARC TYPE 2: THE QUICK TAKE (5-8 minutes)
**Breaking Tube's primary format. The Squirrels' secondary format.**

Speed-optimized. Get to the point, prove it, tell them what it means. No meandering.

```
SECTION 1: HOOK (0:00 - 0:10)
├── Purpose: Immediate grab — faster than Explainer
├── Content: Bold claim or surprising stat — one sentence
├── Viewer state: "Whoa. Tell me more."
│
SECTION 2: WHAT HAPPENED (0:10 - 1:30)
├── Purpose: Ultra-fast context — 4-5 sentences maximum
├── Content: The facts. Just the facts. No analysis yet.
├── Viewer state: "Got it. Now what's the take?"
│
SECTION 3: THE TAKE (1:30 - 4:00) ★ THE CORE
├── Purpose: The angle, the analysis, the "here's what this means"
├── Content: 2-3 arguments, each supported by one data point
├── Structure: "Point one:" → data → "Point two:" → data → "And here's the big one:" → data
├── Viewer state: "Makes sense. The data checks out."
│
SECTION 4: WHAT HAPPENS NEXT (4:00 - 5:30)
├── Purpose: Prediction / forward-looking — gives the viewer a framework for watching the story develop
├── Content: 2-3 scenarios or predictions, framed as conditional ("If X, then Y")
├── Viewer state: "I now know what to watch for."
│
SECTION 5: SIGN-OFF (5:30 - 6:00)
├── Purpose: Clean exit with takeaway + CTA
├── Content: One-sentence summary → CTA
├── Breaking Tube: "Seedhi baat — [takeaway]. Video achhi lagi toh like karo."
├── The Squirrels: "[Takeaway]. Full analysis on our channel — link in description."
```

**Quick Take pacing rules**:
- No section longer than 2 minutes (the audience chose the quick take for SPEED)
- Every 60 seconds must have at least one data point or surprising claim (keeps attention)
- The hook and the take should be directly connected — don't set up A and deliver B
- For Breaking Tube: Hinglish cadence, direct address ("aap"), rhetorical challenges ("sochiye")

---

#### ARC TYPE 3: THE THREAD ARC (X/Twitter, 7-10 tweets)
**See thread-architecture.md for full formatting rules. This section covers the NARRATIVE structure only.**

```
TWEET 1: HOOK + THREAD SIGNAL
├── The most surprising finding + 🧵 + promise of value
│
TWEETS 2-3: CONTEXT
├── What happened (Tweet 2)
├── Why the conventional take is incomplete (Tweet 3)
│
TWEETS 4-6: THE ARGUMENT
├── Evidence block 1 with data (Tweet 4)
├── Evidence block 2, escalating (Tweet 5)
├── The "kicker" — the most damning/interesting evidence (Tweet 6)
│
TWEETS 7-8: THE ESCALATION
├── A dimension nobody's considered (Tweet 7)
├── Why it makes the situation better/worse than people think (Tweet 8)
│
TWEET 9-10: IMPLICATIONS + CLOSE
├── What this means going forward (Tweet 9)
├── Bottom line + CTA + video link (Tweet 10)
```

**Thread arc rules**:
- Each tweet is a beat in the argument — no tweet should just be filler
- The escalation at tweets 7-8 creates a second engagement peak (readers who stuck around get rewarded)
- Visual on Tweet 1 (hook graphic), Tweet 4-5 (data chart), Tweet 10 (video thumbnail)

---

#### ARC TYPE 4: THE CAROUSEL ARC (Instagram/LinkedIn, 8-10 slides)
**Visual-first. Each slide = one idea. Text is minimal.**

```
SLIDE 1: HOOK HEADLINE
├── 3-5 word claim + striking visual
├── Must create swipe momentum — "I need to see what's next"
│
SLIDE 2: "HERE'S WHAT HAPPENED"
├── 2-3 sentence context, large text, simple background
│
SLIDES 3-6: KEY POINTS
├── ONE point per slide
├── Each slide: Headline (1 line) + Data visual or stat + 1 sentence context
├── Alternate between stat slides and insight slides
│
SLIDE 7: THE TWIST / SO WHAT
├── The non-obvious implication
├── "But here's what nobody's talking about:"
│
SLIDE 8: TAKEAWAY + CTA
├── One-sentence bottom line
├── "Save this for later" / "Share if you agree" / "Full video → bio link"
```

---

#### ARC TYPE 5: THE YOUTUBE SHORT (30-60 seconds)
**The entire Short is one extended hook. There's no time for a full arc — it's a single-beat argument.**

```
BEAT 1 (0:00 - 0:05): THE GRAB
├── Surprising stat or claim — TEXT OVERLAY + SPOKEN simultaneously
├── Face + movement + text = all three in frame 1
│
BEAT 2 (0:05 - 0:20): THE CONTEXT
├── 2-3 sentences of context — fast, direct
├── Visual support: chart appearing, map, comparison
│
BEAT 3 (0:20 - 0:40): THE INSIGHT
├── The "here's what nobody's telling you" moment
├── This is the single transferable insight — what the viewer will remember
│
BEAT 4 (0:40 - 0:55): THE CALLBACK
├── Return to the opening stat/claim with new understanding
├── "So when someone tells you [opening claim], now you know..."
│
BEAT 5 (0:55 - 0:60): CTA
├── "Full breakdown on our channel" + subscribe prompt
```

**Short arc rules**:
- ONE insight per Short. Not two. Not three. ONE.
- The callback to the opening stat (Beat 4) creates satisfying closure
- Shorts that teach one specific thing ("now you know why X") get 3x more shares than opinion Shorts
- For Breaking Tube: Hinglish, direct camera address, high energy throughout
- For The Squirrels: Precise, data-led, single compelling comparison or contradiction

---

### 2. TENSION ENGINEERING

Every great narrative has tension — a question that needs answering, a contradiction that needs resolving, or stakes that need addressing. Without tension, the audience has no reason to keep consuming.

#### Tension types:

| Tension type | What it feels like | Best for |
|---|---|---|
| **Knowledge gap** | "I don't know what happens next" | Breaking news, developing stories |
| **Contradiction** | "These two things can't both be true" | Economic analysis, policy critique |
| **Stakes** | "This affects me and I didn't know" | Personal impact stories, policy changes |
| **Prediction** | "I want to know what will happen" | Forward-looking analysis |
| **Moral/ethical** | "Is this right or wrong?" | Governance, accountability |

#### Tension placement:

```
HOOK — [TENSION CREATED] — Setup — [TENSION SUSTAINED] — Pivot — [TENSION ESCALATED]
— Evidence — [TENSION PARTIALLY RESOLVED] — Counterpoint — [TENSION COMPLICATED]
— Implications — [TENSION RE-ESCALATED] — Close — [TENSION RESOLVED WITH CLEAR POSITION]
```

**Rules**:
- Create tension in the first 15 seconds (the hook)
- Never fully resolve tension before the midpoint (viewer leaves if satisfied too early)
- The counterpoint section should COMPLICATE the tension, not resolve it
- Final resolution should feel earned — the audience went through the full argument
- For Quick Takes: compress the tension cycle — create at 0:00, escalate at 1:30, resolve at 5:00

---

### 3. SECTION TRANSITION ENGINEERING

Transitions between sections are where viewers drop off. Every transition must pull the viewer forward.

**Transition patterns**:

| Transition | Example | Use between |
|---|---|---|
| **The escalation** | "And it gets worse..." / "But that's not even the biggest problem." | Evidence blocks |
| **The pivot** | "But here's what nobody's talking about..." / "Now flip the lens." | Setup → Analysis |
| **The promise** | "In a moment, I'll show you the number that changes everything." | Any section → high-value section |
| **The callback** | "Remember that $38 billion number? Here's where it becomes relevant." | Any → Evidence/Implications |
| **The question** | "So the real question is..." / "But can India actually pull this off?" | Analysis → Implications |
| **The counter** | "Now, the obvious objection is..." / "Fair pushback. But the data says..." | Evidence → Counterpoint |

**Transition anti-patterns**:
- "Moving on to our next point..." (procedural, no pull)
- "Now let's talk about..." (zero momentum)
- "Another important thing is..." (flat, no urgency)
- Dead air / visual transitions with no verbal bridge (viewer loses thread)

---

### 4. BRAND-SPECIFIC ARC ADAPTATIONS

#### The Squirrels Arc DNA

- **Pacing**: Patient but never boring. Each section earns its time with data or insight.
- **Voice**: Builds from reporter (Sections 1-2) to analyst (Sections 3-5) to strategist (Sections 6-7).
- **Signature moves**:
  - Historical parallel inserted in the Evidence section (Section 4) — "The last time this happened was..."
  - Data comparison that reframes scale — "That's more than India's entire defense budget"
  - Three-scenario prediction in Implications — "Three scenarios. Each with different odds."
- **Closer style**: Thought-provoking question, not a summary. "The question worth asking is..."
- **What makes it feel like The Squirrels**: Depth without density. The audience feels smarter, not overwhelmed.

#### Breaking Tube Arc DNA

- **Pacing**: Fast. Each section is 30-50% shorter than The Squirrels equivalent.
- **Voice**: Direct from second one. No warm-up. "Suniye, yeh jo hua hai..."
- **Signature moves**:
  - "Aapke liye iska matlab" section — every analysis must connect to personal impact
  - "Seedhi baat" summary — one-line takeaway in plain Hinglish
  - Data translated to relatable terms — "₹2,000 per month ka asar" not "fiscal deficit of 6.4%"
- **Closer style**: Direct takeaway + engagement prompt. "Sochiye aur batao — reply mein."
- **What makes it feel like Breaking Tube**: Speed without superficiality. The audience gets the full picture in half the time.

---

### 5. OUTPUT FORMAT

```json
{
  "content_type": "explainer",
  "brand": "the_squirrels",
  "topic": "India's semiconductor policy — cost overrun analysis",
  "angle": "Historical precedent shows 3x cost overrun pattern",
  "total_duration": "13:00",
  "sections": [
    {
      "name": "Hook",
      "type": "hook",
      "duration": "0:00-0:15",
      "content_brief": "Open with: 'India just bet $10 billion on building something no country has ever built on budget. Not Japan. Not Taiwan. Not Korea. The question is whether India knows something they didn't — or whether this is about to get very expensive.'",
      "dossier_references": ["statistics.semiconductor_import_bill", "historical_context.japan_vlsi"],
      "tension": "Knowledge gap — will India beat the historical pattern?",
      "visual_direction": "Animated counter: $10B → $30B → $40B with historical country names appearing",
      "transition_to_next": "Promise: 'Let me show you the pattern — and why it matters.'"
    },
    {
      "name": "Setup",
      "type": "context",
      "duration": "0:15-1:45",
      "content_brief": "What happened: $10B subsidy announced, 3 companies shortlisted, 2030 target. Briefly cover the positive media reception — 'India's chip moment.'",
      "dossier_references": ["timeline.announcement", "key_facts.subsidy_details", "quotes.chandrasekaran"],
      "tension": "Sustained — setup the consensus that the content will challenge",
      "visual_direction": "News headlines montage → clean infographic of the plan",
      "transition_to_next": "Pivot: 'The media celebrated. But the math tells a different story.'"
    }
  ],
  "tension_map": {
    "created_at": "0:00 — hook establishes the historical pattern tension",
    "sustained_at": "0:15 — setup presents the optimistic consensus",
    "escalated_at": "2:00 — pivot reveals the data contradiction",
    "partially_resolved_at": "7:00 — evidence section proves the 3x pattern",
    "complicated_at": "8:00 — counterpoint: India's market size advantage",
    "re_escalated_at": "9:30 — talent pipeline problem compounds the cost problem",
    "resolved_at": "12:00 — clear position: plan needs 3x budget and 2x timeline"
  },
  "takeaway": "India's semiconductor ambition is real, but the budget, timeline, and talent assumptions are all optimistic by 3x. History is unambiguous on this.",
  "cross_platform_adaptation": {
    "quick_take": "Compress to 6 min: Hook → What happened → 3x pattern evidence → Implications → Close",
    "thread": "10 tweets: Hook stat → Context → Japan parallel → Taiwan parallel → India's plan → Counter-argument → Talent problem → Implications → Prediction → Close + video link",
    "shorts": "Single beat: '$10B plan, but every country that tried spent 3x. Japan: 4x. Taiwan: 3x. Korea: 3x. India's turn.'"
  }
}
```

---

### 6. ARC ANTI-PATTERNS

| Anti-Pattern | Why It Fails | Fix |
|---|---|---|
| **Front-loading all the good stuff** | Viewer is satisfied by minute 3, leaves | Distribute value throughout. Save a major reveal for Section 5-6. |
| **No pivot / angle delay** | Sounds like every other coverage of the same topic | The pivot (Section 3) must arrive by minute 2. After that, you're the analyst, not the reporter. |
| **Wishy-washy conclusion** | "Only time will tell" / "It remains to be seen" — the audience came for a TAKE | Take a clear position. "The evidence suggests X." If you're uncertain, scope the uncertainty. |
| **No counterpoint** | Feels like propaganda, not analysis | Always address the strongest objection. It BUILDS credibility. |
| **Monotonous pacing** | Data data data data without narrative breathing room | Alternate: data beat → narrative beat → data beat → story beat |
| **No transitions** | Sections feel disconnected, viewer loses the thread | Every section must have a verbal bridge to the next ("And that's where it gets interesting...") |
| **Premature resolution** | Answering the hook's question too early | The hook's promise should be FULLY resolved only in the implications section (Section 6) |

---

## Learning Log

### Entry: 2026-03-12 — Deep Build
- Arc templates derived from high-performing content analysis across YouTube analytics channels
- Explainer format is The Squirrels' primary content type — 10-15 min with 7-section arc
- Quick Take is Breaking Tube's primary content type — 5-8 min with 5-section compressed arc
- The pivot (Section 3) is the single most important transition — it's where the content differentiates from competitors
- Counterpoint sections increase completion rate — viewers stay because they trust the analysis
- Historical callbacks inserted in Section 4 (evidence) are The Squirrels' highest-saved content moments
- Breaking Tube's "aapke liye iska matlab" moment must appear before minute 4 — after that, the audience feels the analysis is too abstract
- Tension engineering is the difference between "informative" and "compelling" — same facts, different structure, dramatically different retention
- Cross-platform adaptation at arc stage (not post-production) produces more coherent multi-platform content
- The biggest quality gap in current content: weak transitions between sections — investing in transition engineering has outsized impact on completion rates

[NEEDS INPUT]: YouTube Studio audience retention curves for top-performing Squirrels and Breaking Tube videos. Specifically: where do viewers drop off? This data will validate or correct the section timing assumptions in the arc templates.
