import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

export interface DataCardProps {
  title: string;
  value: string;
  subtitle: string;
  color?: string;
  unit?: string;
  change?: string;
  changeDirection?: "up" | "down" | "neutral";
}

export const DataCard: React.FC<DataCardProps> = ({
  title,
  value,
  subtitle,
  color = "#00d4aa",
  unit = "",
  change,
  changeDirection = "neutral",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slideIn = spring({ frame, fps, config: { damping: 12 } });
  const valueScale = spring({
    frame: frame - 15,
    fps,
    config: { damping: 8 },
  });
  const changeOpacity = interpolate(frame, [30, 45], [0, 1], {
    extrapolateRight: "clamp",
  });
  const barWidth = interpolate(frame, [20, 60], [0, 100], {
    extrapolateRight: "clamp",
  });

  const changeColor =
    changeDirection === "up"
      ? "#22c55e"
      : changeDirection === "down"
        ? "#ef4444"
        : "#8b9bb5";
  const changeArrow =
    changeDirection === "up"
      ? "▲"
      : changeDirection === "down"
        ? "▼"
        : "—";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0f1a",
        justifyContent: "center",
        alignItems: "center",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          transform: `translateY(${interpolate(slideIn, [0, 1], [100, 0])}px)`,
          opacity: slideIn,
          textAlign: "center",
          padding: "60px",
          borderRadius: 24,
          background:
            "linear-gradient(135deg, rgba(15,25,45,0.9) 0%, rgba(10,15,30,0.95) 100%)",
          border: `1px solid ${color}33`,
          boxShadow: `0 0 60px ${color}15`,
          minWidth: 500,
        }}
      >
        <div
          style={{
            color: "#8b9bb5",
            fontSize: 24,
            marginBottom: 24,
            textTransform: "uppercase",
            letterSpacing: 3,
            fontWeight: 500,
          }}
        >
          {title}
        </div>
        <div
          style={{
            color,
            fontSize: 96,
            fontWeight: 800,
            transform: `scale(${valueScale})`,
            lineHeight: 1,
            marginBottom: 8,
          }}
        >
          {value}
          {unit && (
            <span style={{ fontSize: 36, opacity: 0.7, marginLeft: 8 }}>
              {unit}
            </span>
          )}
        </div>

        {/* Change indicator */}
        {change && (
          <div
            style={{
              color: changeColor,
              fontSize: 20,
              fontWeight: 600,
              opacity: changeOpacity,
              marginTop: 12,
              marginBottom: 16,
            }}
          >
            {changeArrow} {change}
          </div>
        )}

        {/* Accent bar */}
        <div
          style={{
            width: "100%",
            height: 3,
            background: "#1a2540",
            borderRadius: 2,
            overflow: "hidden",
            marginTop: 20,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: `${barWidth}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${color} 0%, ${color}80 100%)`,
              borderRadius: 2,
            }}
          />
        </div>

        <div
          style={{ color: "#4a5e80", fontSize: 18, marginTop: 8, opacity: 0.8 }}
        >
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
