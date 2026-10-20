# Blueprint Lab — FeedSkills

A free, source-available Agent Skill for 30–45 second English vertical knowledge videos. Explain one mechanism with a navy drafting grid, cyan signals and amber bottlenecks.

**Download and examples:** https://feedskills.com/skills/blueprint-explainer/

Read [SKILL.md](SKILL.md) for the workflow and [input contract](references/input-contract.md) for supported inputs. Try [queues](examples/queue.json) or [caching](examples/cache.json).

## Quick start

Requires macOS, Node.js 22+, FFmpeg and FFprobe.

```sh
node scripts/project.mjs doctor
node scripts/project.mjs create examples/queue.json --out ./my-video
cd my-video
npm run check
npm run preview
npm run render
```

The default example exports silently. For an optional local English voice, follow the Kokoro setup in SKILL.md (Python 3.10+, model download; no paid API).

Outputs: 1080×1920 MP4, cover, SRT, publish copy, source notes and editable JSON/HTML. First use downloads HyperFrames 0.8.181 and its headless browser. It does not initialize or overwrite global Skills. Existing output folders are refused.

Tests: `node --test test.mjs`. Tested on macOS with Codex; other Agent hosts, fresh operating-system setup and social-app overlays remain unverified. These examples demonstrate the pipeline, not customer adoption or guaranteed creative quality.

## License

[FeedSkills Source-Available License 1.0](LICENSE). Commercial finished videos are allowed. Redistribution, resale or rebranding of the Skill files is restricted. This is source available, not OSI open source.

HyperFrames is a separately downloaded Apache-2.0 dependency. This repository contains original native Web Animations API code and no bundled GSAP, fonts, stock media or model weights.
