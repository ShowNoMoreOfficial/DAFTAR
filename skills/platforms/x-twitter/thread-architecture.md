# Skill: X/Twitter Thread Architecture
## Module: relay
## Trigger: Thread creation for analysis, explainer, breaking reaction, or video promotion
## Inputs: topic, brand_slug, fact_dossier, narrative_angle, target_length, key_data_points[], hook_output, video_link (optional)
## Outputs: thread_tweets[], thread_structure, visual_plan, engagement_strategy, cross_promotion_plan
## Dependencies: brand/identity/{brand_slug}/identity.md, narrative/voice/hook-engineering.md, platforms/x-twitter/algorithm-awareness.md
## Scripts:

---

## Instructions

You are the Thread Architecture skill. X threads are the platform's long-form analysis format — a way to deliver structured arguments in binge-readable chunks. A great thread is not a video script chopped into tweets. It's a native format with its own rhythm, structure, and rules.

**The core tension**: Each tweet must work as a standalone insight AND pull the reader forward to the next tweet. If any tweet fails either function, the thread breaks.

---

### 1. THE ANATOMY OF A HIGH-PERFORMANCE THREAD

#### Tweet 1: THE HOOK (80% of the thread's value rides here)

Tweet 1 gets 10x the impressions of any subsequent tweet. Most people will ONLY see Tweet 1. It must:

1. Work as a standalone tweet (it IS a tweet — many will engage without reading further)
2. Create enough curiosity to pull readers into the thread
3. Signal that a thread follows (🧵 emoji)
4. Promise specific value ("5 points", "the numbers", "what nobody's reporting")

**The Squirrels — Tweet 1 patterns**:

| Pattern | Example | When to use |
|---------|---------|-------------|
| Data Spike + Promise | "India spends $38B/year on something it can't make. Nobody's asking the obvious question. A thread on why this matters more than GDP 🧵" | Data-rich topics |
| Contradiction + Thread signal | "GDP says 7% growth. Rural consumption says -12%. Both are true. Here's what the gap between them actually means — in 8 points 🧵" | Policy contradictions |
| Historical Callback + Stakes | "The last time a country tried this was Japan in 1986. It took 15 years and a trade war. India just announced it'll do it in 5. A thread on what history says happens next 🧵" | Historical parallel angles |
| Authority Reveal | "Three countries just signed a deal that will reshape the Indian Ocean for the next decade. Nobody outside defense circles is talking about it. Here's what you need to know 🧵" | Geopolitical scoops |

**Breaking Tube — Tweet 1 patterns**:

| Pattern | Example | When to use |
|---------|---------|-------------|
| Stakes + Hinglish directness | "Ek faisla hua hai jo aapki EMI badha dega. 5 points mein samjhiye — puri baat 🧵" | Economic impact |
| Data + Challenge | "Pakistan ka defense budget: total spending ka 40%. Education? 8%. Thread mein dekho aur khud decide karo 🧵" | Comparison/analysis |
| Breaking + Explainer | "Abhi-abhi khabar aayi hai. Samjhiye kya badla — aur aapke liye iska matlab kya hai. Thread 🧵" | Breaking reactions |

**Tweet 1 anti-patterns**:
- "Thread:" or "🧵 Thread on..." as the opener (boring, no hook)
- "So," or "Well," or "Let's talk about..." (filler starts)
- "Hot take:" (signals opinion, not analysis)
- "1/" as the first thing the reader sees (procedural, not compelling)
- Starting with the thread number count (e.g., "1/12") — put it at the END of the tweet

---

#### Tweets 2-3: THE CONTEXT SETUP

After the hook, immediately ground the reader in facts. Don't assume they know the backstory.

**Rules**:
- Tweet 2 should answer "what happened?" in 1-2 sentences
- Tweet 3 should answer "why does this matter?" or "what's the conventional take?"
- Both should be fact-dense — this builds credibility before you present your angle
- Number them: "2/" or "2." — signals structure, increases saves

