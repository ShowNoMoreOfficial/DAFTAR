import {
  PlayCircle,
  Smartphone,
  MessageSquare,
  MessageCircle,
  Images,
  Film,
  Briefcase,
  FileText,
  PenTool,
  Mail,
  Mic,
  Zap,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface ContentTypeInfo {
  label: string;
  icon: LucideIcon;
  platform: string;
  description: string;
  outputs: string;
}

export const CONTENT_TYPES: Record<string, ContentTypeInfo> = {
  youtube_explainer: {
    label: "YouTube Explainer",
    icon: PlayCircle,
    platform: "YouTube",
    description: "10-30 minute deep dive video with structured script, visual notes, and SEO package",
    outputs: "Script (with sections + visual notes), 3 title options, description, tags, 3 thumbnail briefs",
  },
  youtube_shorts: {
    label: "YouTube Shorts",
    icon: Smartphone,
    platform: "YouTube",
    description: "60 second vertical video optimized for mobile discovery",
    outputs: "Short script, hook, 3 title options, description, tags",
  },
  x_thread: {
    label: "X/Twitter Thread",
    icon: MessageSquare,
    platform: "X/Twitter",
    description: "5-15 tweet thread with structured arguments and engagement hooks",
    outputs: "Ordered tweets (280 chars each), hashtags, optional media descriptions",
  },
  x_post: {
    label: "X/Twitter Post",
    icon: MessageCircle,
    platform: "X/Twitter",
    description: "Single high-impact tweet with optional media",
    outputs: "Tweet text, hashtags, media suggestion",
  },
  instagram_carousel: {
    label: "Instagram Carousel",
    icon: Images,
    platform: "Instagram",
    description: "5-10 slide carousel with visual descriptions and caption",
    outputs: "Slide text + visual descriptions, cover slide, caption with hashtags",
  },
  instagram_reel: {
    label: "Instagram Reel",
    icon: Film,
    platform: "Instagram",
    description: "60-90 second vertical video with hook-heavy opening",
    outputs: "Script, caption, hashtags, audio suggestion",
  },
  linkedin_post: {
    label: "LinkedIn Post",
    icon: Briefcase,
    platform: "LinkedIn",
    description: "Professional thought leadership post optimized for LinkedIn's algorithm",
    outputs: "Post text, hashtags, CTA",
  },
  linkedin_article: {
    label: "LinkedIn Article",
    icon: FileText,
    platform: "LinkedIn",
    description: "Long-form article with professional analysis and industry insights",
    outputs: "Article body, headline, subtitle, tags",
  },
  blog_post: {
    label: "Blog Post",
    icon: PenTool,
    platform: "Blog",
    description: "SEO-optimized editorial blog post with structured headings",
    outputs: "Article with H2/H3 sections, meta description, SEO keywords, featured image brief",
  },
  newsletter: {
    label: "Newsletter",
    icon: Mail,
    platform: "Newsletter",
    description: "Email newsletter issue with sections and CTAs",
    outputs: "Subject line options, preview text, body sections, CTAs",
  },
  podcast_script: {
    label: "Podcast Script",
    icon: Mic,
    platform: "Podcast",
    description: "Full podcast episode script with talking points and transitions",
    outputs: "Script with segments, intro/outro, talking points, timestamps",
  },
  quick_take: {
    label: "Quick Take",
    icon: Zap,
    platform: "General",
    description: "2-5 minute opinion piece for rapid response to breaking news",
    outputs: "Short script, key arguments, CTA",
  },
  youtube_community: {
    label: "Community Post",
    icon: Users,
    platform: "YouTube",
    description: "YouTube community tab post for audience engagement",
    outputs: "Post text, poll options (optional), image suggestion",
  },
};

export function getContentTypeIcon(contentType: string): LucideIcon {
  return CONTENT_TYPES[contentType]?.icon ?? FileText;
}

export function getContentTypeLabel(contentType: string): string {
  return CONTENT_TYPES[contentType]?.label ?? contentType.replace(/_/g, " ");
}

export function getPlatformLabel(platform: string): string {
  const map: Record<string, string> = {
    youtube: "YouTube",
    x_twitter: "X/Twitter",
    twitter: "X/Twitter",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    blog: "Blog",
    newsletter: "Newsletter",
    podcast: "Podcast",
    general: "General",
  };
  return map[platform.toLowerCase()] ?? platform;
}
