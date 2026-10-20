# Blueprint Lab input

UTF-8 JSON object. Display text is English. Paths resolve relative to the input file.

| Field | Contract |
| --- | --- |
| `title` | 1–70 characters |
| `summary` | 1–240 characters; used in publish.md |
| `sources` | 1–8 objects: `title`, HTTPS `url`, `note`; distinguish a factual source from an illustrative model |
| `scenes` | 4–6 objects; total duration 30–45 seconds |
| `scenes[].tag` | Short section label, maximum 28 characters |
| `headline` | Maximum 52 characters |
| `caption` | Maximum 110 characters; one complete idea, also exported to SRT |
| `narration` | Optional spoken script, maximum 400 characters |
| `duration` | 4–12 seconds |
| `audio` | Optional existing local WAV/MP3/M4A; no URLs. Audio must be shorter than `duration - 0.3`. |
| `visual.type` | `flow`, `bars`, or `equation` |
| `visual.items` | 2–4 items: `label` ≤22 chars, `value` ≤16 chars, `amount` integer 0–12, optional `tone`: `cyan` or `amber` |
| `visual.note` | ≤70 chars; assumptions, units or a conditional caveat |

`flow`: one horizontal chain with signals moving between nodes. For a bypass,
use a two-node chain and state the omitted hop in the note.

`bars`: discrete units accumulate per row; amounts share a fixed 12-unit
scale. This represents counts, never an unlabeled arbitrary metric.

`equation`: large values with a plus sign between the first two and equals
before the last. Supply exactly 3 items; choose mathematically true values.
For subtraction, use a negative second value, for example `30 + −20 = 10`.

Amounts animate from zero to their stated count. They are **not an inferred
simulation**. Keep the input's numeric claim consistent with the source or
explicit model. For a time series, make separate states explicit in the story.

The conservative key-content area is x=80…900 and y=280…1240 on a
1080×1920 canvas. Platform controls still require a real-device check.

The renderer rejects an existing output folder. It never executes scripts
supplied in input text. Local audio is copied into the new project. A project
is editable HTML, not a cloud editor or a social publishing integration.
