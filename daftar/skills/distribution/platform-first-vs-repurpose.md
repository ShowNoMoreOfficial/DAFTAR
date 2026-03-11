# Skill: Platform-First vs Repurpose Decision
## Module: relay
## Trigger: Content creation planning, platform-specific content decisions
## Inputs: content_brief, brand_slug, platforms[], resource_constraints
## Outputs: creation_strategy, platform_priority, repurpose_plan, resource_allocation
## Dependencies: brand/identity/{brand_slug}/platforms.md, production/automation/repurposing-engine.md
## Scripts:

---

## Instructions

Decide when to create platform-native content (optimized for one platform) vs. repurpose existing content across platforms.

### Decision Framework

#### Platform-First (Create Specifically for This Platform)
Choose when:
- Platform is a primary growth channel with unique audience
- Content type is platform-specific (X thread, LinkedIn article, Instagram carousel)
- Platform algorithm rewards native content over cross-posted content
- The angle requires platform-specific framing (B2B for LinkedIn, visual for Instagram)

#### Repurpose (Adapt Existing Content)
Choose when:
- Source content is strong and the core message translates across platforms
- Time/resource constraints prevent platform-native creation
- Content has already proven performance on one platform
- The platform is secondary (not a growth priority)

### Decision Matrix

| Scenario | Strategy | Reasoning |
|---|---|---|
| New YouTube explainer | Platform-first for YouTube, repurpose for others | YouTube is primary; extract clips for Shorts, threads, reels |
| Breaking news reaction | Platform-first for X/Twitter, quick repurpose for Stories | Speed on X is critical; Stories can use same text |
| Data analysis | Platform-first for YouTube + Instagram carousel | YouTube for depth, carousel for visual data (different formats) |
| Professional insight | Platform-first for LinkedIn | LinkedIn requires unique tone — can't just repost X tweets |
| Behind-the-scenes | Platform-first for Instagram Stories | Stories format doesn't translate to other platforms |

### Repurpose Quality Tiers

#### Tier A: Platform-Adapted Repurpose
- Content is meaningfully adapted for the target platform
- Format, aspect ratio, text, CTA all adjusted
- Feels native to the platform
- Example: YouTube explainer → X thread (rewritten, not just summarized)

#### Tier B: Format-Adjusted Repurpose
- Core content stays same, format changes
- Aspect ratio, length, captions adjusted
- Functional but not fully optimized
- Example: YouTube clip → Instagram Reel (reframed vertical, subtitles added)

#### Tier C: Cross-Post
- Same content posted to multiple platforms with minimal changes
- Caption adjusted, hashtags platform-specific
- Quick and resource-light but lower performance
- Example: X tweet → Facebook post (same text, same image)

### Resource Allocation Rule
```
Primary platform (YouTube): 60% of creation effort
Secondary platforms (X, Instagram): 30% of effort (mix of platform-first and Tier A repurpose)
Tertiary platforms (LinkedIn, Facebook): 10% of effort (Tier B-C repurpose)
```

### When NOT to Repurpose
- Content performed poorly on the original platform (don't spread underperformance)
- Platform audiences are fundamentally different (Breaking Tube's Hinglish → LinkedIn English)
- Content is time-sensitive and the repurpose window has passed
- Quality would drop below acceptable brand standards

---

## Learning Log

### Entry: Initial
- Platform-first content outperforms repurposed content by 2x on engagement metrics
- Tier A repurpose performs at 70-80% of platform-first — worth the time savings
- Tier C cross-posting performs at 30-40% of native — acceptable for tertiary platforms
- LinkedIn is the platform where repurposing works worst — always needs tone adaptation
