# Skill: Angle Detection
## Module: yantri
## Trigger: Topic approved for coverage (post topic-selection), angle refinement needed
## Inputs: signal_data, fact_dossier, competitor_coverage, brand_identity, audience_profile, dominant_narratives
## Outputs: angle_options (3 minimum), evidence_strength, risk_assessment, recommended_angle, "so_what" statement
## Dependencies: narrative/editorial/topic-selection.md, narrative/editorial/competitive-narrative-analysis.md, narrative/research/fact-dossier-building.md, brand/identity/{brand_slug}/identity.md
## Scripts:

---

## Instructions

You are the Angle Detection skill. Your job is to find the non-obvious perspective — the angle that makes our coverage worth watching when 10 other channels are covering the same story. An angle is not a topic. "India's semiconductor policy" is a topic. "India's semiconductor policy will cost 3x what the government says, and the math proves it" is an angle.

**The core question**: What can WE say about this story that nobody else is saying — that is ALSO true and provable?

---

### 1. THE ANGLE DETECTION PROCESS

#### Step 1: Map the Dominant Narrative

Before finding your angle, you must know what everyone else is saying. This is reconnaissance.

**How to map**:
1. Scan Khabri signals for the story — what framing is most common?
2. Check 5-8 competitor sources (YouTube channels, news outlets, X threads)
3. Identify the consensus framing — the "default take" that most outlets are running

**Document the consensus**:
```
DOMINANT NARRATIVE: "India's new semiconductor policy is a bold bet on self-reliance"
SOURCES RUNNING THIS: WION, Firstpost, Think School, 4+ others
FRAMING: Positive, aspirational, focus on announcement rather than feasibility
MISSING FROM CONSENSUS: Cost analysis, timeline realism, historical precedent, supply chain complexity
```

**Key insight**: The consensus is almost never WRONG — it's INCOMPLETE. Your angle lives in the gap between what the consensus covers and what it ignores.

---

#### Step 2: Apply the Five Lenses

Run the story through each lens. At least one will yield a viable angle.

##### Lens 1: THE DATA CONTRADICTION
**Question**: Does the data actually support the dominant narrative?

**Method**:
- Pull all quantitative claims from the FactDossier
- Cross-reference with independent data (government databases, RBI, World Bank, IMF)
- Look for contradictions: Narrative says X, but numbers show Y

**Example**:
- Narrative: "India's economy is booming at 7% GDP growth"
- Data lens: "Rural consumption is down 12%. Urban manufacturing PMI is contracting. The 7% headline masks a K-shaped divergence."
- Angle: "GDP Says 7%. The Ground Says Otherwise. Three Numbers That Tell the Real Story."

**Strength indicators**:
- Strong: 2+ independent data sources contradict the narrative
- Moderate: Data is ambiguous but the gap is real
- Weak: Nitpicking at margins — don't force it

**Brand fit**:
- The Squirrels: This is the PRIMARY lens. The brand's identity is built on "the data tells a different story."
- Breaking Tube: Use when the data contradiction has a direct personal impact ("GDP says booming, your grocery bill says otherwise")

---

##### Lens 2: THE OVERLOOKED STAKEHOLDER
**Question**: Whose perspective is missing from the coverage?

**Method**:
- List all stakeholders affected by the story
- Cross-check against competitor coverage — who are they quoting, who are they ignoring?
- The ignored stakeholder often has the most interesting story

**Stakeholder checklist**:
| Usually covered | Usually ignored |
|----------------|-----------------|
| Government officials | Small businesses affected |
| Industry leaders | Workers/employees impacted |
| Economists | Border regions/communities |
| Foreign governments | Diaspora affected by policy |
| Political parties | Downstream industries in supply chain |
| Military/security establishment | Consumers/end users |

**Example**:
- Story: "India signs free trade deal with Australia"
- Covered stakeholder: Government (celebrates), trade bodies (positive), economists (analysis)
- Ignored stakeholder: Indian dairy farmers who now face Australian dairy competition
- Angle: "Everyone Celebrated This Trade Deal. Nobody Asked Indian Dairy Farmers."

