"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Signal,
  FileText,
  Package,
  ExternalLink,
  Clock,
  ChevronRight,
  Sparkles,
  Save,
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────

const MOCK_SIGNALS = [
  {
    id: "sig-1",
    title: "Iran launches retaliatory drone strike on Israeli military base in Negev",
    source: "Reuters",
    credibility: 0.95,
    detectedAt: "2026-03-10T06:30:00Z",
    sentiment: "negative",
  },
  {
    id: "sig-2",
    title: "US State Department issues emergency travel advisory for Lebanon",
    source: "AP News",
    credibility: 0.92,
    detectedAt: "2026-03-10T05:15:00Z",
    sentiment: "negative",
  },
  {
    id: "sig-3",
    title: "Brent crude surges past $98 on Middle East escalation fears",
    source: "Bloomberg",
    credibility: 0.9,
    detectedAt: "2026-03-10T04:45:00Z",
    sentiment: "negative",
  },
  {
    id: "sig-4",
    title: "India evacuates 2,400 nationals from Lebanon under Operation Sukoon II",
    source: "ANI",
    credibility: 0.85,
    detectedAt: "2026-03-09T22:00:00Z",
    sentiment: "neutral",
  },
  {
    id: "sig-5",
    title: "Saudi Arabia condemns escalation, calls for UNSC emergency session",
    source: "Al Jazeera",
    credibility: 0.88,
    detectedAt: "2026-03-09T20:30:00Z",
    sentiment: "neutral",
  },
  {
    id: "sig-6",
    title: "Indian defence stocks rally 4% as regional tension boosts sector",
    source: "Economic Times",
    credibility: 0.82,
    detectedAt: "2026-03-09T18:00:00Z",
    sentiment: "positive",
  },
  {
    id: "sig-7",
    title: "Houthi militants claim second Red Sea shipping lane attack this week",
    source: "BBC News",
    credibility: 0.91,
    detectedAt: "2026-03-09T15:00:00Z",
    sentiment: "negative",
  },
];

interface DeliverableFormat {
  id: string;
  label: string;
  platform: string;
  checked: boolean;
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "bg-emerald-50 text-emerald-700",
  negative: "bg-red-50 text-red-700",
  neutral: "bg-gray-100 text-gray-600",
};

