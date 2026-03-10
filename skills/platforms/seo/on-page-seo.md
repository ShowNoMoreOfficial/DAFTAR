# Skill: On-Page SEO
## Module: relay
## Trigger: Article/page publishing, web content optimization
## Inputs: content_draft, target_keywords[], page_url, brand_slug
## Outputs: optimized_content, meta_tags, schema_markup, internal_links[]
## Dependencies: platforms/seo/keyword-research.md, platforms/seo/content-seo.md
## Scripts:

---

## Instructions

Optimize individual web pages and articles for search engine ranking. Applicable to Vritti CMS articles and any brand website content.

### On-Page SEO Checklist

#### Title Tag
- Primary keyword in first 5 words
- Under 60 characters (Google truncates longer titles)
- Brand name at end: "Topic — The Squirrels"
- Unique per page — never duplicate title tags

#### Meta Description
- 150-160 characters
- Include primary keyword naturally
- Compelling summary — this is your "ad" in search results
- Include a CTA or value proposition
- Unique per page

#### URL Structure
- Short, keyword-rich: `/india-semiconductor-policy-2026`
- Lowercase, hyphens between words
- No unnecessary words: avoid /articles/2026/03/the-new-india-semiconductor-policy-analysis
- No dynamic parameters in public-facing URLs

#### Heading Structure
- **H1**: One per page, contains primary keyword
- **H2**: Major sections (3-6 per article), include secondary keywords
- **H3**: Subsections as needed
- Never skip heading levels (H1 → H3 without H2)

#### Content Optimization
- Primary keyword in first 100 words
- Keyword density: 1-2% naturally (don't force)
- Use semantic variations: "semiconductor" + "chip" + "IC manufacturing"
- Minimum 1,000 words for ranking content (2,000+ for competitive topics)
- Short paragraphs (2-3 sentences) for readability
- Bullet points and numbered lists for scanability

#### Image Optimization
- Descriptive file names: `india-semiconductor-market-chart.png`
- Alt text with keyword: "Chart showing India's semiconductor market growth 2020-2026"
- Compressed file size (under 200KB for web)
- Lazy loading for below-fold images

#### Internal Linking
- Link to 3-5 related articles within the content
- Use descriptive anchor text (not "click here")
- Link from high-authority pages to new content
- Create topic clusters: pillar page → supporting articles

### Schema Markup
- **Article schema**: Required for all articles (headline, author, date, image)
- **FAQ schema**: For articles with question-answer sections
- **Video schema**: For pages embedding YouTube videos
- **BreadcrumbList**: For navigation hierarchy

### Mobile Optimization
- All content must be responsive
- No horizontal scrolling
- Tap targets minimum 44x44 pixels
- Font size minimum 16px on mobile
- No intrusive interstitials

---

## Learning Log

### Entry: Initial
- Title tags with primary keyword in first 5 words rank 2 positions higher on average
- Articles over 2,000 words rank for 3x more keywords than short articles
- Internal linking from existing high-authority pages passes ranking signals to new content
- Schema markup increases CTR from search results by 15-25% (rich snippets)
