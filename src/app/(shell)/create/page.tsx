'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles, PenSquare, Loader2, CheckCircle2,
  AlertTriangle, ChevronRight, Zap, ArrowLeft
} from 'lucide-react';

interface Recommendation {
  rank: number;
  brand: { id: string; name: string };
  platform: string;
  contentType: string;
  angle: string;
  reasoning: string;
  priority: string;
  urgency: string;
  estimatedLength: string;
  suggestedTitle?: string;
  assetsRequired?: { images: string[]; video: string[] };
}

function CreatePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [topic, setTopic] = useState(searchParams.get('topic') || '');
  const [signalId] = useState(searchParams.get('signalId') || '');
  const autoTrigger = searchParams.get('auto') === 'true';

  const [step, setStep] = useState<'input' | 'loading' | 'recommendations' | 'generating'>('input');
  const [recommendations, setRecs] = useState<Recommendation[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');
  const [generatingItems, setGeneratingItems] = useState<Map<number, 'loading' | 'done' | 'error'>>(new Map());

  // Auto-trigger if coming from Feed with a signal
  useEffect(() => {
    if (autoTrigger && topic) {
      getRecommendations();
    }
  }, []);

  async function getRecommendations() {
    setStep('loading');
    setError('');

    try {
      const res = await fetch('/api/yantri/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, signalId: signalId || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || data.error || 'Failed to get recommendations. Try again.');
        setStep('input');
        return;
      }

      const recs = data.recommendations || [];
      setRecs(recs);

      // Auto-select HIGH priority items
      const autoSelect = new Set<number>();
      recs.forEach((r: Recommendation, i: number) => {
        if (r.priority === 'high' || r.priority === 'critical' || r.urgency === 'immediate') {
          autoSelect.add(i);
        }
      });
      setSelected(autoSelect);
      setStep('recommendations');
    } catch {
      setError('Network error. Please try again.');
      setStep('input');
    }
  }

  async function generateSelected() {
    setStep('generating');
    const items = Array.from(selected);

    for (const idx of items) {
      const rec = recommendations[idx];
      setGeneratingItems(prev => new Map(prev).set(idx, 'loading'));

      try {
        const res = await fetch('/api/yantri/quick-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            brandId: rec.brand.id,
            contentType: rec.contentType,
            recommendationContext: {
              angle: rec.angle,
              reasoning: rec.reasoning,
              priority: rec.priority,
              urgency: rec.urgency,
              assetsRequired: rec.assetsRequired,
              suggestedTitle: rec.suggestedTitle,
            },
          }),
        });

        if (res.ok) {
          setGeneratingItems(prev => new Map(prev).set(idx, 'done'));
        } else {
          setGeneratingItems(prev => new Map(prev).set(idx, 'error'));
        }
      } catch {
        setGeneratingItems(prev => new Map(prev).set(idx, 'error'));
      }

      // Small delay between generates to avoid rate limits
      await new Promise(r => setTimeout(r, 2000));
    }

    // After all done, redirect to pipeline
    setTimeout(() => {
      router.push('/pipeline');
    }, 2000);
  }

  function toggleSelect(idx: number) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  const platformIcon = (p: string) => {
    if (p.includes('YOUTUBE')) return '📺';
    if (p.includes('X_') || p.includes('TWEET')) return '🐦';
    if (p.includes('META') || p.includes('INSTAGRAM')) return '📱';
    if (p.includes('LINKEDIN')) return '💼';
    if (p.includes('BLOG')) return '📝';
    return '📄';
  };

  const urgencyColor = (u: string) => {
    if (u === 'immediate') return 'text-red-400 bg-red-400/10';
    if (u === 'within_24h') return 'text-amber-400 bg-amber-400/10';
    if (u === 'within_48h') return 'text-blue-400 bg-blue-400/10';
    return 'text-green-400 bg-green-400/10';
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <PenSquare className="w-6 h-6 text-[var(--accent-primary)]" />
          Create
        </h1>
        {signalId && topic && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-sm text-[var(--accent-primary)]">
            Creating from signal: {topic}
          </div>
        )}
      </div>

      {/* Step 1: Input */}
      {step === 'input' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] p-6">
            <label className="block text-sm text-[var(--text-secondary)] mb-2">
              What&apos;s the story?
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a topic, paste a headline, or describe the story..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-[var(--bg-deep)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
            />

            {error && (
              <div className="mt-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={getRecommendations}
              disabled={!topic.trim()}
              className="mt-4 w-full py-3 rounded-lg bg-[var(--accent-primary)] text-white font-medium hover:opacity-90 disabled:opacity-40 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Get Recommendations
            </button>
          </div>

          {/* Quick Create */}
          <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] p-4">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              Quick Create
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: '🐦 Tweet', type: 'x_single', brand: 'The Squirrels' },
                { label: '🧵 Thread', type: 'x_thread', brand: 'The Squirrels' },
                { label: '📺 Short', type: 'youtube_short', brand: 'Breaking Tube' },
                { label: '📱 Carousel', type: 'instagram_carousel', brand: 'The Squirrels' },
                { label: '📺 Explainer', type: 'youtube_explainer', brand: 'The Squirrels' },
                { label: '💼 LinkedIn', type: 'linkedin_post', brand: 'The Squirrels' },
              ].map(item => (
                <button
                  key={item.type}
                  onClick={() => {
                    if (!topic.trim()) return;
                    router.push(`/create?topic=${encodeURIComponent(topic)}&quickType=${item.type}`);
                  }}
                  disabled={!topic.trim()}
                  className="px-3 py-2 rounded-lg bg-[var(--bg-deep)] border border-[var(--border-default)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] disabled:opacity-30 transition text-left"
                >
                  <span>{item.label}</span>
                  <span className="block text-[10px] text-[var(--text-muted)] mt-0.5">{item.brand}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Loading */}
      {step === 'loading' && (
        <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-primary)] mx-auto mb-4" />
          <p className="text-[var(--text-primary)] font-medium">Analyzing topic...</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Checking brand strategy, platform fit, and editorial value
          </p>
        </div>
      )}

      {/* Step 3: Recommendations */}
      {step === 'recommendations' && (
        <div className="space-y-4">
          {recommendations.length === 0 ? (
            <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)] p-8 text-center">
              <p className="text-[var(--text-secondary)]">No recommendations generated</p>
              <button onClick={() => setStep('input')} className="mt-3 text-sm text-[var(--accent-primary)] underline">
                Try a different topic
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-[var(--text-secondary)]">
                AI recommends {recommendations.length} pieces. Select and generate:
              </p>

              {recommendations.map((rec, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleSelect(idx)}
                  className={`w-full text-left rounded-xl border p-4 transition ${
                    selected.has(idx)
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                      : 'border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      selected.has(idx) ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]' : 'border-[var(--text-muted)]'
                    }`}>
                      {selected.has(idx) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg">{platformIcon(rec.platform)}</span>
                        <span className="font-medium text-[var(--text-primary)]">
                          {rec.contentType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm text-[var(--text-muted)]">—</span>
                        <span className="text-sm text-[var(--text-secondary)]">{rec.brand.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${urgencyColor(rec.urgency)}`}>
                          {rec.urgency?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>

                      {rec.angle && (
                        <p className="text-sm text-[var(--text-primary)] mt-1.5 leading-relaxed">
                          &ldquo;{rec.angle}&rdquo;
                        </p>
                      )}

                      {rec.reasoning && (
                        <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                          {rec.reasoning}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                        {rec.estimatedLength && <span>{rec.estimatedLength}</span>}
                        {rec.assetsRequired && (
                          <span>{(rec.assetsRequired.images?.length || 0) + (rec.assetsRequired.video?.length || 0)} assets needed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('input')}
                  className="px-4 py-3 rounded-lg border border-[var(--border-default)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={generateSelected}
                  disabled={selected.size === 0}
                  className="flex-1 py-3 rounded-lg bg-[var(--accent-primary)] text-white font-medium hover:opacity-90 disabled:opacity-40 transition"
                >
                  Generate Selected ({selected.size})
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 4: Generating */}
      {step === 'generating' && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Generating {selected.size} pieces...
          </p>

          {Array.from(selected).map(idx => {
            const rec = recommendations[idx];
            const status = generatingItems.get(idx);

            return (
              <div key={idx} className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)]">
                {status === 'loading' ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-primary)]" />
                ) : status === 'done' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : status === 'error' ? (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-[var(--text-muted)]" />
                )}

                <span className="text-lg">{platformIcon(rec.platform)}</span>
                <span className="text-sm text-[var(--text-primary)]">
                  {rec.contentType.replace(/_/g, ' ')} — {rec.brand.name}
                </span>

                {status === 'done' && (
                  <span className="ml-auto text-xs text-green-400">Created</span>
                )}
                {status === 'error' && (
                  <span className="ml-auto text-xs text-red-400">Failed — will retry</span>
                )}
              </div>
            );
          })}

          {Array.from(generatingItems.values()).every(s => s === 'done' || s === 'error') && (
            <button
              onClick={() => router.push('/pipeline')}
              className="w-full py-3 rounded-lg bg-[var(--accent-primary)] text-white font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              View in Pipeline
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="p-6 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}>
      <CreatePageInner />
    </Suspense>
  );
}
