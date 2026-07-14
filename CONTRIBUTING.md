# Contributing

Asphalt Sovereign is an early engineering program. Contributions should improve evidence quality, accessibility, maintainability, or technical clarity.

## Before opening a change

1. State the problem and the public trust or engineering outcome it affects.
2. Keep the change within the current product and evidence boundary.
3. Do not add unverified achievements, people, customer claims, funding, performance numbers, emissions figures, or product availability.
4. Do not present simulated data as vehicle evidence.

## Development

```bash
npm install
npm run dev
```

Run the full gate before requesting review:

```bash
npm run validate
```

## Content changes

- Use exact dates in ISO `YYYY-MM-DD` format.
- Explain what was tested and what was not tested.
- Preserve failed or inconclusive outcomes.
- Link a progress-state change to an evidence record when one exists.
- Keep limitations close to the related claim.
- Preserve the seven-stage project lifecycle and keep exactly one stage active.
- Use only authentic photographs with the metadata required by the photography registry.
- Add commit URLs only after the repository and commit are publicly verified.
- Increment a documentation version when its technical boundary changes.

## Code changes

- Preserve TypeScript strictness and static-export compatibility.
- Prefer server components; add client JavaScript only for direct interaction.
- Respect `prefers-reduced-motion`.
- Test keyboard focus, narrow screens, 200% zoom, light mode, and dark mode.
- Do not introduce a paid or runtime service without an explicit architecture review.
- Keep dashboard, evidence, photography, repository, and release data editable through their JSON records.

## Pull requests

Include a short summary, validation performed, screenshots for visual changes, content/evidence implications, and any known limitation.
