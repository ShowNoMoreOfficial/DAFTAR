import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";

export interface TimelineEvent {
  date: string;
  event: string;
  highlight?: boolean;
}

export interface TimelineAnimationProps {
  title: string;
  events: TimelineEvent[];
  accentColor?: string;
}

export const TimelineAnimation: React.FC<TimelineAnimationProps> = ({
  title,
  events,
  accentColor = "#00d4aa",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = spring({ frame, fps, config: { damping: 15 } });
  const framesPerEvent = 20;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0f1a",
        padding: 60,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Title */}
      <div
        style={{
          color: "#ffffff",
          fontSize: 36,
          fontWeight: 700,
          marginBottom: 50,
          opacity: titleOpacity,
          transform: `translateY(${interpolate(titleOpacity, [0, 1], [20, 0])}px)`,
        }}
      >
        {title}
      </div>

      {/* Timeline container */}
      <div style={{ position: "relative", flex: 1 }}>
        {/* Vertical timeline line */}
        <div
          style={{
            position: "absolute",
            left: 120,
            top: 0,
            bottom: 0,
            width: 2,
            background: `linear-gradient(180deg, ${accentColor} 0%, ${accentColor}30 100%)`,
            height: `${interpolate(frame, [10, 10 + events.length * framesPerEvent], [0, 100], { extrapolateRight: "clamp" })}%`,
          }}
        />

        {/* Events */}
        {events.map((evt, i) => {
          const entryDelay = 15 + i * framesPerEvent;
          const entrySpring = spring({
            frame: frame - entryDelay,
            fps,
            config: { damping: 12 },
          });
          const dotScale = spring({
            frame: frame - entryDelay - 5,
            fps,
            config: { damping: 8 },
          });

          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                marginBottom: 32,
                opacity: entrySpring,
                transform: `translateX(${interpolate(entrySpring, [0, 1], [30, 0])}px)`,
              }}
            >
              {/* Date */}
              <div
                style={{
                  width: 100,
                  textAlign: "right",
                  marginRight: 20,
                  color: evt.highlight ? accentColor : "#8b9bb5",
                  fontSize: 14,
                  fontWeight: 600,
                  paddingTop: 4,
                  letterSpacing: 0.5,
                }}
              >
                {evt.date}
              </div>

              {/* Dot */}
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  backgroundColor: evt.highlight
                    ? accentColor
                    : "#2a3650",
                  border: `2px solid ${evt.highlight ? accentColor : "#3a4a65"}`,
                  transform: `scale(${dotScale})`,
                  marginTop: 4,
                  flexShrink: 0,
                  boxShadow: evt.highlight
                    ? `0 0 12px ${accentColor}60`
                    : "none",
                }}
              />

              {/* Event text */}
              <div
                style={{
                  marginLeft: 20,
                  flex: 1,
                  padding: "8px 16px",
                  background: evt.highlight
                    ? `${accentColor}10`
                    : "rgba(20,30,50,0.5)",
                  borderRadius: 8,
                  borderLeft: `3px solid ${evt.highlight ? accentColor : "#2a3650"}`,
                }}
              >
                <div
                  style={{
                    color: evt.highlight ? "#ffffff" : "#c0cfe0",
                    fontSize: 16,
                    fontWeight: evt.highlight ? 600 : 400,
                    lineHeight: 1.5,
                  }}
                >
                  {evt.event}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