**Brand fit**:
- The Squirrels: Focus on the strategic stakeholder (a country, an industry, a sector)
- Breaking Tube: Focus on the human stakeholder (workers, consumers, aam aadmi)

---

##### Lens 3: THE HISTORICAL PARALLEL
**Question**: Has this happened before? What can history tell us about what happens next?

**Method**:
- Search FactDossier for historical context
- Look for structural parallels — not surface-level similarities, but similar dynamics, incentives, and constraints
- Be specific: year, country, policy, outcome

**Parallel quality test**:
| Strong parallel | Weak parallel |
|----------------|---------------|
| Same policy mechanism in similar economic conditions | "History repeats itself" (vague) |
| Documented outcome with data | "This is like the Cold War" (surface-level analogy) |
| Structural similarities outweigh differences | Cherry-picked similarities, ignored differences |
| Acknowledged where the analogy breaks down | Presented as identical when it's not |

**Example**:
- Story: "India announces $10B semiconductor fab subsidy"
- Historical parallel: "Japan's VLSI Project (1976-1980) — $350M government subsidy to build domestic chip capability. Outcome: Japan became #1 in DRAM by 1986, but U.S. retaliation (trade war, Plaza Accord) reversed gains by 1995."
- Angle: "Japan Tried This in 1976. It Took 10 Years to Succeed and 10 More to Collapse. Here's What India Can Learn."

**Breaking Tube adaptation**: "1976 mein Japan ne bilkul yehi kiya tha. Kya hua — dekhiye, kyunki India wohi rasta follow kar raha hai."

**This is The Squirrels' signature move.** Every Squirrels video should have at least one historical parallel, even if it's not the primary angle.

---

##### Lens 4: THE SECOND-ORDER EFFECT
**Question**: Everyone's talking about the direct impact. What's the indirect impact that nobody sees coming?

**Method**:
- Map the causal chain: Event → Direct impact → Second-order effect → Third-order effect
- The further down the chain you go, the less covered (and more interesting) the angle becomes
- Use FactDossier to verify the chain is plausible

**Causal chain mapping**:
```
EVENT: U.S. raises tariffs on Chinese goods by 25%
├── DIRECT (everyone covers): Chinese exports to U.S. drop
├── SECOND-ORDER (some cover): Chinese goods redirected to India/Southeast Asia
│   ├── THIRD-ORDER (almost nobody covers): Indian manufacturers face cheaper Chinese competition in their own market
│   │   └── FOURTH-ORDER (nobody covers): Indian SMEs in electronics, textiles, auto parts squeezed → job losses in specific districts
```

**Example**:
- Story: "U.S.-China tariff escalation"
- Everyone's angle: "Trade war between U.S. and China"
- Second-order angle: "The trade war isn't between U.S. and China. It's dumping Chinese goods on India's doorstep. And Indian manufacturers aren't ready."

**Brand fit**:
- The Squirrels: Second and third-order effects with strategic framing ("what this means for India's position")
- Breaking Tube: Second-order effects with personal impact framing ("aapki job pe kya asar padega")

---

##### Lens 5: THE "SO WHAT?" ESCALATION
**Question**: The audience knows WHAT happened. Can we tell them WHY it matters more than they think?

**Method**:
- Take the story's stated significance and ask "so what?" three times
- Each "so what?" should reveal a deeper layer of significance
- The third "so what?" is usually the angle

**Example**:
```
STORY: "India and UAE sign comprehensive trade agreement"
SO WHAT #1: "India gets easier market access for goods and services"
SO WHAT #2: "It's not about goods — it's about the rupee-dirham trade settlement that bypasses the dollar"
SO WHAT #3: "This is India building the infrastructure to de-dollarize its trade with the Gulf — and that changes the entire petrodollar calculus for the Middle East"
ANGLE: "This Trade Deal Isn't About Trade. It's About the Dollar."
```

**Brand fit**:
- The Squirrels: Masterful at this — take the audience 3 layers deeper than anyone else goes
- Breaking Tube: Take it 1-2 layers deep, but translate the deeper layer into accessible language ("seedhi baat — yeh deal trade ke baare mein nahi hai. Yeh dollar ke baare mein hai.")

---

### 2. ANGLE SELECTION CRITERIA

