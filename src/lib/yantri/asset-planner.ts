/**
 * Decides what visual assets are needed for each content type and platform.
 * Creates asset RECORDS (without images) — user generates images on demand.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface PlannedAsset {
  type: "THUMBNAIL" | "SOCIAL_CARD" | "CAROUSEL_SLIDE" | "IMAGE" | "BROLL";
  label: string;
  prompt: string;
  dimensions: { width: number; height: number };
  required: boolean;
  description: string;
  platformNote: string;
  slideIndex?: number;
}

export function planAssets(
  contentType: string,
  platform: string,
  content: any,
  topic: string,
  brandName: string,
): PlannedAsset[] {
  const assets: PlannedAsset[] = [];

  switch (contentType) {
    case "youtube_explainer":
    case "quick_take": {
      // YouTube needs: thumbnail (required), + optional variants
      assets.push({
        type: "THUMBNAIL",
        label: "YouTube Thumbnail",
        prompt: buildThumbnailPrompt(content, topic, brandName),
        dimensions: { width: 1280, height: 720 },
        required: true,
        description: "Main video thumbnail — the single most important image for CTR",
        platformNote: "YouTube: 1280x720, bold text overlay added separately, face + emotion + contrast",
      });

      const concepts = content?.thumbnailConcepts || content?.thumbnailBriefs || [];
      concepts.slice(1, 3).forEach((concept: any, i: number) => {
        assets.push({
          type: "THUMBNAIL",
          label: `Thumbnail Variant ${i + 2}`,
          prompt: `${concept.concept || concept.description || topic}. Style: YouTube thumbnail, bold, high contrast, political analysis aesthetic for ${brandName}`,
          dimensions: { width: 1280, height: 720 },
          required: false,
          description: concept.concept || `Alternative thumbnail option ${i + 2}`,
          platformNote: "A/B test different thumbnails for better CTR",
        });
      });
      break;
    }

    case "youtube_short": {
      assets.push({
        type: "THUMBNAIL",
        label: "Short Thumbnail",
        prompt: `Vertical YouTube Short cover: "${content?.titles?.[0]?.text || topic}". Bold text area, eye-catching, 9:16 vertical for ${brandName}`,
        dimensions: { width: 1080, height: 1920 },
        required: true,
        description: "Cover frame shown in Shorts shelf",
        platformNote: "YouTube Shorts: 1080x1920 vertical, text should be in center-safe zone",
      });
      break;
    }

    case "x_thread": {
      assets.push({
        type: "SOCIAL_CARD",
        label: "Thread Header Image",
        prompt: `Twitter/X social card for thread about "${topic}". Clean data-driven design, political analysis style, landscape for ${brandName}`,
        dimensions: { width: 1200, height: 675 },
        required: true,
        description: "Header image for Tweet 1 — drives engagement on the hook tweet",
        platformNote: "X/Twitter: 1200x675 (16:9), appears above the fold in timeline",
      });

      const tweets = content?.tweets || [];
      tweets.forEach((tweet: any, i: number) => {
        if (tweet.hasImage || tweet.imageDescription ||
            tweet.type === "DATA" || tweet.type === "EVIDENCE") {
          assets.push({
            type: "SOCIAL_CARD",
            label: `Tweet ${i + 1} — Data Visual`,
            prompt: tweet.imageDescription ||
              `Data visualization for: "${tweet.text?.substring(0, 100)}". Clean infographic style, single key stat, ${brandName} aesthetic`,
            dimensions: { width: 1200, height: 675 },
            required: false,
            description: `Visual for tweet ${i + 1} (${tweet.type || "data"})`,
            platformNote: "Data visuals in threads increase engagement by 40%+",
          });
        }
      });
      break;
    }

    case "x_single": {
      assets.push({
        type: "SOCIAL_CARD",
        label: "Tweet Image",
        prompt: `Eye-catching Twitter/X image for: "${topic}". Bold, shareable, data-driven political analysis aesthetic for ${brandName}`,
        dimensions: { width: 1200, height: 675 },
        required: false,
        description: "Optional image — tweets with images get 2x engagement",
        platformNote: "X/Twitter: single image posts get significantly more impressions",
      });
      break;
    }

    case "carousel":
    case "instagram_carousel": {
      const slides = content?.slides || [];
      slides.forEach((slide: any, i: number) => {
        assets.push({
          type: "CAROUSEL_SLIDE",
          label: `Slide ${i + 1}${slide.type ? ` — ${slide.type}` : ""}`,
          prompt: slide.visualDescription || slide.visualPrompt ||
            `Instagram carousel slide ${i + 1}: "${slide.headline || slide.text || ""}". ${slide.type === "HOOK" ? "Bold, attention-grabbing" : slide.type === "DATA" ? "Clean data infographic" : slide.type === "CTA" ? "Call-to-action, save/share prompt" : "Informative, clean layout"}. Portrait 4:5 for ${brandName}`,
          dimensions: { width: 1080, height: 1350 },
          required: i === 0,
          description: slide.headline || slide.text?.substring(0, 80) || `Slide ${i + 1}`,
          platformNote: "Instagram: 1080x1350 (4:5 portrait), consistent style across all slides",
          slideIndex: slide.position ?? i,
        });
      });
      break;
    }

    case "instagram_reel": {
      assets.push({
        type: "SOCIAL_CARD",
        label: "Reel Cover",
        prompt: `Instagram Reel cover frame: "${content?.titles?.[0]?.text || topic}". Vertical, bold, eye-catching for ${brandName}`,
        dimensions: { width: 1080, height: 1920 },
        required: true,
        description: "Cover image shown in profile grid and Reels tab",
        platformNote: "Instagram: 1080x1920 (9:16), text in center-safe zone for grid crop",
      });
      break;
    }

    case "linkedin_post":
    case "linkedin_article": {
      assets.push({
        type: "SOCIAL_CARD",
        label: "LinkedIn Header",
        prompt: `Professional LinkedIn header image about "${topic}". Corporate, data-driven, clean design for ${brandName}`,
        dimensions: { width: 1200, height: 627 },
        required: contentType === "linkedin_article",
        description: contentType === "linkedin_article" ? "Article cover image" : "Optional post image",
        platformNote: "LinkedIn: 1200x627 (1.91:1), professional tone, avoid memes/casual",
      });
      break;
    }

    case "blog_post": {
      assets.push({
        type: "IMAGE",
        label: "Featured Image",
        prompt: `Blog featured image: "${topic}". Editorial, professional, wide format for ${brandName}`,
        dimensions: { width: 1200, height: 630 },
        required: true,
        description: "Hero image at top of article + social sharing preview",
        platformNote: "Blog/SEO: 1200x630, also used as og:image for social sharing",
      });
      break;
    }
  }

  return assets;
}

function buildThumbnailPrompt(content: any, topic: string, brand: string): string {
  const title = content?.titles?.[0]?.text || topic;
  const concept = content?.thumbnailConcepts?.[0] || content?.thumbnailBriefs?.[0];

  if (concept) {
    return `YouTube thumbnail: ${concept.concept || concept.description}. ` +
      `Composition: ${concept.composition || "face + data + bold color"}. ` +
      `Style: Professional political analysis for ${brand}, high contrast, eye-catching`;
  }

  return `YouTube thumbnail for "${title}". Bold, dramatic, political analysis style. ` +
    `High contrast colors, professional editorial aesthetic for ${brand}`;
}
