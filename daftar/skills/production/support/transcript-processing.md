# Skill: Transcript Processing
## Module: pms
## Trigger: Audio/video recorded, needs transcription and structuring
## Inputs: audio_file, content_type, language
## Outputs: timestamped_transcript, key_quotes, chapter_markers
## Dependencies:
## Scripts: transcribe-audio.py

---

## Instructions

Convert raw audio/video recordings into structured, timestamped transcripts optimized for editing and content creation.

### Processing Steps
1. **Transcribe** with timestamps (every sentence)
2. **Speaker identification** (if multiple speakers)
3. **Clean up**: Remove filler words (um, uh, like) for the clean version; keep raw version too
4. **Mark key quotes**: Highlight quotable sentences with `[QUOTE]` tags
5. **Chapter markers**: Identify natural topic transitions for YouTube chapters
6. **Key facts**: Extract data points and claims for fact-checking

### Output Format
```
[00:00:00] [ANCHOR] Opening remarks about the topic...
[00:00:15] [ANCHOR] [QUOTE] "India's semiconductor dependency is a ticking time bomb."
[00:00:30] [CHAPTER: The Scale of Dependency] According to the latest data...
[00:01:15] [KEY FACT] India imports 100% of its semiconductor chips
```

### Language Notes
- Primary: English transcription with Hindi/Hinglish detection
- Hindi segments: Transcribe in Roman Hindi (not Devanagari) for editor accessibility
- Mark code-switching points: `[HINDI]` and `[ENGLISH]` tags
- Proper nouns: Verify spelling of Indian names, places, organizations

---

## Learning Log

### Entry: Initial
- AI transcription accuracy: ~95% for clear English, ~85% for Hinglish — always review
- Key quote extraction saves editors ~30 minutes per video
- Chapter markers from transcripts improve YouTube SEO and viewer retention