export default function WorkspacePage() {
  const [selectedSignal, setSelectedSignal] = useState<string | null>(
    MOCK_SIGNALS[0].id
  );
  const [canvasContent, setCanvasContent] = useState(
    `# Iran-Israel Escalation: What India Needs to Know

## Hook
"While the world watches missiles fly over the Middle East, India's $4.2 billion oil import bill just got a lot more complicated."

## Context
The latest escalation between Iran and Israel has moved beyond proxy warfare into direct confrontation. Here's why this matters for every Indian watching.

## Key Points

### 1. Oil Price Impact
- Brent crude past $98 — direct impact on India's import bill
- RBI may need to intervene on INR if crude sustains above $100
- Petrol price revision likely within 2 weeks

### 2. Indian Diaspora at Risk
- 2,400 nationals evacuated from Lebanon (Operation Sukoon II)
- ~8 million Indians in Gulf states — contingency planning underway
- MEA has activated emergency helplines

### 3. Defence & Strategic Angle
- India walking diplomatic tightrope — maintains ties with both Iran and Israel
- Defence stocks rallying — market pricing in extended regional instability
- S-400 supply chain implications if Russia gets pulled deeper into Iran axis

## Closing
"This isn't just a Middle East story. It's an India story. And the next 72 hours will determine whether this stays a crisis or becomes a catastrophe."

## Sources to cite
- Reuters (drone strike confirmation)
- Bloomberg (oil prices)
- ANI (Operation Sukoon II)
`
  );

  const [deliverables, setDeliverables] = useState<DeliverableFormat[]>([
    { id: "d-1", label: "YouTube Long-form", platform: "YouTube", checked: true },
    { id: "d-2", label: "YouTube Short", platform: "YouTube", checked: true },
    { id: "d-3", label: "X Thread (8-10 tweets)", platform: "X/Twitter", checked: true },
    { id: "d-4", label: "X Single Post", platform: "X/Twitter", checked: false },
    { id: "d-5", label: "LinkedIn Article", platform: "LinkedIn", checked: false },
    { id: "d-6", label: "Instagram Reel Script", platform: "Meta", checked: true },
    { id: "d-7", label: "Instagram Carousel", platform: "Meta", checked: false },
    { id: "d-8", label: "Blog Post (Vritti)", platform: "Web", checked: false },
  ]);

  const toggleDeliverable = (id: string) => {
    setDeliverables((prev) =>
      prev.map((d) => (d.id === id ? { ...d, checked: !d.checked } : d))
    );
  };

  const selectedCount = deliverables.filter((d) => d.checked).length;

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 -m-6">
      {/* ─── Left: Signals Panel ─── */}
      <div className="w-[300px] min-w-[300px] border-r border-[#E5E7EB] bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <Signal className="h-4 w-4 text-[#2E86AB]" />
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Signals</h3>
            <Badge variant="outline" className="ml-auto text-[10px]">
              {MOCK_SIGNALS.length}
            </Badge>
          </div>
          <p className="text-[10px] text-[#9CA3AF] mt-1">
            Scraped intelligence for this narrative
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {MOCK_SIGNALS.map((signal) => (
            <button
              key={signal.id}
              onClick={() => setSelectedSignal(signal.id)}
              className={`w-full text-left px-4 py-3 border-b border-[#F3F4F6] transition-colors ${
                selectedSignal === signal.id
                  ? "bg-[#2E86AB]/5 border-l-2 border-l-[#2E86AB]"
                  : "hover:bg-[#F8F9FA]"
              }`}
            >
              <p className="text-xs font-medium text-[#1A1A1A] line-clamp-2 leading-relaxed">
                {signal.title}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-[#6B7280]">{signal.source}</span>
                <span className="text-[10px] text-[#9CA3AF]">
                  {(signal.credibility * 100).toFixed(0)}%
                </span>
                <Badge
                  className={`text-[9px] px-1.5 py-0 font-medium border-0 ${
                    SENTIMENT_COLORS[signal.sentiment]
                  }`}
                >
                  {signal.sentiment}
                </Badge>
              </div>
              <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[#9CA3AF]">
                <Clock className="h-2.5 w-2.5" />
                {new Date(signal.detectedAt).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </button>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-[#E5E7EB]">
          <Button variant="outline" size="sm" className="w-full text-xs">
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Import from Khabri
          </Button>
        </div>
      </div>

      {/* ─── Center: Narrative Canvas ─── */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        <div className="flex items-center justify-between px-6 py-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#2E86AB]" />
            <h3 className="text-sm font-semibold text-[#1A1A1A]">
              Narrative Canvas
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-[#A23B72]" />
              AI Enhance
            </Button>
            <Button size="sm" className="text-xs bg-[#2E86AB] hover:bg-[#256d8a]">
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save Draft
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <textarea
            value={canvasContent}
            onChange={(e) => setCanvasContent(e.target.value)}
            className="w-full h-full min-h-[600px] resize-none border-0 outline-none text-sm text-[#1A1A1A] leading-relaxed font-mono bg-transparent placeholder:text-[#D1D5DB]"
            placeholder="Start writing your narrative here, or click AI Enhance to generate from signals..."
          />
        </div>

        <div className="px-6 py-2 border-t border-[#E5E7EB] flex items-center justify-between text-[10px] text-[#9CA3AF]">
          <span>{canvasContent.length} characters</span>
          <span>
            {canvasContent.split(/\s+/).filter(Boolean).length} words
          </span>
        </div>
      </div>

      {/* ─── Right: Deliverables Panel ─── */}
      <div className="w-[280px] min-w-[280px] border-l border-[#E5E7EB] bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-[#A23B72]" />
            <h3 className="text-sm font-semibold text-[#1A1A1A]">
              Deliverables
            </h3>
            <Badge className="ml-auto text-[10px] bg-[#A23B72]/10 text-[#A23B72] border-[#A23B72]/20">
              {selectedCount} selected
            </Badge>
          </div>
          <p className="text-[10px] text-[#9CA3AF] mt-1">
            Output formats for this narrative
          </p>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {(() => {
            const grouped = deliverables.reduce(
              (acc, d) => {
                if (!acc[d.platform]) acc[d.platform] = [];
                acc[d.platform].push(d);
                return acc;
              },
              {} as Record<string, DeliverableFormat[]>
            );

            return Object.entries(grouped).map(([platform, items]) => (
              <div key={platform} className="mb-1">
                <p className="px-4 py-2 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                  {platform}
                </p>
                {items.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#F8F9FA] transition-colors"
                  >
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => toggleDeliverable(item.id)}
                    />
                    <span
                      className={`text-xs ${
                        item.checked
                          ? "text-[#1A1A1A] font-medium"
                          : "text-[#6B7280]"
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.checked && (
                      <ChevronRight className="h-3 w-3 text-[#9CA3AF] ml-auto" />
                    )}
                  </label>
                ))}
              </div>
            ));
          })()}
        </div>

        <div className="px-4 py-3 border-t border-[#E5E7EB] space-y-2">
          <Button
            className="w-full text-xs bg-[#A23B72] hover:bg-[#8a3261]"
            size="sm"
            disabled={selectedCount === 0}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Generate {selectedCount} Deliverable{selectedCount !== 1 ? "s" : ""}
          </Button>
          <p className="text-[10px] text-[#9CA3AF] text-center">
            AI will adapt the narrative for each format
          </p>
        </div>
      </div>
    </div>
  );
}
