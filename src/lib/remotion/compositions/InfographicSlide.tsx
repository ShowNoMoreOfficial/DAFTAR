import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

export interface InfographicDataPoint {
  label: string;
  value: number;
  displayValue: string;
  color?: string;
}

export interface InfographicSlideProps {
  title: string;
  subtitle?: string;
  dataPoints: InfographicDataPoint[];
  chartType?: "bar" | "horizontal-bar";
  accentColor?: string;
  source?: string;
}

export const InfographicSlide: React.FC<InfographicSlideProps> = ({
  title,
  subtitle,
  dataPoints,
  chartType = "horizontal-bar",
  accentColor = "#00d4aa",
  source,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 12 } });
  const maxValue = Math.max(...dataPoints.map((d) => d.value), 1);

  const defaultColors = ["#00d4aa", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0f1a",
        padding: 60,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Title block */}
      <div
        style={{
          opacity: titleSpring,
          transform: `translateY(${interpolate(titleSpring, [0, 1], [30, 0])}px)`,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            color: "#ffffff",
            fontSize: 36,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              color: "#8b9bb5",
              fontSize: 18,
              fontWeight: 400,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {/* Divider */}
      <div
        style={{
          height: 2,
          background: `linear-gradient(90deg, ${accentColor} 0%, transparent 70%)`,
          marginBottom: 40,
          width: interpolate(frame, [10, 30], [0, 600], {
            extrapolateRight: "clamp",
          }),
        }}
      />

      {/* Data visualization */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: chartType === "bar" ? 0 : 20 }}>
        {chartType === "horizontal-bar" &&
          dataPoints.map((dp, i) => {
            const entryDelay = 15 + i * 10;
            const barSpring = spring({
              frame: frame - entryDelay,
              fps,
              config: { damping: 12 },
            });
            const barColor = dp.color || defaultColors[i % defaultColors.length];
            const barPercent = (dp.value / maxValue) * 100;

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  opacity: barSpring,
                }}
              >
                {/* Label */}
                <div
                  style={{
                    width: 140,
                    textAlign: "right",
                    color: "#c0cfe0",
                    fontSize: 15,
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  {dp.label}
                </div>

                {/* Bar */}
                <div
                  style={{
                    flex: 1,
                    height: 28,
                    background: "#131d30",
                    borderRadius: 6,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${barPercent * barSpring}%`,
                      height: "100%",
                      background: `linear-gradient(90deg, ${barColor} 0%, ${barColor}90 100%)`,
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      paddingRight: 12,
                    }}
                  >
                    {barPercent > 20 && (
                      <span
                        style={{
                          color: "#ffffff",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {dp.displayValue}
                      </span>
                    )}
                  </div>
                </div>

                {/* Value (outside bar if too small) */}
                {barPercent <= 20 && (
                  <div
                    style={{
                      color: barColor,
                      fontSize: 15,
                      fontWeight: 700,
                      width: 60,
                    }}
                  >
                    {dp.displayValue}
                  </div>
                )}
              </div>
            );
          })}

        {chartType === "bar" && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: 24,
              height: 300,
              paddingTop: 20,
            }}
          >
            {dataPoints.map((dp, i) => {
              const entryDelay = 15 + i * 8;
              const barSpring = spring({
                frame: frame - entryDelay,
                fps,
                config: { damping: 10 },
              });
              const barColor = dp.color || defaultColors[i % defaultColors.length];
              const barHeight = (dp.value / maxValue) * 240;

              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {/* Value label */}
                  <div
                    style={{
                      color: barColor,
                      fontSize: 14,
                      fontWeight: 700,
                      opacity: barSpring,
                    }}
                  >
                    {dp.displayValue}
                  </div>
                  {/* Bar */}
                  <div
                    style={{
                      width: 50,
                      height: barHeight * barSpring,
                      background: `linear-gradient(180deg, ${barColor} 0%, ${barColor}60 100%)`,
                      borderRadius: "6px 6px 0 0",
                    }}
                  />
                  {/* Label */}
                  <div
                    style={{
                      color: "#8b9bb5",
                      fontSize: 11,
                      textAlign: "center",
                      maxWidth: 70,
                      opacity: barSpring,
                    }}
                  >
                    {dp.label}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Source */}
      {source && (
        <div
          style={{
            color: "#4a5e80",
            fontSize: 12,
            marginTop: 20,
            opacity: interpolate(frame, [40, 55], [0, 0.7], {
              extrapolateRight: "clamp",
            }),
          }}
        >
          Source: {source}
        </div>
      )}
    </AbsoluteFill>
  );
};
