# Kingdoms-of-Canaan

Kingdoms of Canaan is a static strategy game prototype covering the rise and fall of nations in the ancient Near East from the Hebrew conquest to the Babylonian exile.

## Current prototype

- Scrollable map battlefield
- Zoom control for map scale
- Movable unit counters (drag and drop)
- Game state persisted in browser `localStorage`

## Run locally

Because this is a static site, serve the repository root with any web server:

```bash
python -m http.server 4173
```

Then open `http://127.0.0.1:4173` in your browser.

## AI Balance Baseline (Par Scores)

The following table is based on 100 automated AI-only playthroughs to Turn 9.
Each value is the average final VP for that nation and can be used as a balancing par target.

| Nation | Average VP (100 runs) |
| --- | ---: |
| Hebrew | 18.95 |
| Canaan | 58.07 |
| Amorite | 20.14 |
| Ammon | 5.20 |
| Moab | 4.69 |
| Edom | 9.98 |
| Phoenicia | 10.70 |
| Philistia | 20.22 |
| Israel | 23.94 |
| Judah | 12.78 |
| Egypt | 0.56 |
| Aram-Syria | 0.69 |
| Assyria | 0.42 |
| Babylonia | 0.69 |
