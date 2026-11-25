// player.js — the chef: movement, carrying, and every station interaction.
import { INGREDIENTS, preparedId } from './recipes.js';
import { sfx } from './audio.js';

// Station layout (canvas 1280x720). The top counter holds the work stations;
// the serve window is on the right wall, the trash bin bottom-left.
export const STATIONS = {
  crates: ['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'sauce'].map((id, i) => ({
    kind: 'crate', id, x: 56 + i * 92, y: 148, w: 84, h: 74,
  })),
  board: { kind: 'board', x: 628, y: 148, w: 110, h: 74 },
  grill: { kind: 'grill', x: 758, y: 136, w: 210, h: 100 },
  plate: { kind: 'plate', x: 992, y: 148, w: 116, h: 74 },
  serve: { kind: 'serve', x: 1148, y: 330, w: 116, h: 150 },
  trash: { kind: 'trash', x: 36, y: 606, w: 78, h: 78 },
};

export const GRILL_COOK_TIME = 6;   // seconds raw -> perfectly grilled
export const GRILL_BURN_TIME = 11;  // seconds raw -> burnt
export const CHOP_TIME = 1.4;       // seconds of holding E to chop

export function newPlayer() {
  return { x: 640, y: 470, dir: 1, carrying: null, speed: 270, target: null, moving: false };
}

export function newStations() {
  return {
    board: { item: null, progress: 0 },
    grill: [
      { item: null, t: 0 },
      { item: null, t: 0 },
    ],
    plate: [],
  };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function stationCenter(s) { return { x: s.x + s.w / 2, y: s.y + s.h / 2 }; }

export function nearestStation(p) {
  const all = [...STATIONS.crates, STATIONS.board, STATIONS.grill, STATIONS.plate, STATIONS.serve, STATIONS.trash];
  let best = null;
  let bestD = 1e9;
  for (const s of all) {
    const c = stationCenter(s);
    const d = Math.hypot(p.x - c.x, p.y - c.y);
    if (d < bestD) { bestD = d; best = s; }
  }
  return bestD < 130 ? best : null;
}

export function updatePlayer(state, keys, dt) {
  const p = state.player;
  let dx = 0;
  let dy = 0;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;
  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;
  if (dx !== 0 || dy !== 0) {
    p.target = null;
    const len = Math.hypot(dx, dy);
    p.x += (dx / len) * p.speed * dt;
    p.y += (dy / len) * p.speed * dt;
    p.dir = dx !== 0 ? Math.sign(dx) : p.dir;
    p.moving = true;
  } else if (p.target) {
    const tx = p.target.x;
    const ty = p.target.y;
    const d = Math.hypot(tx - p.x, ty - p.y);
    if (d < 8) {
      p.target = null;
      p.moving = false;
    } else {
      p.x += ((tx - p.x) / d) * p.speed * dt;
      p.y += ((ty - p.y) / d) * p.speed * dt;
      p.dir = tx - p.x !== 0 ? Math.sign(tx - p.x) : p.dir;
      p.moving = true;
    }
  } else {
    p.moving = false;
  }
  // Walkable floor: below the counter, inside the room.
  p.x = clamp(p.x, 40, 1240);
  p.y = clamp(p.y, 268, 690);

  // Holding E at the chopping board chops what is on it.
  const near = nearestStation(p);
  if (near && near.kind === 'board' && keys.interactHeld && state.stations.board.item) {
    const b = state.stations.board;
    const ing = INGREDIENTS[b.item];
    if (ing && ing.chop) {
      b.progress += dt / CHOP_TIME;
      if (Math.random() < dt * 6) sfx.chop();
      if (b.progress >= 1) {
        b.item = preparedId(b.item);
        b.progress = 0;
        sfx.ding();
        state.floaters.push({ x: near.x + 55, y: near.y - 8, text: 'Chopped!', color: '#7dc383', t: 0 });
      }
    }
  } else if (state.stations.board.item) {
    state.stations.board.progress = Math.max(0, state.stations.board.progress - dt * 0.5);
  }
}

// Grill timers tick here; a patty left too long burns.
export function updateStations(state, dt) {
  for (const slot of state.stations.grill) {
    if (slot.item === 'patty') {
      const before = slot.t;
      slot.t += dt;
      if (before < GRILL_COOK_TIME && slot.t >= GRILL_COOK_TIME) {
        sfx.ding();
        state.floaters.push({ x: 863, y: 128, text: 'Patty ready!', color: '#f7c948', t: 0 });
      }
      if (before < GRILL_BURN_TIME && slot.t >= GRILL_BURN_TIME) {
        sfx.burn();
        state.floaters.push({ x: 863, y: 128, text: 'Burnt!', color: '#e4574a', t: 0 });
      }
    }
  }
}

export function grillSlotState(slot) {
  if (!slot.item) return 'empty';
  if (slot.t >= GRILL_BURN_TIME) return 'burnt';
  if (slot.t >= GRILL_COOK_TIME) return 'cooked';
  return 'cooking';
}

// One press of E / Space / click: the context action at the nearest station.
export function interact(state) {
  const p = state.player;
  const near = nearestStation(p);
  if (!near) return;
  const st = state.stations;

  if (near.kind === 'crate') {
    if (p.carrying) return;
    p.carrying = near.id;
    sfx.pickup();
    return;
  }

  if (near.kind === 'board') {
    const b = st.board;
    if (!b.item && p.carrying) {
      const ing = INGREDIENTS[p.carrying];
      if (ing && ing.chop) { b.item = p.carrying; b.progress = 0; p.carrying = null; sfx.place(); }
    } else if (b.item && !p.carrying) {
      const ing = INGREDIENTS[b.item];
      if (!ing.chop || b.item === preparedId(b.item)) { p.carrying = b.item; b.item = null; b.progress = 0; sfx.pickup(); }
    }
    return;
  }

  if (near.kind === 'grill') {
    if (p.carrying === 'patty') {
      const free = st.grill.find((s) => !s.item);
      if (free) { free.item = 'patty'; free.t = 0; p.carrying = null; sfx.sizzle(); }
    } else if (!p.carrying) {
      const ready = st.grill.find((s) => s.item && grillSlotState(s) !== 'cooking');
      if (ready) {
        p.carrying = grillSlotState(ready) === 'burnt' ? 'burnt' : 'pattyCooked';
        ready.item = null;
        ready.t = 0;
        sfx.pickup();
      }
    }
    return;
  }

  if (near.kind === 'plate') {
    if (p.carrying && p.carrying !== 'burnt') {
      st.plate.push(p.carrying);
      p.carrying = null;
      sfx.place();
    } else if (!p.carrying && st.plate.length > 0) {
      p.carrying = st.plate.pop();
      sfx.pickup();
    }
    return;
  }

  if (near.kind === 'serve') {
    state.servePressed = true;
    return;
  }

  if (near.kind === 'trash') {
    if (p.carrying) { p.carrying = null; sfx.place(); }
    return;
  }
}
