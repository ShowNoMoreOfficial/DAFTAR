# Domain 1: Signal Intelligence (Khabri)

Signal skills power Khabri's ability to detect, track, and analyze news signals and trends.

## Sub-domains

- `/detection` — Event detection, source credibility, deduplication
- `/tracking` — Trend tracking, lifecycle classification, clustering
- `/analysis` — Velocity detection, escalation, counter-narratives, geo-relevance
- `/scripts` — Automation scripts for signal processing

## Integration

Khabri runs as a module inside Daftar's shell. When a signal is ready for content creation, it emits `signal.ready_for_narrative` via Daftar's event bus, which Yantri picks up.
