---
name: blueprint-explainer
description: Create or revise a 30–45 second English vertical knowledge video in the FeedSkills Blueprint Lab style, using animated flows, quantities and comparisons. Use for a single mechanism or concept with sources, an editable project and local MP4 export.
---

# Blueprint Lab

Turn one explainable claim into a small visual experiment. Use the navy drafting grid, cyan signals and amber bottlenecks carried by this package. Make the motion explain a change: something arrives, accumulates, takes a shorter route, or moves between states.

## Input and story

Read the user's material and [input contract](references/input-contract.md). The two bundled examples are working inputs, not limits on the subject matter.

1. State one question and its answer. Verify externally sourced claims against primary sources; preserve source URLs in `sources`. Clearly label invented numbers and simplified models.
2. Write 4–6 scenes: question → mechanism → observable consequence → changed condition → takeaway. Use short English display text; put nuance in narration and source notes. Do not invent quotations or research results.
3. Choose `flow`, `bars` or `equation` per scene. Make each visual earn its place: labels and values must correspond to the spoken claim. A cache hit should visibly bypass the origin; a growing queue should visibly retain items.
4. Save `input.json`. `scenes[].duration` must total 30–45 seconds. Optional local `audio` per scene must fit that scene. With no audio, the export is explicitly silent; never claim that a silent render includes narration.

## Build, inspect and export

Resolve `<skill>` to this folder; do not depend on the caller's working directory.

```sh
node <skill>/scripts/project.mjs doctor
node <skill>/scripts/project.mjs create ./input.json --out ./my-explainer
cd my-explainer
npm run check
npm run preview
npm run render
```

The scripts invoke pinned `hyperframes@0.8.181` with `HYPERFRAMES_SKIP_SKILLS=1`. The first run downloads the CLI and a headless browser through npm; it requires an internet connection. Node.js 22+, FFmpeg and FFprobe must already be installed. This package does not install global Skills or buy cloud generation.

For an English local voiceover, populate every scene's `narration` and run:

```sh
python3 -m venv .voice-env
.voice-env/bin/python -m pip install kokoro-onnx==0.6.1 soundfile==0.14.0
export HYPERFRAMES_PYTHON="$PWD/.voice-env/bin/python"
node <skill>/scripts/narrate.mjs ./input.json --out ./narrated-input
node <skill>/scripts/project.mjs create ./narrated-input/input.json --out ./my-narrated-explainer
```

This optional path also needs Python 3.10+ and uses HyperFrames' local Kokoro-82M voice `af_heart`, speed 1.05. The first use downloads about 338 MB of model and voice files; no paid API is called. The helper lengthens scenes when needed, then validates the same 45-second limit. It preserves failed-run evidence and refuses an existing output folder. Do not run the first npm downloads concurrently. Supplied audio remains preferable when the user specifies a voice.

Open the printed Studio URL and inspect the timing, text, diagrams and sound. Follow the user's existing authorization for rendering. `npm run render` exports `video.mp4`, extracts `cover.jpg`, and writes an inspection receipt. The project also contains `captions.srt`, `publish.md`, `sources.md` and the editable input and HTML. A check passing is not a viewing or listening review.

## Revisions

For content changes, edit `input.json` and create a **new output folder**. Keep unrelated fields unchanged and compare the inputs. For a custom motion or layout edit, edit the generated HTML directly and rerun check/render; regeneration would replace that customization in the new folder. Keep the previous version.

Before delivery, inspect the first and last frame and every scene transition; watch the exported cut and listen when audio exists. Check factual meaning, spoken timing, readable labels and the conservative safe area. Report actual dimensions, duration, audio presence, source limitations and any unverified platform behavior. Do not publish to social platforms unless asked.

## License and support boundary

Free, source available under [LICENSE](LICENSE). Commercial finished videos are permitted; redistribution, resale and rebranding of the Skill package are not. HyperFrames is a separately downloaded Apache-2.0 dependency. This package contains original HTML/WAAPI code and no bundled GSAP, fonts, music, stock media or model weights.

Version and platform facts live in [product.json](product.json). The first release is tested on macOS with Codex. Other Agent hosts and fresh operating-system setup are not verified.
