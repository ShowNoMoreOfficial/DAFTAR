'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Radio, TrendingUp, Clock, ExternalLink,
  RefreshCw, Search, ChevronRight
} from 'lucide-react';

interface Signal {
  id: string;
  title: string;
  source: string;
  category: string;
  sentiment?: { label: string; score: number };
  createdAt: string;
  publishedAt: string;
  sourceUrl?: string;
}

interface Trend {
  id: string;
  topic: string;
  category: string;
  score: number;
  momentum: number | null;
  sourceCount: number;
}

export default function FeedPage() {
  const router = useRouter();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [signalRes, trendRes] = await Promise.all([
        fetch('/api/khabri/signals?pageSize=50').then(r => r.json()).catch(() => ({ data: [] })),
        fetch('/api/khabri/trends?pageSize=10').then(r => r.json()).catch(() => ({ data: [] })),
      ]);

      setSignals(signalRes.data || signalRes.signals || []);
      setTrends(trendRes.data || trendRes.trends || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Feed load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetch('/api/khabri/scan', { method: 'POST' }).catch(() => {});
    await loadData();
    setRefreshing(false);
  }

  function handleCreateContent(title: string, signalId?: string) {
    const params = new URLSearchParams({ topic: title, auto: 'true' });
    if (signalId) params.set('signalId', signalId);
    router.push(`/content-studio?${params.toString()}`);
  }

  const filteredSignals = searchQuery
    ? signals.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : signals;

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="w-6 h-6 text-[#2E86AB]" />
            Feed
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Last updated {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Scanning...' : 'Refresh'}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search signals..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#2E86AB]"
        />
      </div>

      {/* Trending Bar */}
      {trends.length > 0 && (
        <div className="rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-4">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Trending
          </h2>
          <div className="flex flex-wrap gap-2">
            {trends.map(trend => (
              <button
                key={trend.id}
                onClick={() => handleCreateContent(trend.topic)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-zinc-900 hover:bg-[#2E86AB]/10 border border-gray-200 dark:border-zinc-700 text-sm transition group"
              >
                <span className={`w-2 h-2 rounded-full ${
                  trend.category === 'peaking' ? 'bg-red-400' :
                  trend.category === 'emerging' ? 'bg-amber-400' :
                  'bg-green-400'
                }`} />
                <span>{trend.topic}</span>
                {trend.score > 0 && (
                  <span className="text-gray-400 text-xs">+{Math.round(trend.score)}</span>
                )}
                <ChevronRight className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Signals Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-6 h-6 border-2 border-[#2E86AB] border-t-transparent rounded-full" />
        </div>
      ) : filteredSignals.length === 0 ? (
        <div className="text-center py-20">
          <Radio className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-300">No signals yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Signals are detected from 12 news sources every hour
          </p>
          <button onClick={handleRefresh} className="mt-4 text-sm text-[#2E86AB] underline">
            Scan now
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSignals.map(signal => (
            <div
              key={signal.id}
              className="rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-4 hover:border-gray-400 dark:hover:border-zinc-500 transition group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium leading-snug">
                    {signal.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 flex-wrap">
                    <span>{signal.source}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(signal.publishedAt || signal.createdAt)}
                    </span>
                    {signal.category && (
                      <>
                        <span>·</span>
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-900 text-gray-500">
                          {signal.category}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleCreateContent(signal.title, signal.id)}
                  className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2E86AB] text-white text-sm font-medium hover:bg-[#2678a0] transition opacity-80 group-hover:opacity-100"
                >
                  Create Content
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {signal.sourceUrl && (
                <a
                  href={signal.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-gray-400 hover:text-[#2E86AB] transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  View source
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