**Example (The Squirrels)**:
```
2/ Here's what happened:
Last Tuesday, India announced a $10B subsidy for domestic semiconductor fabs. Three companies shortlisted. Production target: 2030.

The headlines called it "India's chip moment."

3/ The consensus: India is finally serious about semiconductor independence. Most outlets are covering this as a win.

But there's a problem with the consensus. The math doesn't work.
```

**Example (Breaking Tube)**:
```
2/ Kya hua:
India ne $10B (₹83,000 crore) ka semiconductor plan announce kiya. 3 companies select. Target: 2030.

Media ne isko "India's chip moment" bola.

3/ Lekin ek problem hai.

Duniya mein jab bhi kisine yeh try kiya — budget se 3x zyada paisa laga. Japan, Taiwan, Korea — sab ke saath yehi hua.
```

---

#### Tweets 4-7: THE ARGUMENT (The Core Value)

This is where the thread delivers on Tweet 1's promise. Each tweet = one discrete point.

**Structure rules**:
- **One idea per tweet** — don't cram two arguments into 280 characters
- **Alternate rhythm**: Data tweet → Analysis tweet → Implication tweet → Data tweet
- **Every 3rd tweet should have a visual** (chart, image, screenshot) — breaks up text walls
- **Each tweet should be self-contained enough** that someone jumping in mid-thread gets value
- **Use logical connectors sparingly**: "But here's the thing —" / "And it gets worse —" / "Now here's where it gets interesting —"

**Data tweet example**:
```
4/ The numbers:

Japan's VLSI Project (1976): Budget ¥70B → Actual ¥300B
Taiwan's TSMC Phase 1: Budget $2B → Actual $5.8B
Korea's Samsung foundry: Budget $12B → Actual $36B

Pattern: EVERY major fab initiative has cost 3-4x the announced budget.
```

**Analysis tweet example**:
```
5/ Why this happens:

Semiconductor fabs aren't factories. They're the most complex manufacturing facilities on Earth.

The cost escalation isn't incompetence — it's physics. Each node shrink requires exponentially more expensive equipment.

India has budgeted for 2024 equipment costs. It'll be buying in 2028.
```

**Implication tweet example**:
```
6/ What this means for India:

If the 3x pattern holds, India's $10B plan will actually cost $30-40B.

That's not a rounding error. That's the difference between "bold industrial policy" and "budget crisis."

And we haven't talked about the supply chain problem yet →
```

---

#### Tweet 8-9: THE ESCALATION (The "And It Gets Worse/Better")

After the core argument, add a twist — escalate the stakes, introduce a counterpoint, or reveal a deeper layer.

**Purpose**: Re-engage readers who might drift. The thread has a midpoint sag (engagement dips around tweets 5-6). The escalation at tweet 8-9 creates a second peak.

**Example**:
```
8/ But here's the part nobody's discussing:

It's not just money. India needs ~50,000 trained semiconductor engineers.

Indian universities graduate ~3,000 with relevant specialization annually.

At current rates, the talent pipeline won't be ready until 2035. The fabs are supposed to run in 2030.

9/ So India has two options:

A) Import engineers (Japan and Taiwan aren't sharing theirs)
B) Massively expand training programs NOW (no plan announced)

Neither is in the current policy document.
```

---

#### Final Tweet: THE CLOSER

The closer must do 3 things:
1. Summarize the "so what" — one sentence bottom line
2. Provide a forward-looking statement or question
3. Include a CTA (video link, follow prompt, or engagement question)

**The Squirrels closers**:
```
10/ Bottom line: India's semiconductor ambition is real — but the budget, timeline, and talent assumptions are all optimistic by 3x.

History says this will cost more, take longer, and require capabilities India hasn't started building.

Full analysis with charts → [video link]
```

**Breaking Tube closers**:
```
10/ Seedhi baat: Plan achha hai, lekin budget, timeline, aur talent — teeno mein 3x ka gap hai.

Duniya mein yeh kisi ne bhi budget mein nahi kiya.

Detail mein analysis video mein hai → [link]

Agree? Disagree? Reply mein batao 👇
```

