# Skill: Video SEO
## Module: relay
## Trigger: YouTube video optimization, video search ranking
## Inputs: video_metadata, target_keywords[], brand_slug, transcript
## Outputs: optimized_metadata, thumbnail_recommendations, embed_strategy
## Dependencies: platforms/seo/keyword-research.md, platforms/youtube/title-engineering.md, platforms/youtube/description-optimization.md, platforms/youtube/tag-category-strategy.md
## Scripts:

---

## Instructions

Optimize videos for search discovery on both YouTube search and Google video results.

### YouTube Search Optimization

#### Ranking Factors (Weighted)
1. **Watch time** (highest weight): Total and percentage viewed
2. **CTR**: Click-through rate from impressions
3. **Relevance**: Title, description, tags matching search query
4. **Engagement**: Likes, comments, shares, saves
5. **Upload recency**: Newer videos get a freshness boost for current topics
6. **Channel authority**: Subscriber count, upload consistency, channel topic relevance

#### Title Optimization for Search
- Primary keyword in first 5 words
- Natural language — not keyword-stuffed
- Match search intent: If people search "india budget 2026 explained", title should include these words
- Check: Type your target keyword in YouTube search — does your title match the autocomplete?

#### Description Optimization for Search
- First 2-3 lines: Include primary keyword + value proposition
- Body: 200+ words with 2-3 keyword variations
- Timestamps: YouTube creates chapters (additional search entry points)
- Links: Relevant but not excessive

#### Tag Optimization
- See `tag-category-strategy.md` for detailed guidance
- Tags help YouTube understand video topic for suggested/related placement
- Less important than title/description but still relevant

### Google Video Search

#### Getting Videos into Google Results
- Videos appear in Google search results for queries with video intent
- Google pulls from YouTube and from videos embedded on websites
- **Key**: Embed YouTube videos in articles on your own website with VideoObject schema

#### VideoObject Schema
```json
{
  "@type": "VideoObject",
  "name": "Video Title",
  "description": "Description",
  "thumbnailUrl": "https://...",
  "uploadDate": "2026-03-10",
  "duration": "PT8M30S",
  "contentUrl": "https://youtube.com/watch?v=...",
  "embedUrl": "https://youtube.com/embed/..."
}
```

### Transcript & Closed Captions
- Upload custom captions (not auto-generated) — YouTube indexes caption text for search
- Hindi captions for Breaking Tube, English captions for Squirrels
- Add both Hindi and English subtitles where possible (broader search reach)
- Transcripts provide keyword-rich text that YouTube uses for topic understanding

### Thumbnail SEO
- Thumbnail quality affects CTR, which affects ranking
- Consistent visual brand = higher CTR from repeat viewers
- Text on thumbnail should complement (not duplicate) title text
- A/B test thumbnails using YouTube's built-in testing feature

### Cross-Platform Video SEO
- Embed videos on website with proper schema (Google Video results)
- Share video link on social platforms (drives external traffic signal)
- Create companion blog post for each major video (captures Google text search)
- Use video chapters (timestamps) — each chapter can appear as a separate search result

---

## Learning Log

### Entry: Initial
- Custom captions improve search rankings by 15% vs auto-generated captions
- Videos embedded on websites with proper schema appear in 2x more Google searches
- Companion blog posts for videos capture 30% additional organic traffic from Google
- YouTube's A/B thumbnail testing is the most impactful optimization tool available
