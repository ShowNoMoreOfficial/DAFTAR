import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

export interface StakeholderCardProps {
  name: string;
  title: string;
  relevance?: string;
  accentColor?: string;
  position?: "bottom-left" | "bottom-right" | "center";
}

export const StakeholderCard: React.FC<StakeholderCardProps> = ({
  name,
  title,
  relevance,
  accentColor = "#00d4aa",
  position = "bottom-left",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const slideIn = spring({ frame, fps, config: { damping: 15, mass: 0.8 } });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const lineWidth = interpolate(frame, [5, 25], [0, 100], {
    extrapolateRight: "clamp",
  });

  const positionStyles: Record<string, React.CSSProperties> = {
    "bottom-left": { bottom: 80, left: 60 },
    "bottom-right": { bottom: 80, right: 60 },
    center: {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    },
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor:
          position === "center" ? "#0a0f1a" : "transparent",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          position: "absolute",
          ...positionStyles[position],
          opacity: slideIn * fadeOut,
          transform:
            position !== "center"
              ? `translateX(${interpolate(slideIn, [0, 1], [-40, 0])}px)`
              : positionStyles[position].transform,
        }}
      >
        {/* Accent line */}
        <div
          style={{
            width: `${lineWidth}%`,
            maxWidth: 60,
            height: 3,
            backgroundColor: accentColor,
            marginBottom: 12,
            borderRadius: 2,
          }}
        />

        {/* Name */}
        <div
          style={{
            color: "#ffffff",
            fontSize: position === "center" ? 48 : 32,
            fontWeight: 700,
            letterSpacing: -0.5,
            marginBottom: 4,
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
          }}
        >
          {name}
        </div>

        {/* Title / role */}
        <div
          style={{
            color: accentColor,
            fontSize: position === "center" ? 24 : 18,
            fontWeight: 500,
            opacity: interpolate(frame, [10, 20], [0, 1], {
              extrapolateRight: "clamp",
            }),
            textShadow: "0 1px 4px rgba(0,0,0,0.5)",
          }}
        >
          {title}
        </div>

        {/* Relevance (if center layout) */}
        {relevance && position === "center" && (
          <div
            style={{
              color: "#8b9bb5",
              fontSize: 16,
              marginTop: 16,
              maxWidth: 500,
              lineHeight: 1.5,
              opacity: interpolate(frame, [20, 35], [0, 1], {
                extrapolateRight: "clamp",
              }),
            }}
          >
            {relevance}
          </div>
        )}

        {/* Bottom border strip */}
        <div
          style={{
            marginTop: 12,
            height: 1,
            background: `linear-gradient(90deg, ${accentColor}60 0%, transparent 100%)`,
            width: interpolate(frame, [15, 40], [0, 200], {
              extrapolateRight: "clamp",
            }),
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