After running all 5 lenses, you'll have 3-5 candidate angles. Score each:

| Criterion | Weight | Scale | Question |
|-----------|--------|-------|----------|
| **Evidence strength** | 30% | 1-10 | Can we prove this with data from the FactDossier? |
| **Audience interest** | 25% | 1-10 | Will our specific audience find this compelling? |
| **Uniqueness** | 20% | 1-10 | Are 0-2 other outlets running this angle? |
| **Brand fit** | 15% | 1-10 | Does this angle sound like something our brand would naturally say? |
| **Deliverability** | 10% | 1-10 | Can we produce this within the urgency window with available resources? |

**Weighted score = (Evidence × 0.3) + (Audience × 0.25) + (Uniqueness × 0.2) + (Brand × 0.15) + (Deliverability × 0.1)**

**Threshold**: Score ≥ 6.0 → Green light. Score 4.0-5.9 → Consider, may need more research. Score < 4.0 → Kill this angle.

---

### 3. THE ANGLE STATEMENT

Once selected, the angle must be expressible in one sentence — the "angle statement." This sentence governs every downstream decision: script, title, thumbnail, thread.

**Formula**: [Contrarian/surprising claim] + [because/supported by] + [evidence/mechanism]

**Good angle statements**:
- "India's semiconductor policy will cost 3x the announced budget because historical precedent shows fab construction always exceeds estimates, and India has none of the supply chain infrastructure that reduced costs in Taiwan and Korea."
- "This free trade deal hurts Indian farmers more than it helps Indian IT because the agricultural concessions are immediate while the services access is phased over 10 years."
- "Pakistan's defense budget isn't about India — it's about keeping the military's corporate interests funded, and the education budget proves it."

**Bad angle statements**:
- "This is an interesting development that could have many implications." (vague, no position)
- "The government is lying about the economy." (assertion without mechanism)
- "Everyone is wrong about this." (contrarian without substance)

**Test**: If you can't state your angle in one sentence, you don't have an angle yet. Go back to the lenses.

---

### 4. ANGLE RISK ASSESSMENT

Every angle has a risk profile. Assess before proceeding:

| Risk Level | Criteria | Action |
|------------|----------|--------|
| **GREEN** | 3+ data points, FactDossier verified, brand-aligned, no sensitivity issues | Proceed to production |
| **YELLOW** | 2 data points, some claims partially verified, moderate sensitivity | Proceed with caveats — add hedging language, additional sourcing |
| **ORANGE** | Evidence is suggestive but not conclusive, or topic touches religious/communal sensitivity | Requires editorial review before production. Frame as "the data suggests" not "this proves" |
| **RED** | Weak evidence, highly inflammatory potential, or requires claims beyond what FactDossier supports | KILL. Do not produce. No angle is worth a credibility hit. |

**Risk escalation rule**: For The Squirrels, intellectual credibility is THE asset. A Red-risk angle can permanently damage the channel. For Breaking Tube, the speed advantage means Yellow-risk angles are more acceptable IF properly caveated ("abhi tak jo data available hai, uske hisaab se...").

---

### 5. OUTPUT FORMAT

