// shots.js — deterministic staged states for screenshots.
// ?shot=start|play|rush|end&seed=1 renders the game's own code with a
// fixed scene (frozen, so no timers advance while the shot is taken).
import { recipeById } from './recipes.js';

function ticket(id, recipeId, patience, patienceMax) {
  return { id, recipeId, patience, patienceMax, age: patienceMax - patience };
}

export function applyShot(state) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot) return;

  if (shot === 'start') {
    state.screen = 'start';
    state.frozen = true;
    state.best = 96;
    return;
  }

  if (shot === 'play' || shot === 'rush') {
    state.screen = 'play';
    state.frozen = true;
    const rush = shot === 'rush';
    state.timeLeft = rush ? 62 : 98;
    state.elapsed = rush ? 88 : 52;
    state.coins = rush ? 86 : 42;
    state.served = rush ? 6 : 3;
    state.perfectServes = rush ? 3 : 2;
    state.combo = rush ? 5 : 3;
    state.bestCombo = rush ? 5 : 3;
    // A full order board: three tickets, one nearly out of patience.
    state.orders.tickets = [
      ticket(1, 'classic', 38, 48),
      ticket(2, 'cheese', 22, 48),
      ticket(3, 'garden', 12, 48),
    ];
    if (rush) state.orders.tickets.push(ticket(4, 'saucy', 18, 34));
    // The plate holds a finished Classic Burger, ready to serve.
    state.stations.plate = ['bun', 'pattyCooked', 'lettuceChopped'];
    // …while the next dish is mid-assembly: tomato half-chopped, patties on the grill.
    state.stations.board.item = 'tomato';
    state.stations.board.progress = 0.6;
    state.stations.grill[0] = { item: 'patty', t: 4 };
    state.stations.grill[1] = { item: 'patty', t: 7.5 };
    // The chef stands by the plate, tomato in hand.
    state.player.x = 1010;
    state.player.y = 380;
    state.player.carrying = 'tomato';
    state.player.dir = -1;
    state.rush = rush
      ? { active: true, nextIn: 0, endsIn: 14 }
      : { active: false, nextIn: 12, endsIn: 0 };
    state.floaters = rush
      ? []
      : [{ x: 1150, y: 290, text: 'PERFECT! +21', color: '#a83228', t: 0.3 }];
    // Keep the recipe lookup honest: every ticket id must resolve.
    for (const t of state.orders.tickets) recipeById(t.recipeId);
    return;
  }

  if (shot === 'end') {
    state.screen = 'over';
    state.frozen = true;
    state.coins = 156;
    state.served = 11;
    state.perfectServes = 4;
    state.combo = 0;
    state.bestCombo = 5;
    state.best = 156;
    state.timeLeft = 0;
    return;
  }
}