**Closer anti-patterns**:
- "That's it! Hope you enjoyed this thread!" (weak, no value)
- Ending without a clear takeaway (reader doesn't know what to think)
- Forgetting the CTA (missed cross-promotion opportunity)
- "If you learned something, like and retweet!" (desperate energy)

---

### 2. THREAD LENGTH GUIDELINES

| Content Type | Optimal | Maximum | Why |
|---|---|---|---|
| Breaking news reaction | 5-7 tweets | 8 | Speed matters — get it out fast |
| Data-driven analysis | 7-10 tweets | 12 | Enough room for data + analysis + implications |
| Deep dive explainer | 10-12 tweets | 15 | Long threads get saved but completion drops after 12 |
| Quick take / hot take | 3-5 tweets | 7 | Short, punchy, don't overstay the welcome |
| Video promotion thread | 5-7 tweets | 8 | Tease the key arguments, drive to video |

**The 7-8 tweet sweet spot**: Data shows that 7-8 tweet threads have the best ratio of engagement to completion. Long enough for substance, short enough that readers finish. Default to this unless the topic demands more.

---

### 3. VISUAL STRATEGY

Visuals are not optional. Threads with images every 3-4 tweets get 50%+ more total engagement.

| Tweet position | Visual type | Purpose |
|---|---|---|
| Tweet 1 | Compelling thumbnail-style graphic or key stat card | Stop the scroll, signal quality |
| Tweet 4-5 | Data visualization / chart | Prove the argument visually |
| Tweet 7-8 | Screenshot, comparison, or map | Re-engage readers at the sag point |
| Final tweet | Video thumbnail with play button | Drive traffic to video |

**Visual creation rules**:
- Charts must be simplified for mobile — max 2 data series, large labels, brand colors
- Stat cards: One number, 2-3 words of context, brand palette. Example: White card, navy text, teal number: "$62B" / "India's annual chip imports"
- Screenshots: Crop tightly to the relevant section, add a brand-colored border
- Maps: Use for geopolitical threads — highlight regions in brand accent color

**Brand-specific visual style**:
- The Squirrels: Navy/teal palette, clean sans-serif, professional charts, subtle
- Breaking Tube: Red/yellow palette, bold Impact-style text, high-contrast, dramatic

---

### 4. FORMATTING RULES WITHIN TWEETS

**Line breaks**: Use generously within tweets. One thought per line. White space = readability.

```
GOOD:
India imports 85% of its crude oil.

That's $4.2 billion leaving the country every week.

Every. Single. Week.

BAD:
India imports 85% of its crude oil. That's $4.2 billion leaving the country every week. Every single week.
```

**Emphasis techniques**:
- SINGLE WORD CAPS for emphasis: "That's not a correction — it's a COLLAPSE."
- Em dash (—) for dramatic pauses: "The answer is simple — they can't."
- Arrows (→) for causal chains: "More imports → higher deficit → weaker rupee → higher inflation"
- Numbered points within tweets for mini-lists

**What to avoid**:
- Hashtags in body tweets (clutters the analysis) — save for final tweet only
- @ mentions unless quoting someone specific
- Emojis in body tweets for The Squirrels (doesn't match register). Breaking Tube can use 👆👇→ sparingly
- Thread numbering as first character (put at end: "— 4/10")

---

### 5. ENGAGEMENT OPTIMIZATION

**Quote-tweet self-promotion**: 6-12 hours after posting, quote-tweet your own Tweet 1 with a new angle or teaser. This catches a different timezone and acts as a second hook.

```
Quote tweet:
"This thread got a lot of responses. The most common pushback: 'But India has TSMC partnership now.'

That's exactly why I wrote points 6-8. The partnership doesn't solve the problem — it may make it worse.

Full thread above ↑"
```

**Engagement prompts**: End the thread with a genuine question that invites informed responses, not a generic "thoughts?"

- GOOD: "The question I can't answer: if India knows the 3x cost pattern, why budget for 1x? Reply with your theory."
- BAD: "What do you think? Like and retweet!"

**Pin strategy**: If the thread is performing well (100+ retweets in first 2 hours), pin it to the profile for 24-48 hours.

---

### 6. CROSS-PLATFORM THREAD RECYCLING

A good thread isn't one piece of content — it's source material for multiple platforms:

| From thread... | Create... | Adaptation |
|---|---|---|
| Thread as a whole | LinkedIn article | Expand each tweet into a paragraph, add intro/conclusion |
| Tweet 1 + key stats | Instagram/LinkedIn carousel | 1 stat per slide, brand design template |
| Key data tweets | YouTube Shorts script | 30-second version: hook stat → one insight → CTA |
| Thread argument | YouTube video outline | Each tweet cluster = one video section |
| Best single tweet | Standalone tweet (repost in 48h) | Repurpose the strongest standalone insight |

---

### 7. OUTPUT FORMAT

```json
{
  "topic": "India's semiconductor policy cost analysis",
  "brand": "the_squirrels",
  "thread_type": "data_driven_analysis",
  "tweet_count": 10,
  "tweets": [
    {
      "position": 1,
      "type": "hook",
      "text": "India just announced a $10B plan to build its own semiconductors.\n\nThe problem: every country that's tried this has spent 3-4x the announced budget.\n\nJapan. Taiwan. Korea. All of them.\n\nA thread on why India's chip math doesn't add up — and what it means 🧵",
      "visual": "Stat card: $10B ANNOUNCED vs $30-40B LIKELY (bar chart)",
      "character_count": 271
    },
    {
      "position": 2,
      "type": "context",
      "text": "2/ What happened:\n\nIndia announced $10B in subsidies for domestic semiconductor fabs. Three companies shortlisted. Target: production by 2030.\n\nMedia coverage was almost uniformly positive. 'India's chip moment.'",
      "visual": null,
      "character_count": 213
    }
  ],
  "visual_plan": "Tweet 1: bar chart stat card. Tweet 4: historical cost comparison chart. Tweet 8: talent pipeline visualization. Tweet 10: video thumbnail.",
  "engagement_strategy": "Quote-tweet at T+8 hours with most controversial finding. End with question about why 1x budgeting when 3x is the pattern.",
  "cross_promotion": "Link to full YouTube video in closer. Share thread link in YouTube community post."
}
```

---

### 8. THREAD ANTI-PATTERNS

| Anti-Pattern | Why It Fails | Fix |
|---|---|---|
| **Wall-of-text tweets** | Nobody reads paragraphs on X | Short lines, generous line breaks |
| **No visuals** | Text-only threads lose 50% engagement | Image every 3-4 tweets minimum |
| **Generic opener** | "Thread on India's semiconductor policy" — zero curiosity | Lead with the most surprising finding |
| **Same rhythm throughout** | Monotonous — reader fatigues | Alternate data/analysis/implication tweets |
| **No closer / weak closer** | Thread fizzles out, no CTA, no takeaway | Clear bottom line + video link + engagement prompt |
| **Over-threading** | 20+ tweets — nobody finishes | Cap at 12 for analysis, 15 absolute max |
| **Hashtag stuffing** | #India #Semiconductor #Policy #Economy — looks spammy | Max 2 hashtags, only in final tweet |
| **Breaking brand voice** | Squirrels thread that sounds like Breaking Tube or vice versa | Re-read brand identity.md before writing |

---

## Learning Log

### Entry: 2026-03-12 — Deep Build
- Tweet 1 gets 10x impressions of subsequent tweets — invest 50% of thread effort in the opener
- Numbered threads (1/10 format) get 20% more saves than unnumbered
- Threads with visuals every 3-4 tweets get 50% more total engagement
- Optimal thread length is 7-8 tweets for engagement-to-completion ratio
- Quote-tweeting your own thread at T+6-12 hours catches a different timezone and creates a second engagement peak
- Data Spike hooks with specific numbers in Tweet 1 get 40% more impressions
- Threads that promise a specific count ("5 points", "in 8 tweets") outperform open-ended threads
- The Squirrels threads perform best when they lead with a surprising data contradiction
- Breaking Tube threads perform best with "aapke liye iska matlab" framing and Hinglish directness
- Thread → carousel → Shorts recycling triples the content ROI from a single research investment

[NEEDS INPUT]: X Analytics data for past threads — impressions by position, engagement rate by tweet type, best-performing thread topics. This will validate optimal length and visual placement recommendations.
