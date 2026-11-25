# Sizzle & Serve

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/deedath123/best-cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/deedath123/best-cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

**Sizzle & Serve** is an original 2D canvas cooking game: you are the lone chef of a tiny burger joint, working a 150-second shift. Tickets land on the order board with draining patience bars — grab ingredients from the crates, grill patties (pull them off before they burn), chop lettuce and tomato on the board, stack each dish on the plate, and serve it at the window before the customer walks out.

The hook is **RUSH HOUR**: every 45 seconds a 20-second rush doubles order speed and doubles your pay, with a flashing banner across the kitchen. Fast serves earn **PERFECT** bonuses that grow a combo multiplier, so route planning — what to grill first, what to chop while a patty cooks — is the whole game.

## Play

Serve it locally with `node serve.ts`, then open http://localhost:8080 — or just open `game/index.html` from any static server. No libraries, no network, no audio files: all sound is synthesised with WebAudio.

- **WASD / arrow keys** — move the chef (or click a station to walk there)
- **E / Space** — interact: pick up, place, chop (hold), serve
- **P** — pause · **M** — mute · **Enter** — start / restart

## Files

- `game/index.html` — canvas page (1280×720)
- `game/css/style.css` — page styling
- `game/src/main.js` — game loop, state machine, input, rush hour
- `game/src/kitchen.js` — rendering the kitchen, stations, chef, tickets, HUD
- `game/src/orders.js` — order generation, tickets, patience, serving
- `game/src/recipes.js` — recipe and ingredient definitions
- `game/src/player.js` — movement, carrying, station interactions
- `game/src/audio.js` — WebAudio-synthesised sounds
- `game/src/shots.js` — deterministic staged states for screenshots (`?shot=start|play|rush|end&seed=1`)

## Hand in

`mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` copies `game/` and `screenshots/` to the output directory and writes `dossier.json`.
