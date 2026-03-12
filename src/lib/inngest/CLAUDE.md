# Inngest — Background Pipeline Context

## What This Is
Inngest handles all async background jobs: content generation, research, notifications.
Production keys are configured. Jobs run on Vercel serverless.

## Key Files
- client.ts — Inngest client instance
- functions.ts — Main function registrations
- khabri-workflows.ts — Signal processing workflows
- vritti-workflows.ts — Editorial CMS workflows
- yantri-workflows.ts — Content generation workflows

## Also: /src/lib/yantri/inngest/
- deliverable-pipelines.ts — Content deliverable pipeline steps
- functions.ts — Yantri-specific function registrations

## Pipeline Events (in order)
1. `yantri/signal.submitted` → Creates NarrativeTree, runs gap analysis
2. `yantri/dossier.generate` → Calls Gemini for fact research
3. `yantri/strategy.decide` → Loads skills + brand config → StrategyDecision
4. `yantri/content.generate` → Routes to appropriate engine → Deliverable
5. `yantri/deliverable.created` → Notification + review queue
6. `yantri/deliverable.approved` → Creates PMS task

## Rules
- NEVER run Inngest functions synchronously in API routes
- ALWAYS use inngest.send() to trigger events
- Each step should be idempotent (retries happen)
- Env var: INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY
