/**
 * Video Generator — Remotion Composition Spec Builder
 *
 * Generates downloadable Remotion project specs that the production team
 * can render locally with `npx remotion render`.
 *
 * Since Remotion rendering is CPU-intensive and won't work on Vercel serverless,
 * this generates the composition parameters (Option C) rather than rendering.
 */

import type { DataCardProps } from "./remotion/compositions/DataCard";
import type { StakeholderCardProps } from "./remotion/compositions/StakeholderCard";
import type { TimelineAnimationProps } from "./remotion/compositions/TimelineAnimation";
import type { InfographicSlideProps } from "./remotion/compositions/InfographicSlide";
import type { BreakingBannerProps } from "./remotion/compositions/BreakingBanner";

// ─── Composition Spec Types ─────────────────────────────

export interface CompositionSpec {
  compositionId: string;
  inputProps: Record<string, unknown>;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  outputFilename: string;
  renderCommand: string;
}

export interface VideoProjectSpec {
  deliverableId: string;
  brandName: string;
  platform: string;
  compositions: CompositionSpec[];
  renderAllCommand: string;
  createdAt: string;
}

// ─── Spec Builders ──────────────────────────────────────

function buildRenderCommand(
  compositionId: string,
  props: Record<string, unknown>,
  outputFilename: string,
): string {
  const propsJson = JSON.stringify(props).replace(/"/g, '\\"');
  return `npx remotion render src/lib/remotion/index.ts ${compositionId} out/${outputFilename} --props="${propsJson}"`;
}

function buildCompositionSpec(
  compositionId: string,
  props: Record<string, unknown>,
  outputFilename: string,
  options: {
    durationInFrames?: number;
    fps?: number;
    width?: number;
    height?: number;
  } = {},
): CompositionSpec {
  const {
    durationInFrames = 90,
    fps = 30,
    width = 1920,
    height = 1080,
  } = options;

  return {
    compositionId,
    inputProps: props,
    durationInFrames,
    fps,
    width,
    height,
    outputFilename,
    renderCommand: buildRenderCommand(compositionId, props, outputFilename),
  };
}

// ─── Data Card Generators ───────────────────────────────

export function generateDataCardSpec(
  props: DataCardProps,
  index: number = 0,
  vertical: boolean = false,
): CompositionSpec {
  const compositionId = vertical ? "DataCard-Vertical" : "DataCard";
  return buildCompositionSpec(
    compositionId,
    props as unknown as Record<string, unknown>,
    `data-card-${index}.mp4`,
    {
      durationInFrames: 90,
      width: vertical ? 1080 : 1920,
      height: vertical ? 1920 : 1080,
    },
  );
}

export function generateStakeholderCardSpec(
  props: StakeholderCardProps,
  index: number = 0,
): CompositionSpec {
  return buildCompositionSpec(
    "StakeholderCard",
    props as unknown as Record<string, unknown>,
    `stakeholder-card-${index}.mp4`,
    { durationInFrames: 120 },
  );
}

export function generateTimelineSpec(
  props: TimelineAnimationProps,
): CompositionSpec {
  const eventCount = props.events?.length ?? 4;
  return buildCompositionSpec(
    "TimelineAnimation",
    props as unknown as Record<string, unknown>,
    "timeline.mp4",
    { durationInFrames: Math.max(180, 60 + eventCount * 30) },
  );
}

export function generateInfographicSpec(
  props: InfographicSlideProps,
  index: number = 0,
): CompositionSpec {
  return buildCompositionSpec(
    "InfographicSlide",
    props as unknown as Record<string, unknown>,
    `infographic-${index}.mp4`,
    { durationInFrames: 120 },
  );
}

export function generateBreakingBannerSpec(
  props: BreakingBannerProps,
  vertical: boolean = false,
): CompositionSpec {
  const compositionId = vertical
    ? "BreakingBanner-Vertical"
    : "BreakingBanner";
  return buildCompositionSpec(
    compositionId,
    props as unknown as Record<string, unknown>,
    `breaking-banner${vertical ? "-vertical" : ""}.mp4`,
    {
      durationInFrames: 150,
      width: vertical ? 1080 : 1920,
      height: vertical ? 1920 : 1080,
    },
  );
}

// ─── Editorial Pack → Video Specs ───────────────────────

export interface EditorialVideoInput {
  deliverableId: string;
  brandName: string;
  platform: string;
  /** Visual anchors from production brief */
  visualAnchors?: Array<{
    type: string;
    description: string;
    data: string;
    section: number;
  }>;
  /** Key stakeholders from production brief */
  keyStakeholders?: Array<{
    name: string;
    title: string;
    relevance: string;
    nameCardText: string;
  }>;
  /** Event markers from production brief */
  eventMarkers?: Array<{
    date: string;
    event: string;
    visualTreatment: string;
  }>;
  /** Animation briefs from production brief */
  animationBriefs?: Array<{
    section: number;
    type: string;
    description: string;
    duration: string;
  }>;
  /** Script sections for banner generation */
  scriptSections?: Array<{
    type: string;
    title: string;
    dataCards?: string[];
    lowerThirds?: Array<{ text: string; timing: string }>;
  }>;
}

export function generateEditorialVideoSpecs(
  input: EditorialVideoInput,
): VideoProjectSpec {
  const compositions: CompositionSpec[] = [];
  const isVertical =
    input.platform === "META_REEL" ||
    input.platform === "YOUTUBE_SHORT";

  // 1. Data cards from visual anchors
  if (input.visualAnchors) {
    input.visualAnchors
      .filter((va) => va.type === "data-card")
      .forEach((va, i) => {
        // Parse data string for value extraction
        const dataMatch = va.data.match(
          /(\$?[\d,.]+[TBMK%]?)/,
        );
        compositions.push(
          generateDataCardSpec(
            {
              title: va.description.slice(0, 40),
              value: dataMatch?.[1] ?? va.data.slice(0, 15),
              subtitle: `Section ${va.section} — ${input.brandName}`,
              color: "#00d4aa",
            },
            i,
            isVertical,
          ),
        );
      });
  }

  // 2. Data cards from script section dataCards
  if (input.scriptSections) {
    let cardIdx = compositions.length;
    for (const section of input.scriptSections) {
      if (section.dataCards) {
        for (const cardText of section.dataCards) {
          const valueMatch = cardText.match(
            /(\$?[\d,.]+[TBMK%]?\s*(?:crore|lakh|billion|million|trillion)?)/i,
          );
          compositions.push(
            generateDataCardSpec(
              {
                title: section.title?.slice(0, 30) ?? section.type,
                value: valueMatch?.[1] ?? "",
                subtitle: cardText.slice(0, 60),
                color: "#00d4aa",
              },
              cardIdx++,
              isVertical,
            ),
          );
        }
      }
    }
  }

  // 3. Stakeholder name cards (lower thirds)
  if (input.keyStakeholders) {
    input.keyStakeholders.forEach((sk, i) => {
      compositions.push(
        generateStakeholderCardSpec(
          {
            name: sk.name,
            title: sk.title,
            relevance: sk.relevance,
            accentColor: "#00d4aa",
            position: "bottom-left",
          },
          i,
        ),
      );
    });
  }

  // 4. Lower thirds from script sections
  if (input.scriptSections) {
    let ltIdx = compositions.length;
    for (const section of input.scriptSections) {
      if (section.lowerThirds) {
        for (const lt of section.lowerThirds) {
          const parts = lt.text.split("—").map((p) => p.trim());
          compositions.push(
            generateStakeholderCardSpec(
              {
                name: parts[0] ?? lt.text,
                title: parts[1] ?? "",
                accentColor: "#00d4aa",
                position: "bottom-left",
              },
              ltIdx++,
            ),
          );
        }
      }
    }
  }

  // 5. Timeline from event markers
  if (input.eventMarkers && input.eventMarkers.length > 0) {
    compositions.push(
      generateTimelineSpec({
        title: `${input.brandName} — Event Timeline`,
        events: input.eventMarkers.map((em, i) => ({
          date: em.date,
          event: em.event,
          highlight: i === 0 || i === input.eventMarkers!.length - 1,
        })),
        accentColor: "#00d4aa",
      }),
    );
  }

  // 6. Infographics from chart/map visual anchors
  if (input.visualAnchors) {
    input.visualAnchors
      .filter((va) => va.type === "chart" || va.type === "timeline")
      .forEach((va, i) => {
        compositions.push(
          generateInfographicSpec(
            {
              title: va.description,
              dataPoints: [
                {
                  label: "Data",
                  value: 100,
                  displayValue: va.data.slice(0, 20),
                },
              ],
              chartType: "horizontal-bar",
              source: input.brandName,
            },
            i,
          ),
        );
      });
  }

  // 7. Breaking banner from the hook section
  if (input.scriptSections) {
    const hookSection = input.scriptSections.find(
      (s) => s.type === "HOOK" || s.type === "hook",
    );
    if (hookSection) {
      compositions.push(
        generateBreakingBannerSpec(
          {
            headline: hookSection.title ?? "Breaking Analysis",
            brandName: input.brandName,
            urgency: "analysis",
          },
          isVertical,
        ),
      );
    }
  }

  // Build the all-render command
  const renderAllCommand = compositions
    .map((c) => c.renderCommand)
    .join(" && ");

  return {
    deliverableId: input.deliverableId,
    brandName: input.brandName,
    platform: input.platform,
    compositions,
    renderAllCommand,
    createdAt: new Date().toISOString(),
  };
}