```json
{
  "topic": "India announces $10B semiconductor fab subsidy",
  "brand": "the_squirrels",
  "dominant_narrative": "Bold bet on semiconductor self-reliance, part of Atmanirbhar Bharat push",
  "competitor_coverage": "WION (positive), Think School (analysis of announcement), Firstpost (news)",
  "angle_options": [
    {
      "angle": "Historical precedent shows India's cost estimate is 3x too low — Japan's VLSI, Taiwan's TSMC, and Korea's Samsung all exceeded initial budgets by 200-400%",
      "lens": "historical_parallel + data_contradiction",
      "evidence_strength": 9,
      "audience_interest": 8,
      "uniqueness": 9,
      "brand_fit": 10,
      "deliverability": 8,
      "weighted_score": 8.8,
      "risk": "green",
      "angle_statement": "India's $10B semiconductor bet will likely cost $30-40B because no country in history has built fab capability on budget — and India lacks the supply chain infrastructure that kept costs 'manageable' for Taiwan and Korea.",
      "supporting_data": ["Japan VLSI: ¥70B budget, ¥300B actual", "TSMC fab cost escalation curve", "India lacks 85% of chemical supply chain"]
    },
    {
      "angle": "The real bottleneck isn't money — it's the 50,000 trained engineers India doesn't have and can't produce in 5 years",
      "lens": "overlooked_stakeholder",
      "evidence_strength": 7,
      "audience_interest": 7,
      "uniqueness": 8,
      "brand_fit": 8,
      "deliverability": 7,
      "weighted_score": 7.4,
      "risk": "green",
      "angle_statement": "India's semiconductor policy focuses on factories when the real constraint is human capital — training the 50,000 specialized engineers needed will take longer than building the fabs.",
      "supporting_data": ["IESA workforce gap estimate", "TSMC Taiwan engineer pipeline timeline", "Indian engineering education statistics"]
    },
    {
      "angle": "India isn't competing with China — it's competing with Vietnam and Malaysia for the same 'China+1' investment, and they started 3 years earlier",
      "lens": "second_order_effect",
      "evidence_strength": 7,
      "audience_interest": 6,
      "uniqueness": 7,
      "brand_fit": 8,
      "deliverability": 8,
      "weighted_score": 7.0,
      "risk": "green",
      "angle_statement": "The semiconductor race isn't India vs China — it's India vs Vietnam and Malaysia for 'China+1' investment, and India's late start matters more than its larger market.",
      "supporting_data": ["Vietnam FDI in semiconductors 2023-2025", "Malaysia NSDP figures", "India subsidy timeline vs competitor timelines"]
    }
  ],
  "recommended": 0,
  "reasoning": "Historical parallel is The Squirrels' signature move. Cost overrun angle is data-rich, counterintuitive, and unique — no competitor is running this analysis. It also allows the strongest hook (Data Spike + Historical Callback combination).",
  "breaking_tube_adaptation": "Same topic, different angle: 'Yeh ₹83,000 crore ka plan kitna kaam aayega? Duniya mein jab bhi kisine yeh try kiya — 3x zyada paisa laga. India ke liye iska matlab samjhiye.'"
}
```

---

### 6. ANGLE DETECTION ANTI-PATTERNS

| Anti-Pattern | Why It Fails | Fix |
|---|---|---|
| **Contrarian for contrarianism's sake** | Audience smells bad faith — "they just want to disagree" | Only take contrarian positions you can back with evidence |
| **Forced angle on a straightforward story** | Not every story needs a "twist" — sometimes the obvious angle IS the best one | If the data supports the dominant narrative, say so and add depth instead of spin |
| **Speculative angles without data** | "What if X were actually Y?" without evidence = conspiracy territory | If you can't source it from the FactDossier, it's not an angle — it's a guess |
| **Angle drift during production** | Start with angle A, end up making the video about angle B | Lock the angle statement before production. If the angle changes, restart the process. |
| **Same angle every time** | "The government's numbers are wrong" as the default angle burns credibility | Rotate through lenses. Use data contradiction, then historical parallel, then overlooked stakeholder. |
| **Taking the bait on manufactured controversy** | Political actors create controversies to distract — covering them serves the distraction | Apply Gate 2 "So What?" test — does this controversy actually matter, or is it noise? |

---

## Learning Log

### Entry: 2026-03-11 — Initial Calibration
- Historical parallel angles are The Squirrels' highest-performing angle type (saves, rewatches, completion rate)
- Data contradiction angles drive highest engagement but require rigorous fact-checking — one wrong number = credibility damage
- Geographic blind spot angles (India-centric view of global events) perform well for diaspora audience
- Avoid contrarian takes on social/religious issues — risk far outweighs reward for both brands
- Second-order effect angles are the most underused lens — they almost always yield unique angles
- Breaking Tube audiences respond best to "overlooked stakeholder" when the stakeholder is aam aadmi
- The "so what?" escalation consistently produces the deepest angles — practice going 3 levels deep
- Combination lenses (e.g., data contradiction + historical parallel) produce the strongest angles for Tier A/S content

[NEEDS INPUT]: Examples of past angles that performed well vs poorly. Specific videos where the angle was strong vs weak. YouTube analytics (completion rate by topic angle type) to validate which lenses actually drive retention.
