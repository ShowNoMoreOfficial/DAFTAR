# Skill: Model Router
## Module: daftar
## Trigger: Any skill execution that requires an LLM call
## Inputs: skill_domain, task_complexity, required_capabilities, cost_budget
## Outputs: selected_model, reasoning
## Dependencies:
## Scripts:

---

## Instructions

Route skill executions to the optimal LLM based on task requirements.

### Model Registry

| Model | Strengths | Cost | Use When |
|-------|-----------|------|----------|
| Gemini 2.5 Flash | Fast, long context, research synthesis | Low | Fact dossier building, signal analysis, bulk processing |
| Claude Sonnet 4 | High precision, voice mimicry, creative writing | Medium | Content drafting, brand voice output, editorial decisions |
| Claude Opus 4 | Deep reasoning, complex strategy | High | Strategic planning, cross-domain analysis, GI behavioral decisions |

### Routing Rules

1. **Signal processing** (Khabri domain) → Gemini 2.5 Flash (speed + cost)
2. **Research & fact-building** → Gemini 2.5 Flash (long context)
3. **Content creation** (narrative/voice) → Claude Sonnet 4 (precision + voice)
4. **Editorial decisions** → Claude Sonnet 4 (judgment quality)
5. **GI strategic insights** → Claude Opus 4 (reasoning depth)
6. **Platform optimization** → Claude Sonnet 4 (pattern recognition)
7. **Analytics interpretation** → Gemini 2.5 Flash (data processing)

### Cost Management
- Default to cheapest capable model
- Escalate only when task complexity requires it
- Track cost per skill execution for monthly reporting

---

## Learning Log

### Entry: Initial
- Model routing rules established based on current stack
- To be refined as we measure quality/cost tradeoffs per skill
