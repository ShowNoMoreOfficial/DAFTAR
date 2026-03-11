# Skill: Technical SEO
## Module: relay
## Trigger: Website health audit, crawling/indexing issues, site performance
## Inputs: site_url, crawl_data, page_speed_data, indexing_status
## Outputs: technical_audit, fix_priorities[], performance_recommendations
## Dependencies:
## Scripts:

---

## Instructions

Ensure website technical foundation supports search engine crawling, indexing, and ranking.

### Technical SEO Audit Checklist

#### Crawlability
- [ ] `robots.txt` allows crawling of important pages
- [ ] No critical pages blocked by `noindex` or `nofollow`
- [ ] XML sitemap submitted to Google Search Console
- [ ] Sitemap updated automatically when new content is published
- [ ] No orphan pages (every page reachable from navigation or internal links)
- [ ] Crawl depth: Important pages within 3 clicks from homepage

#### Indexability
- [ ] All important pages return 200 status code
- [ ] Canonical tags correctly implemented (no duplicate content)
- [ ] Pagination handled with rel=next/prev or infinite scroll with proper URL structure
- [ ] No index bloat (thin/duplicate pages wasting crawl budget)
- [ ] hreflang tags for multilingual content (Hindi + English)

#### Page Speed (Core Web Vitals)
- **LCP (Largest Contentful Paint)**: Under 2.5 seconds
- **FID/INP (Interaction to Next Paint)**: Under 200ms
- **CLS (Cumulative Layout Shift)**: Under 0.1
- Optimize: Image compression, lazy loading, code splitting, CDN
- Test with: Google PageSpeed Insights, Web Vitals Chrome extension

#### Mobile Optimization
- Mobile-first indexing (Google crawls mobile version primarily)
- Responsive design — no separate mobile URLs
- Touch targets appropriately sized
- No mobile-specific crawl errors

#### HTTPS & Security
- All pages served over HTTPS
- No mixed content (HTTP resources on HTTPS pages)
- SSL certificate valid and auto-renewing
- HSTS header enabled

#### Structured Data
- Article schema on all articles
- Organization schema on homepage
- BreadcrumbList on all inner pages
- VideoObject schema on pages with embedded videos
- Validate with Google Rich Results Test

### Common Technical Issues

| Issue | Impact | Fix Priority |
|---|---|---|
| 404 errors on linked pages | Lost link equity | High |
| Slow page load (>3s) | Ranking penalty, user drop-off | High |
| Duplicate content | Ranking dilution | Medium |
| Missing alt text | Accessibility + image SEO | Medium |
| Broken internal links | Wasted crawl budget | Medium |
| Missing schema markup | Missed rich snippets | Low |

### Monitoring Cadence
- **Weekly**: Check Google Search Console for crawl errors, index coverage
- **Monthly**: Full page speed audit, Core Web Vitals check
- **Quarterly**: Complete technical SEO audit
- **After major site changes**: Immediate crawl and index verification

### Next.js Specific SEO
- Use `generateMetadata()` for dynamic meta tags
- Implement `sitemap.ts` for automatic sitemap generation
- Use `robots.ts` for programmatic robots.txt
- Leverage Next.js Image component for automatic optimization
- Use ISR (Incremental Static Regeneration) for frequently updated content

---

## Learning Log

### Entry: Initial
- Core Web Vitals are a confirmed Google ranking factor — pages failing CWV rank 15% lower on average
- Mobile page speed is the most impactful technical factor for Indian audiences (slower connections)
- Fixing 404 errors and broken links often provides immediate ranking improvements
- XML sitemap submission accelerates indexing of new content from days to hours
