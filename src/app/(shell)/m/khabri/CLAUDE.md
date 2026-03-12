# Khabri — Intelligence Module Context

## What This Is
Khabri is the signal/trend detection engine. In the UI it appears as "Intelligence" — NEVER show "Khabri" to users.

## User-Facing Route
/intelligence (unified page with tabs: Signals, Trends, Research)
Old routes (/m/khabri/*) still exist but are NOT in the sidebar.

## API
- Live external API: https://khabri.stallone.co.in/api/v1 (Bearer token)
- Server client: /src/lib/khabri.ts — 23 endpoints
- Types: /src/types/khabri.ts
- Proxy routes: /src/app/api/khabri/{trends,signals,anomalies,narratives,geo,analytics}

## Key Types
- KhabriSignal: id, title, content, source, category, sentiment, entities, keywords
- KhabriTrend: id, rank, topic, score, category, region, momentum, sourceCount
- KhabriNarrative: id, title, arcPhase, signals, stakeholders, timeline

## Cross-Module Links
- Signal → Content Studio: router.push(`/content-studio?topic=${encodeURIComponent(signal.title)}`)
- Signal → Pipeline trigger: POST /api/pipeline/trigger with signalId, trendTitle, summary

## Rules
- NEVER build a separate "Khabri Dashboard" — all intelligence lives in /intelligence
- Geo and Analytics are filters/views within Intelligence, not separate pages
- All data comes from the live Khabri API, NOT from local database
