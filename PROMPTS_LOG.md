# PROMPTS_LOG.md — AI use disclosure (HGSSS 2026 requirement)

Contest rule: AI use is permitted, but prompts and tools used must be disclosed in the body of the submission email. This file is the running record; paste (or attach) its final form into both submission emails.

Format: one row per session. "Prompt" = verbatim or faithful summary (keep verbatim where practical). "Used in deliverable" = which output the session's content touched.

| Date | Tool | Prompt (verbatim or summary) | Used in deliverable |
|---|---|---|---|
| 2026-07-03 | Claude (claude.ai, Fable 5) | Brainstorm HGSSS 2026 topics at intersection of my interests (math/stat/AI/ML + resume) — [paste verbatim prompt 1] | Topic selection only |
| 2026-07-03 | Claude (claude.ai) | Deep-dive Georgia data-center sub-topics; rank by marginal benefit/cost vs. my 6 criteria and 20-hr budget — [paste verbatim prompt 2] | Topic selection; research design direction |
| 2026-07-03 | Claude (claude.ai) | Create the core architecture of the inquiry (problem, data, methods, tools, delegation) — [paste verbatim prompt 3] | ARCHITECTURE.md, CLAUDE.md (planning documents) |
| 2026-07-03/04 | Claude Code (Fable 5) + WebSearch/WebFetch + 4 research subagents | "Read through and understand the documents [ARCHITECTURE.md, CLAUDE.md, events_seed.csv]. Execute in a comprehensive and thorough manner." → built repo scaffold + full pipeline (P0); drafted 24-row event dataset with sources via web search (P1, all rows verified_by_human=FALSE); downloaded ZHVI/ZCTA/county inputs (P2); verified policy corpus + HGSSS 2026 rules + George quote (subagent); wrote estimation/robustness/Monte-Carlo code (P3–P5, staged behind human-verification gates); rendered QC report + paper stub. 2 of 4 subagents hit a usage limit and returned nothing; their slices are in data/raw/leads_unconfirmed.md. | Event dataset draft; refs/sources.md; refs/rules.md; pipeline code (no estimates produced yet) |
| | Claude Code | (append per session: phase, plan-mode summary, key prompts) | |
| | ElevenLabs / other | (only if actually used) | |

Notes for the submission email:
- Tools list to date: Claude (claude.ai), Claude Code; add Remotion (code-based rendering, not generative), and any TTS/image tools if used.
- Statement suggestion (updated 2026-07-04 to reflect actual workflow): "AI (Anthropic Claude / Claude Code) was used for literature discovery, data collection, source verification, code generation, and editing under my direction. Event data was compiled and checked against primary sources by AI agents that fetched each cited source; I reviewed the dataset, spot-checked flagged judgment calls, and approved it. All statistics are computed by the released code from that data, and all analytical judgments and the final text/narration are my own. Full prompt log attached."
- Keep this file free of author-identifying info if it will be embedded anywhere other than the email body.
