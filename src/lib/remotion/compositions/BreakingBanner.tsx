import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

export interface BreakingBannerProps {
  headline: string;
  subheadline?: string;
  brandName?: string;
  urgency?: "breaking" | "developing" | "update" | "analysis";
  accentColor?: string;
}

export const BreakingBanner: React.FC<BreakingBannerProps> = ({
  headline,
  subheadline,
  brandName = "DAFTAR",
  urgency = "breaking",
  accentColor = "#ef4444",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const slideIn = spring({ frame, fps, config: { damping: 12, mass: 0.6 } });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const pulseOpacity = interpolate(
    Math.sin(frame * 0.15),
    [-1, 1],
    [0.6, 1],
  );

  const urgencyLabels: Record<string, string> = {
    breaking: "BREAKING",
    developing: "DEVELOPING",
    update: "UPDATE",
    analysis: "ANALYSIS",
  };

  const urgencyColors: Record<string, string> = {
    breaking: "#ef4444",
    developing: "#f59e0b",
    update: "#3b82f6",
    analysis: "#8b5cf6",
  };

  const color = urgencyColors[urgency] || accentColor;
  const label = urgencyLabels[urgency] || "BREAKING";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "transparent",
        justifyContent: "flex-end",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          opacity: slideIn * fadeOut,
          transform: `translateY(${interpolate(slideIn, [0, 1], [60, 0])}px)`,
          margin: "0 40px 60px",
        }}
      >
        {/* Breaking tag */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: color,
            padding: "6px 16px",
            borderRadius: "4px 4px 0 0",
            marginBottom: 0,
          }}
        >
          {/* Pulse dot */}
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#ffffff",
              opacity: pulseOpacity,
            }}
          />
          <span
            style={{
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: 2,
            }}
          >
            {label}
          </span>
        </div>

        {/* Main banner */}
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(10,15,26,0.95) 0%, rgba(15,22,40,0.95) 100%)",
            borderLeft: `4px solid ${color}`,
            borderRight: "1px solid rgba(255,255,255,0.05)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            padding: "20px 28px",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Headline */}
          <div
            style={{
              color: "#ffffff",
              fontSize: 28,
              fontWeight: 700,
              lineHeight: 1.3,
              marginBottom: subheadline ? 8 : 0,
            }}
          >
            {headline}
          </div>

          {/* Subheadline */}
          {subheadline && (
            <div
              style={{
                color: "#8b9bb5",
                fontSize: 16,
                fontWeight: 400,
                lineHeight: 1.4,
                opacity: interpolate(frame, [15, 25], [0, 1], {
                  extrapolateRight: "clamp",
                }),
              }}
            >
              {subheadline}
            </div>
          )}

          {/* Brand watermark */}
          <div
            style={{
              position: "absolute",
              right: 28,
              bottom: 12,
              color: "rgba(255,255,255,0.1)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 3,
            }}
          >
            {brandName}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
