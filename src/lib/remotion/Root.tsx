import React from "react";
import { Composition } from "remotion";
import { DataCard } from "./compositions/DataCard";
import { StakeholderCard } from "./compositions/StakeholderCard";
import { TimelineAnimation } from "./compositions/TimelineAnimation";
import { InfographicSlide } from "./compositions/InfographicSlide";
import { BreakingBanner } from "./compositions/BreakingBanner";

/* eslint-disable @typescript-eslint/no-explicit-any */
const C = Composition as React.FC<any>;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <C
        id="DataCard"
        component={DataCard}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "TOTAL SUBSIDY",
          value: "$2.7B",
          subtitle: "Allocated in FY 2025-26",
          color: "#00d4aa",
        }}
      />

      <C
        id="StakeholderCard"
        component={StakeholderCard}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          name: "Dr. Example Name",
          title: "Minister of Finance",
          relevance: "Key decision maker in the subsidy allocation process",
          accentColor: "#00d4aa",
          position: "bottom-left",
        }}
      />

      <C
        id="TimelineAnimation"
        component={TimelineAnimation}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "Policy Timeline",
          events: [
            { date: "Jan 2025", event: "Policy announced", highlight: true },
            { date: "Feb 2025", event: "Parliamentary debate begins" },
            { date: "Mar 2025", event: "Amendment proposed", highlight: true },
            {
              date: "Apr 2025",
              event: "Final vote and implementation",
              highlight: true,
            },
          ],
          accentColor: "#00d4aa",
        }}
      />

      <C
        id="InfographicSlide"
        component={InfographicSlide}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "Budget Allocation Breakdown",
          subtitle: "FY 2025-26 (in Crore)",
          dataPoints: [
            { label: "Defence", value: 80, displayValue: "6.2L Cr" },
            { label: "Education", value: 55, displayValue: "1.2L Cr" },
            { label: "Health", value: 45, displayValue: "89K Cr" },
            { label: "Infra", value: 70, displayValue: "2.8L Cr" },
          ],
          chartType: "horizontal-bar",
          source: "Union Budget 2025-26",
        }}
      />

      <C
        id="BreakingBanner"
        component={BreakingBanner}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          headline: "Parliament Passes Landmark Reform Bill",
          subheadline:
            "The bill amends 14 existing provisions and introduces 3 new regulatory frameworks",
          brandName: "DAFTAR",
          urgency: "breaking",
        }}
      />

      {/* Vertical formats for Shorts / Reels */}
      <C
        id="DataCard-Vertical"
        component={DataCard}
        durationInFrames={90}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: "KEY STAT",
          value: "47%",
          subtitle: "Year-over-year growth",
          color: "#3b82f6",
        }}
      />

      <C
        id="BreakingBanner-Vertical"
        component={BreakingBanner}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          headline: "Breaking News Headline",
          subheadline: "Key details here",
          urgency: "breaking",
        }}
      />
    </>
  );
};
